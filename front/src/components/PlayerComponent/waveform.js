/**
 * 波形（简易版）分析工具
 *
 * 思路：
 * 1. 拉取当前播放的音频文件（低码率优先，减少额外流量）并用 OfflineAudioContext 解码为 PCM；
 * 2. 按固定分段统计每段的峰值 -> 波形条形高度（体现音乐的高低起伏）；
 * 3. 统计逐帧 RMS 包络 -> 播放时用来驱动"整体伸长缩短"的律动；
 * 4. 若拉取/解码失败（跨域、离线、解码器不支持），退化为伪随机波形，保证播放器不报错。
 */

export const WAVE_PEAK_COUNT = 600

// 分析用的帧长与步长（采样点）
const FRAME_SIZE = 1024
const FRAME_HOP = 512

/**
 * 确定性伪随机（同一 seed 永远得到同一结果，用于每根条的抖动相位）
 * @param {number} seed 种子
 * @returns {number} 0~1
 */
export function pseudoRandom(seed) {
  let x = (seed + 0x9e3779b9) >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b) >>> 0
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

/**
 * 生成一个确定性的伪随机波形（降级方案）
 * @param {number} peakCount 细分峰值数量
 * @param {number} seed 随机种子
 * @returns {{peaks: number[], rms: number[]}} 细分峰值与细分 RMS
 */
export function generateFallbackWaveform(peakCount = WAVE_PEAK_COUNT, seed = 1) {
  let s = seed >>> 0 || 1
  const rand = () => {
    // xorshift32，保证同一首歌每次渲染一致
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }

  const peaks = []
  for (let i = 0; i < peakCount; i++) {
    const t = i / peakCount
    // 叠加几段不同频率的正弦，模拟音乐段落起伏
    const wave =
      Math.sin(t * Math.PI * 6 + rand() * 0.4) * 0.35 +
      Math.sin(t * Math.PI * 17) * 0.2 +
      Math.sin(t * Math.PI * 41) * 0.1
    const noise = rand() * 0.55
    peaks.push(Math.min(1, Math.max(0.06, Math.abs(wave) * 0.8 + noise)))
  }

  const normalized = normalize(peaks)
  return {
    peaks: normalized,
    // 用相邻峰值做平滑近似 RMS，让段落起伏更明显
    rms: normalize(normalized.map((v, i) => {
      const prev = normalized[Math.max(0, i - 2)]
      const next = normalized[Math.min(normalized.length - 1, i + 2)]
      return (prev + v * 2 + next) / 4
    }))
  }
}

/**
 * 把细分数据聚合成指定数量的波形条
 *
 * 单独用峰值会在音乐被压缩后"削顶"（每段都接近满高，看起来齐平），
 * 所以这里把「峰值(毛刺) + 段内最大 RMS(段落感) + 段内平均 RMS(整体起伏)」
 * 混合起来，再做一次归一化，保证高低段落分明、相邻条错落。
 *
 * @param {number[]} peaks 细分峰值（0~1）
 * @param {number[]} rms 细分 RMS（0~1）
 * @param {number} count 目标条数
 * @param {number} gamma 对比度曲线（>1 拉开高低差距）
 * @returns {number[]} 0~1 的高度数组
 */
export function bucketPeaks(peaks, rms, count, gamma = 1.08) {
  if (!peaks || !peaks.length) return []
  const size = Math.max(1, Math.min(count, peaks.length))
  const hasRms = Array.isArray(rms) && rms.length === peaks.length
  const bars = []

  for (let i = 0; i < size; i++) {
    const start = Math.floor((i * peaks.length) / size)
    const end = Math.max(start + 1, Math.floor(((i + 1) * peaks.length) / size))
    let peak = 0
    let rmsMax = 0
    let rmsSum = 0

    for (let j = start; j < end && j < peaks.length; j++) {
      if (peaks[j] > peak) peak = peaks[j]
      if (hasRms) {
        if (rms[j] > rmsMax) rmsMax = rms[j]
        rmsSum += rms[j]
      }
    }

    const rmsAvg = hasRms ? rmsSum / (end - start) : 0
    bars.push(hasRms ? peak * 0.32 + rmsMax * 0.44 + rmsAvg * 0.24 : peak)
  }

  return normalize(bars).map((v) => Math.min(1, Math.pow(v, gamma)))
}

/**
 * 归一化：把数组映射到 0~1
 */
function normalize(values) {
  const max = values.reduce((m, v) => (v > m ? v : m), 0)
  if (max <= 0) return values.map(() => 0.1)
  return values.map((v) => v / max)
}

/**
 * 纯计算：由 PCM 采样得到细分峰值、细分 RMS 与响度包络
 * @param {Float32Array} samples 单声道 PCM 采样
 * @param {number} sampleRate 采样率
 * @param {number} peakCount 细分峰值数量
 * @returns {{peaks: number[], rms: number[], envelope: Float32Array, frameDuration: number}}
 */
export function computeWaveform(samples, sampleRate, peakCount = WAVE_PEAK_COUNT) {
  const length = samples.length
  if (!length) {
    return {
      peaks: new Array(peakCount).fill(0.1),
      rms: new Array(peakCount).fill(0.1),
      envelope: new Float32Array(1),
      frameDuration: 0
    }
  }

  // 1) 分段峰值 + 分段 RMS
  const peaks = new Array(peakCount).fill(0)
  const rmsList = new Array(peakCount).fill(0)
  const segmentSize = Math.max(1, Math.floor(length / peakCount))
  for (let i = 0; i < peakCount; i++) {
    const start = i * segmentSize
    const end = i === peakCount - 1 ? length : Math.min(length, start + segmentSize)
    let peak = 0
    let sum = 0
    let count = 0
    for (let j = start; j < end; j++) {
      const v = samples[j]
      const abs = v < 0 ? -v : v
      if (abs > peak) peak = abs
      sum += v * v
      count++
    }
    peaks[i] = peak
    rmsList[i] = count ? Math.sqrt(sum / count) : 0
  }

  const normalizedPeaks = normalize(peaks)
  const normalizedRms = normalize(rmsList)

  // 2) 逐帧 RMS 包络 -> 播放律动
  const frameCount = Math.max(1, Math.floor((length - FRAME_SIZE) / FRAME_HOP) + 1)
  const envelope = new Float32Array(frameCount)
  let envMax = 0
  for (let f = 0; f < frameCount; f++) {
    const start = f * FRAME_HOP
    let sum = 0
    for (let j = 0; j < FRAME_SIZE; j++) {
      const idx = start + j
      if (idx >= length) break
      const v = samples[idx]
      sum += v * v
    }
    const rms = Math.sqrt(sum / FRAME_SIZE)
    envelope[f] = rms
    if (rms > envMax) envMax = rms
  }
  if (envMax > 0) {
    for (let f = 0; f < frameCount; f++) {
      envelope[f] = Math.pow(envelope[f] / envMax, 0.7)
    }
  }

  return {
    peaks: normalizedPeaks,
    rms: normalizedRms,
    envelope,
    frameDuration: FRAME_HOP / (sampleRate || 44100)
  }
}

/**
 * 获取用于波形分析的音频地址
 * 优先使用低码率版本（时长与高码率一致），减少额外流量
 * @param {{id?: string, url?: string}} song 当前歌曲
 * @returns {Promise<string>} 音频地址
 */
export async function resolveAnalysisUrl(song) {
  if (song?.id) {
    try {
      const response = await fetch(`/api/music/url/${song.id}?br=128`)
      if (response.ok) {
        const data = await response.json()
        const url = data?.data?.url
        if (url) return url
      }
    } catch (err) {
      // 忽略，回退到播放地址
    }
  }
  return song?.url || ''
}

/**
 * 下载并解码音频，返回细分峰值与响度包络
 * @param {string} url 音频地址
 * @param {number} peakCount 细分峰值数量
 * @returns {Promise<{peaks: number[], rms: number[], envelope: Float32Array, frameDuration: number, duration: number, real: boolean}>}
 */
export async function analyzeAudioWaveform(url, peakCount = WAVE_PEAK_COUNT) {
  if (!url) throw new Error('缺少音频地址')

  const response = await fetch(url)
  if (!response.ok) throw new Error(`音频拉取失败: ${response.status}`)

  const buffer = await response.arrayBuffer()

  // OfflineAudioContext 无需用户手势即可解码
  const ctx = new OfflineAudioContext(1, 1, 44100)
  let audioBuffer
  try {
    audioBuffer = await ctx.decodeAudioData(buffer.slice(0))
  } finally {
    if (ctx.close) ctx.close().catch(() => {})
  }

  if (!audioBuffer || !audioBuffer.length) throw new Error('音频解码失败')

  // 多声道混合成单声道
  const channels = audioBuffer.numberOfChannels
  const left = audioBuffer.getChannelData(0)
  const right = channels > 1 ? audioBuffer.getChannelData(1) : null
  const mixed = new Float32Array(left.length)
  for (let i = 0; i < left.length; i++) {
    mixed[i] = right ? (left[i] + right[i]) * 0.5 : left[i]
  }

  const result = computeWaveform(mixed, audioBuffer.sampleRate, peakCount)

  return {
    ...result,
    duration: audioBuffer.duration,
    real: true
  }
}

/**
 * 读取某一时刻的响度（0~1），并做线性插值
 * @param {Float32Array} envelope RMS 包络
 * @param {number} frameDuration 每帧时长（秒）
 * @param {number} time 当前播放时间（秒）
 */
export function sampleEnvelope(envelope, frameDuration, time) {
  if (!envelope || !envelope.length || !frameDuration) return 0
  const pos = time / frameDuration
  if (pos <= 0) return envelope[0]
  if (pos >= envelope.length - 1) return envelope[envelope.length - 1]
  const i = Math.floor(pos)
  const frac = pos - i
  return envelope[i] * (1 - frac) + envelope[i + 1] * frac
}
