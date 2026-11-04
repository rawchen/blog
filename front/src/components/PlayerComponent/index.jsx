import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import './index.css'
import playerManager, { generatePlayerId } from './playerManager'
import { getStoredVolume, setStoredVolume, subscribeVolumeChange } from '../../utils/playerVolume'
import {
  analyzeAudioWaveform,
  bucketPeaks,
  generateFallbackWaveform,
  pseudoRandom,
  resolveAnalysisUrl,
  sampleEnvelope,
  WAVE_PEAK_COUNT
} from './waveform'

// 波形疏密以「物理像素」为基准：
// 浏览器缩放（100% / 125% / 200%）与屏幕分辨率不同的时候，
// 同样的 CSS 宽度在屏幕上占据的物理宽度并不相同，
// 按 CSS 像素算条数会让疏密观感随缩放比例变化，因此这里统一换算成物理像素。
const WAVE_PHYSICAL_PITCH = 7 // 每根条占用的物理像素数（条宽 + 间隙）
const WAVE_PHYSICAL_GAP = 2 // 条与条之间的物理像素间隙
const WAVE_PHYSICAL_RADIUS = 2 // 条形圆角的物理像素半径

// 当前设备缩放比（含浏览器页面缩放），即 1 个 CSS 像素对应多少物理像素
const getDevicePixelRatio = () => (typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)

// 描出圆角矩形路径（不依赖 ctx.roundRect，兼容旧浏览器）
const traceRoundRect = (ctx, x, y, w, h, r) => {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

// 字符串 -> 稳定的数字种子（用于降级波形的确定性生成）
const hashString = (str) => {
  let hash = 2166136261
  for (let i = 0; i < (str || '').length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

// 播放/暂停图标
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
)

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
)

// 音量图标
const VolumeIcon = ({ muted }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    {muted ? (
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.61-7.92-6.32-9.48v2.16C17.44 6.08 19 8.85 19 12zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    ) : (
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    )}
  </svg>
)

// 列表图标
const ListIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
  </svg>
)

// 歌词图标
const LyricIcon = () => (
  <svg viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
    <path d="M793.941 160H230.06C191.36 160 160 191.616 160 230.059v563.84C160 832.64 191.616 864 230.059 864h563.84c38.698 0 70.058-31.616 70.058-70.059V230.06C864 191.36 832.384 160 793.941 160z m5.718 640c0-0.299-575.659-0.341-575.659-0.341 0.299 0 0.341-575.659 0.341-575.659 0 0.299 575.659 0.341 575.659 0.341-0.299 0-0.341 575.659-0.341 575.659z m-96-118.528l0.341 0.17V349.654c-1.152-18.602-13.952-28.501-38.357-29.653H459.776c-12.8 1.152-19.755 9.301-20.95 24.405 1.153 15.104 8.15 23.254 20.95 24.406h190.123c3.498 0 5.248 1.749 5.248 5.248V656.64l0.469 0.256h-65.792c-6.699 0-17.579 8.704-18.432 22.656 0.853 15.104 10.112 23.253 18.432 24.405h98.944c8.79-1.066 13.739-8.576 14.89-22.485zM477.227 438.613c-11.648-1.152-18.006-9.301-19.2-24.405 1.152-13.952 7.552-21.504 19.2-22.656h143.018c13.952 1.152 21.504 8.704 22.656 22.656-1.152 15.104-8.149 23.253-20.949 24.405H477.227zM334.72 367.104c-6.827-1.152-22.016-9.301-22.699-24.448 0.683-13.952 13.398-21.504 20.267-22.656h56.235c8.234 1.152 20.01 8.704 20.693 22.656-0.64 15.147-13.141 23.296-20.693 24.448H334.72z m67.499 288.512v-204.8c1.152-25.6-8.704-37.803-29.654-36.65H330.71c-12.8 1.194-19.754 9.343-20.949 24.447 1.152 16.299 8.15 25.003 20.95 26.155h17.45c3.499 0 5.248 1.75 5.248 5.248v206.677a9.985 9.985 0 0 0-0.128 1.622c0.128 3.029 0.853 5.76 1.963 8.234 2.901 9.515 7.893 14.464 19.114 17.238 1.878 0.298 3.712-0.086 5.547-1.067h49.152c7.253-1.152 20.779-9.301 21.461-24.405-0.64-13.952-13.525-21.504-21.461-22.656h-26.837z m97.706-21.632c-24.405 0-36.65-11.648-36.65-34.901V497.92c0-23.253 10.453-34.901 31.402-34.901H597.59c24.406 0 36.054 9.898 34.902 29.653v106.41c0 23.254-10.454 34.902-31.403 34.902H499.925z m12.203-50.603c1.152 2.347 2.901 4.054 5.248 5.248h61.056c3.499 0 5.248-1.749 5.248-5.248v-68.01c0-3.499-1.75-5.248-5.248-5.248h-61.099c-3.498 0-5.248 1.749-5.248 5.248v68.01z"/>
  </svg>
)

const PlayerComponent = React.memo(function PlayerComponent({ id, type, autoplay }) {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [songs, setSongs] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(() => getStoredVolume())
  const [isMuted, setIsMuted] = useState(false)
  const [showLyric, setShowLyric] = useState(false)
  const [showList, setShowList] = useState(true)
  const [lyricsCache, setLyricsCache] = useState({})
  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  const [isVolumeDragging, setIsVolumeDragging] = useState(false)
  const [coverPreview, setCoverPreview] = useState(null)
  // 波形条形数据（高度 0~1）
  const [waveBars, setWaveBars] = useState([])

  const audioRef = useRef(null)
  const lyricBodyRef = useRef(null)
  const volumeBarRef = useRef(null)
  const volumeRef = useRef(volume)
  // 波形容器：用于写入 --wave-progress（驱动播放头位置）
  const waveRootRef = useRef(null)
  // 细分波形数据（峰值 + RMS）与当前显示条数
  const wavePeaksRef = useRef(null)
  const waveCountRef = useRef(40)
  // 解码后的音频包络数据
  const waveDataRef = useRef(null)
  // 波形缓存，避免同一首歌重复下载
  const waveCacheRef = useRef(new Map())
  // 当前展示时间（拖拽时与音频进度解耦）
  const waveTimeRef = useRef(0)
  // 律动动画状态：bounce 为整体伸长量，time 为动画时间轴，
  // amp 为抖动幅度（静止时为 0），reduce 为系统「减少动态效果」
  const waveAnimRef = useRef({ bounce: 0, time: 0, amp: 0, reduce: false })
  // 波形条数据（供绘制使用）
  const waveBarsRef = useRef([])
  // 画布引用与绘制状态
  const waveCanvasRef = useRef(null)
  // 播放进度（0~1），绘制时作为青/灰分界
  const waveProgressRef = useRef(0)
  // 主题色缓存：--tag-cyan / --border-strong 跟随 data-theme 变化
  const waveThemeRef = useRef({ cyan: '', gray: '', dirty: true })

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  // 绘制波形到 canvas：
  // 条形的步距 / 间隙 / 圆角与 DOM 版保持同一套规则（按物理像素折算），
  // 颜色分界直接按播放进度切两段绘制，不再依赖背景偏移那套技巧。
  const drawWave = useCallback(() => {
    const canvas = waveCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const cssW = rect.width
    const cssH = rect.height
    if (!cssW || !cssH) return

    // backing store 按设备像素比分配，缩放比例变化时自动重建
    const dpr = getDevicePixelRatio()
    const targetW = Math.max(1, Math.round(cssW * dpr))
    const targetH = Math.max(1, Math.round(cssH * dpr))
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW
      canvas.height = targetH
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)

    // 主题色：--tag-cyan / --border-strong 跟随 data-theme 变化
    const theme = waveThemeRef.current
    if (theme.dirty) {
      const style = getComputedStyle(canvas)
      theme.cyan = style.getPropertyValue('--tag-cyan').trim() || '#6bc4de'
      theme.gray = style.getPropertyValue('--border-strong').trim() || '#dddddd'
      theme.dirty = false
    }

    const bars = waveBarsRef.current
    const count = bars.length
    if (!count) return

    const anim = waveAnimRef.current
    const now = anim.time
    const amp = anim.amp || 0

    // canvas 上下各留一倍空间（CSS 中 height: 200%），轨道高度是它的一半
    const trackHeight = cssH / 2
    const centerY = cssH / 2
    const gap = WAVE_PHYSICAL_GAP / dpr
    const radius = WAVE_PHYSICAL_RADIUS / dpr
    const minHeight = 2 / dpr
    const pitch = cssW / count
    const barWidth = Math.max(1, pitch - gap)
    const cut = waveProgressRef.current * cssW

    const fillBar = (x, y, w, h, color) => {
      ctx.fillStyle = color
      traceRoundRect(ctx, x, y, w, h, radius)
      ctx.fill()
    }

    for (let i = 0; i < count; i++) {
      const bar = bars[i]
      // 整体随音乐伸长的同时，每根条按自己的相位小幅错落起伏
      const wobble = 1 + amp * bar.jitter * Math.sin(now * 9.5 + bar.phase)
      const scale = (1 + anim.bounce * bar.gain * 0.55) * wobble
      const h = Math.max(minHeight, bar.height * trackHeight) * scale
      const y = centerY - h / 2
      const x = i * pitch
      const right = x + barWidth

      if (right <= cut) {
        // 完全落在已播放区
        fillBar(x, y, barWidth, h, theme.cyan)
      } else if (x >= cut) {
        // 完全落在未播放区
        fillBar(x, y, barWidth, h, theme.gray)
      } else {
        // 跨越分界：整条画灰色，再裁剪出已播放部分叠青色（圆角自然被切断）
        fillBar(x, y, barWidth, h, theme.gray)
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, 0, cut - x, cssH)
        ctx.clip()
        fillBar(x, y, barWidth, h, theme.cyan)
        ctx.restore()
      }
    }
  }, [])

  // 波形条数据变化时重绘
  // 用 useLayoutEffect 让 canvas 在浏览器绘制前完成重绘，避免闪烁
  useLayoutEffect(() => {
    waveBarsRef.current = waveBars
    drawWave()
  }, [waveBars, drawWave])

  // 生成唯一播放器ID
  const playerId = useMemo(() => generatePlayerId(), [])

  // 注册到全局管理器
  useEffect(() => {
    const playerInstance = {
      id: playerId,
      pause: () => {
        if (audioRef.current) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
      },
      collapseLyric: () => setShowLyric(false),
      collapseList: () => setShowList(false)
    }
    return playerManager.register(playerInstance)
  }, [playerId])

  // 订阅全局音量：其它播放器修改音量后实时同步（音量宽度随之重绘）
  useEffect(() => {
    return subscribeVolumeChange((next) => {
      setVolume(prev => (Math.abs(prev - next) < 0.001 ? prev : next))
    })
  }, [])

  // 加载音乐数据
  useEffect(() => {
    if (!id) return

    const loadPlayer = async () => {
      try {
        setLoading(true)
        setError(null)

        const apiUrl = type === 'collect'
          ? `/api/music/meting?type=playlist&id=${id}`
          : `/api/music/meting?type=song&id=${id}`

        const response = await fetch(apiUrl)
        const data = await response.json()

        if (!data || (Array.isArray(data) && data.length === 0)) {
          throw new Error('未找到音乐')
        }

        const songList = Array.isArray(data) ? data : [data]
        setSongs(songList)
        setLoading(false)
      } catch (err) {
        console.error('加载音乐失败:', err)
        setError(err.message || '加载失败')
        setLoading(false)
      }
    }

    loadPlayer()
  }, [id, type])

  // 创建音频元素
  useEffect(() => {
    if (songs.length === 0) return

    const audio = new Audio()
    audioRef.current = audio

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleEnded = () => {
      playerManager.notifyStop(playerId)
      if (currentIndex < songs.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setCurrentIndex(0)
        setIsPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.pause()
      audio.src = ''
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      playerManager.notifyStop(playerId)
    }
  }, [songs, currentIndex, playerId])

  // 将全局音量同步到音频元素（音量变化、静音、切换歌曲时均生效）
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted, songs, currentIndex])

  // 切换歌曲时更新音频源
  useEffect(() => {
    if (!audioRef.current || songs.length === 0) return

    const currentSong = songs[currentIndex]
    if (currentSong) {
      const playSong = async () => {
        let songUrl = currentSong.url
        // 如果没有URL，动态获取
        if (!songUrl && currentSong.id) {
          try {
            const response = await fetch(`/api/music/url/${currentSong.id}?br=320`)
            const data = await response.json()
            if (data && data.data && data.data.url) {
              songUrl = data.data.url
              // 更新歌曲URL缓存
              setSongs(prev => prev.map((s, i) =>
                i === currentIndex ? { ...s, url: songUrl } : s
              ))
            }
          } catch (err) {
            console.error('获取播放链接失败:', err)
          }
        }
        if (songUrl) {
          audioRef.current.src = songUrl
          if (isPlaying) {
            audioRef.current.play().catch(() => {})
          }
        }
      }
      playSong()
    }
  }, [currentIndex, songs])

  // 自动播放
  useEffect(() => {
    if (autoplay === 'true' && songs.length > 0 && audioRef.current) {
      const playAttempt = async () => {
        try {
          await audioRef.current.play()
          setIsPlaying(true)
          playerManager.notifyPlay(playerId)
        } catch (e) {
          console.log('自动播放被阻止')
        }
      }
      setTimeout(playAttempt, 500)
    }
  }, [songs, autoplay, playerId])

  // 获取当前歌曲的歌词
  useEffect(() => {
    if (!songs.length || currentIndex >= songs.length) return

    const currentSong = songs[currentIndex]
    const lrcUrl = currentSong?.lrc

    if (!lrcUrl) return
    if (lyricsCache[lrcUrl]) return

    const fetchLyric = async () => {
      try {
        const response = await fetch(lrcUrl)
        const lyricText = await response.text()
        setLyricsCache(prev => ({
          ...prev,
          [lrcUrl]: lyricText
        }))
      } catch (err) {
        console.error('获取歌词失败:', err)
        setLyricsCache(prev => ({
          ...prev,
          [lrcUrl]: ''
        }))
      }
    }

    fetchLyric()
  }, [songs, currentIndex, lyricsCache])

  // 波形分析：拉取并解码当前歌曲，生成波形条形 + 响度包络
  const currentSongUrl = songs[currentIndex]?.url || ''

  // 按显示条数聚合细分数据，并给每根条分配独立的抖动幅度与相位
  const applyWaveBars = useCallback((count) => {
    const data = wavePeaksRef.current
    // 无论数据是否就绪都要记录期望条数，避免分析完成后条数停在初始值
    const size = Math.max(16, Math.min(count, data ? data.peaks.length : count))
    waveCountRef.current = size
    if (!data) return
    const heights = bucketPeaks(data.peaks, data.rms, size)
    setWaveBars(heights.map((height, index) => ({
      height,
      gain: height,
      // 抖动幅度与相位由下标确定性生成：切歌后形态稳定，相邻条错落不同
      jitter: 0.3 + pseudoRandom(index * 2 + 7) * 1.1,
      phase: pseudoRandom(index * 2 + 13) * Math.PI * 2
    })))
  }, [])

  useEffect(() => {
    const songUrl = currentSongUrl

    if (!songUrl) {
      setWaveBars([])
      wavePeaksRef.current = null
      waveDataRef.current = null
      return
    }

    // 命中缓存直接复用，避免同一首歌重复下载
    const cached = waveCacheRef.current.get(songUrl)
    if (cached) {
      waveDataRef.current = cached
      wavePeaksRef.current = { peaks: cached.peaks, rms: cached.rms }
      applyWaveBars(waveCountRef.current)
      return
    }

    let cancelled = false
    setWaveBars([])
    wavePeaksRef.current = null
    waveDataRef.current = null

    const loadWave = async () => {
      try {
        const song = songs[currentIndex] || {}
        const analysisUrl = await resolveAnalysisUrl(song)
        if (!analysisUrl) throw new Error('缺少音频地址')
        const result = await analyzeAudioWaveform(analysisUrl, WAVE_PEAK_COUNT)
        if (cancelled) return
        const data = {
          peaks: result.peaks,
          rms: result.rms,
          envelope: result.envelope,
          frameDuration: result.frameDuration
        }
        waveDataRef.current = data
        wavePeaksRef.current = { peaks: result.peaks, rms: result.rms }
        waveCacheRef.current.set(songUrl, data)
        applyWaveBars(waveCountRef.current)
      } catch (err) {
        console.warn('波形分析失败，改用降级波形:', err)
        if (cancelled) return
        wavePeaksRef.current = generateFallbackWaveform(WAVE_PEAK_COUNT, hashString(songUrl))
        waveDataRef.current = null
        applyWaveBars(waveCountRef.current)
      }
    }

    loadWave()
    return () => { cancelled = true }
  }, [currentSongUrl, applyWaveBars])

  // 波形动画：播放时按音乐响度整体伸长缩短，每根条再叠加独立相位的抖动
  useEffect(() => {
    const root = waveRootRef.current
    if (!root) return

    const anim = waveAnimRef.current

    if (!isPlaying && !isDragging) {
      // 静止态：回到静态波形（不抖动、不伸长）
      anim.bounce = 0
      anim.time = 0
      anim.amp = 0
      drawWave()
      return
    }

    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)

      const audio = audioRef.current
      const t = isDragging ? waveTimeRef.current : (audio ? audio.currentTime : 0)

      if (duration > 0) {
        const percent = Math.max(0, Math.min(1, t / duration))
        waveProgressRef.current = percent
        root.style.setProperty('--wave-progress', `${(percent * 100).toFixed(3)}%`)
      }

      let target = 0
      if (isPlaying && !anim.reduce) {
        const data = waveDataRef.current
        if (data) {
          // 真实响度包络
          target = sampleEnvelope(data.envelope, data.frameDuration, t)
        } else {
          // 无包络数据时的模拟律动
          target = 0.25 + Math.random() * 0.3
        }
      }

      // 起音快、衰减慢，贴近真实音乐的律动
      const factor = target > anim.bounce ? 0.5 : 0.12
      anim.bounce += (target - anim.bounce) * factor
      anim.time = performance.now() / 1000
      anim.amp = anim.reduce ? 0 : 0.18

      drawWave()
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, isDragging, duration, drawWave])

  // 跟随系统「减少动态效果」设置，运行时切换也能立即生效
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => {
      waveAnimRef.current.reduce = query.matches
      drawWave()
    }
    onChange()
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [drawWave])

  // 主题切换（<html data-theme>）时重新读取波形颜色
  useEffect(() => {
    if (typeof document === 'undefined') return
    const observer = new MutationObserver(() => {
      waveThemeRef.current.dirty = true
      drawWave()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style']
    })
    return () => observer.disconnect()
  }, [drawWave])

  // 播放/暂停
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      playerManager.notifyStop(playerId)
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
        playerManager.notifyPlay(playerId)
      }).catch(() => {})
    }
  }, [isPlaying, playerId])

  // 波形进度条点击
  const handleProgressClick = useCallback((e) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = percent * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
    waveTimeRef.current = newTime
  }, [duration])

  // 波形进度条拖动
  const progressBarRef = useRef(null)

  // 波形区域宽度变化（或页面缩放比例变化）时，重新决定波形条数
  useEffect(() => {
    const el = progressBarRef.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width || 0
      if (!width) return
      // 条数按物理像素折算：缩放 125% 时每条占 7/1.25 个 CSS 像素，
      // 因此观感与 200% 缩放、1080p 屏幕时保持一致
      const count = Math.floor((width * getDevicePixelRatio()) / WAVE_PHYSICAL_PITCH)
      if (count !== waveCountRef.current) applyWaveBars(count)
      // 宽度变化后重绘波形
      drawWave()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [applyWaveBars, drawWave])

  // 浏览器页面缩放改变时 devicePixelRatio 会变化（CSS 宽度未必变），
  // 这里用分辨率媒体查询监听，按新的缩放比重算条数并重绘
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    let query = null
    const watch = () => {
      if (query) query.removeEventListener('change', onZoomChange)
      query = window.matchMedia(`(resolution: ${getDevicePixelRatio()}dppx)`)
      query.addEventListener('change', onZoomChange)
    }
    const onZoomChange = () => {
      const el = progressBarRef.current
      if (el) {
        const width = el.getBoundingClientRect().width
        if (width) {
          const count = Math.floor((width * getDevicePixelRatio()) / WAVE_PHYSICAL_PITCH)
          if (count !== waveCountRef.current) applyWaveBars(count)
        }
      }
      drawWave()
      // 缩放比已变，重新订阅新的分辨率条件
      watch()
    }
    watch()
    return () => {
      if (query) query.removeEventListener('change', onZoomChange)
    }
  }, [applyWaveBars, drawWave])

  const getTimeFromX = useCallback((clientX) => {
    if (!progressBarRef.current) return 0
    const rect = progressBarRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return percent * duration
  }, [duration])

  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX)
    if (clientX) {
      const newTime = getTimeFromX(clientX)
      setDragTime(newTime)
      waveTimeRef.current = newTime
    }
  }, [getTimeFromX])

  useEffect(() => {
    if (!isDragging) return

    const handleDragMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX)
      if (clientX) {
        const newTime = getTimeFromX(clientX)
        setDragTime(newTime)
        waveTimeRef.current = newTime
      }
    }

    const handleDragEnd = (e) => {
      const clientX = e.clientX ?? (e.changedTouches && e.changedTouches[0]?.clientX)
      if (audioRef.current && clientX !== undefined && clientX !== null) {
        const newTime = getTimeFromX(clientX)
        audioRef.current.currentTime = newTime
        setCurrentTime(newTime)
        waveTimeRef.current = newTime
      }
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchmove', handleDragMove)
    document.addEventListener('touchend', handleDragEnd)
    return () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, getTimeFromX])

  // 音量调整：写入 localStorage 并实时同步到其它播放器
  const applyVolume = useCallback((percent) => {
    setVolume(percent)
    setIsMuted(false)
    setStoredVolume(percent)
  }, [])

  // 根据横坐标换算音量比例
  const getVolumeFromX = useCallback((clientX) => {
    if (!volumeBarRef.current) return volumeRef.current
    const rect = volumeBarRef.current.getBoundingClientRect()
    if (!rect.width) return volumeRef.current
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }, [])

  // 点击音量条
  const handleVolumeChange = useCallback((e) => {
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX)
    if (clientX === undefined || clientX === null) return
    applyVolume(getVolumeFromX(clientX))
  }, [applyVolume, getVolumeFromX])

  // 拖动音量条
  const handleVolumeDragStart = useCallback((e) => {
    e.preventDefault()
    setIsVolumeDragging(true)
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX)
    if (clientX === undefined || clientX === null) return
    applyVolume(getVolumeFromX(clientX))
  }, [applyVolume, getVolumeFromX])

  useEffect(() => {
    if (!isVolumeDragging) return

    const handleDragMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX)
      if (clientX === undefined || clientX === null) return
      applyVolume(getVolumeFromX(clientX))
    }

    const handleDragEnd = () => {
      setIsVolumeDragging(false)
    }

    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchmove', handleDragMove)
    document.addEventListener('touchend', handleDragEnd)
    return () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
    }
  }, [isVolumeDragging, applyVolume, getVolumeFromX])

  // 切换歌曲
  const playSong = useCallback((index) => {
    setCurrentIndex(index)
    setIsPlaying(true)
    playerManager.notifyPlay(playerId)
  }, [playerId])

  // 格式化时间
  const formatTime = (time) => {
    if (!isFinite(time) || isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 解析歌词
  const parseLyric = (lrc) => {
    if (!lrc) return []
    const lines = lrc.split('\n')
    const result = []
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g

    for (const line of lines) {
      const matches = [...line.matchAll(timeRegex)]
      if (matches.length > 0) {
        const text = line.replace(timeRegex, '').trim()
        if (text) {
          for (const match of matches) {
            const minutes = parseInt(match[1])
            const seconds = parseInt(match[2])
            const ms = parseInt(match[3])
            const time = minutes * 60 + seconds + ms / (match[3].length === 2 ? 100 : 1000)
            result.push({ time, text })
          }
        }
      }
    }
    return result.sort((a, b) => a.time - b.time)
  }

  // 切换歌词显示
  const toggleLyric = useCallback(() => {
    if (!showLyric) {
      // 展开歌词时，先收起播放列表（互斥）
      setShowList(false)
      setShowLyric(true)
      playerManager.expandLyric(playerId)
    } else {
      setShowLyric(false)
      playerManager.collapseLyric(playerId)
    }
  }, [showLyric, playerId])

  // 切换播放列表显示
  const toggleList = useCallback(() => {
    if (songs.length <= 1) return
    if (!showList) {
      // 展开列表时，先收起歌词（互斥）
      setShowLyric(false)
      setShowList(true)
      playerManager.expandList(playerId)
    } else {
      setShowList(false)
      playerManager.collapseList(playerId)
    }
  }, [showList, songs.length, playerId])

  const currentSong = songs[currentIndex]

  // 鼠标移入唱片封面：放大预览封面图
  const handleCoverPreviewEnter = useCallback((event) => {
    if (!currentSong?.pic) return
    const rect = event.currentTarget.getBoundingClientRect()
    const previewWidth = Math.min(240, window.innerWidth * 0.7)
    const margin = 12
    const half = previewWidth / 2
    const centerX = Math.min(
      Math.max(rect.left + rect.width / 2, half + margin),
      Math.max(window.innerWidth - half - margin, half + margin)
    )
    // 上方空间不足时改为显示在下方
    const below = rect.top < 300
    setCoverPreview({
      x: centerX,
      y: below ? rect.bottom : rect.top,
      below
    })
  }, [currentSong?.pic])

  const handleCoverPreviewLeave = useCallback(() => {
    setCoverPreview(null)
  }, [])

  const lrcUrl = currentSong?.lrc
  const lyricText = lrcUrl ? (lyricsCache[lrcUrl] || '') : ''
  const lyrics = parseLyric(lyricText)
  const displayTime = isDragging ? dragTime : currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0

  // 暂停/静止状态下同步波形播放头（点击跳转、暂停时切换进度）
  useEffect(() => {
    if (isPlaying || isDragging) return
    const root = waveRootRef.current
    if (!root) return
    root.style.setProperty('--wave-progress', `${progress}%`)
  }, [progress, isPlaying, isDragging])

  const getCurrentLyricIndex = () => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) {
        return i
      }
    }
    return -1
  }

  const currentLyricIndex = getCurrentLyricIndex()

  if (!id) return null

  return (
    <div className={`c-player ${isPlaying ? 'playing' : ''}`}>
      {/* 歌词区域 */}
      {showLyric && lyrics.length > 0 && (
        <div className="lyric">
          <div
            className="lyric-body"
            ref={lyricBodyRef}
            style={{
              transform: `translateY(${6 - currentLyricIndex * 3}em)`
            }}
          >
            {lyrics.map((line, index) => (
              <span key={index} className={`lyric-line ${index === currentLyricIndex ? 'now' : ''}`}>
                {line.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 控制区域 */}
      <div className="controls">
        <div className="c-left">
          <div className="music-description">
            <div
              className="image"
              onMouseEnter={handleCoverPreviewEnter}
              onMouseLeave={handleCoverPreviewLeave}
            >
              <div className="vinyl">
                <div className="vinyl-disc">
                  {currentSong?.pic && (
                    <img className="vinyl-cover" src={currentSong.pic} alt={currentSong.name} />
                  )}
                </div>
                <span className="vinyl-hole" aria-hidden="true"></span>
              </div>
              <div className="tonearm" aria-hidden="true"></div>
            </div>
            <div className="music-meta">
              <div className="music-name">{currentSong?.name || '未知歌曲'}</div>
              <div className="music-artist">{currentSong?.artist || '未知歌手'}</div>
            </div>
          </div>
          <div className="play-icon" onClick={togglePlay}>
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </div>
        </div>

        <div className="c-center">
          <div className="time">
            <div
              className="wave-body"
              ref={progressBarRef}
              onClick={handleProgressClick}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <div className="wave-track" ref={waveRootRef}>
                <canvas className="wave-canvas" ref={waveCanvasRef} aria-hidden="true"></canvas>
                <span className="wave-cursor"></span>
              </div>
            </div>
            <span className="time-text">
              {formatTime(displayTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="c-right">
          <div className={`volume ${isVolumeDragging ? 'dragging' : ''}`}>
            <div className="volume-button">
              <div className="volume-power" onClick={() => setIsMuted(!isMuted)}>
                <VolumeIcon muted={isMuted} />
              </div>
            </div>
            <div
              className="volume-body"
              ref={volumeBarRef}
              onClick={handleVolumeChange}
              onMouseDown={handleVolumeDragStart}
              onTouchStart={handleVolumeDragStart}
            >
              <div className="volume-line" style={{ width: `${isMuted ? 0 : volume * 100}%` }}>
                <div className="volume-point"></div>
              </div>
            </div>
          </div>

          {lyrics.length > 0 && (
            <div className={`lyric-button ${showLyric ? 'active' : ''}`}>
              <div className="lyric-power" onClick={toggleLyric}>
                <LyricIcon />
              </div>
            </div>
          )}

          <div className={`list-button ${songs.length <= 1 ? 'disabled' : ''} ${showList && songs.length > 1 ? 'active' : ''}`}>
            <div className="list-power" onClick={toggleList}>
              <ListIcon />
            </div>
          </div>
        </div>
      </div>

      {/* 播放列表 */}
      {showList && songs.length > 1 && (
        <div className="list">
          <div className="list-body">
            {songs.map((song, index) => (
              <div
                key={index}
                className={`list-item ${index === currentIndex ? 'active' : ''}`}
                onClick={() => playSong(index)}
              >
                <span className="music-name">{song.name}</span>
                <span className="music-artist">{song.artist}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*/!* 加载状态 *!/*/}
      {/*{loading && (*/}
      {/*  <div className="player-loading-overlay">*/}
      {/*    <span>加载中...</span>*/}
      {/*  </div>*/}
      {/*)}*/}

      {/* 错误状态 */}
      {error && (
        <div className="player-error-overlay">
          <span>{error}</span>
        </div>
      )}

      {/* 封面放大预览浮层（挂载到 body，避免被播放器的 overflow 裁剪） */}
      {coverPreview && currentSong?.pic && createPortal(
        <div
          className={`c-player-cover-preview ${coverPreview.below ? 'below' : ''}`}
          style={{ left: `${coverPreview.x}px`, top: `${coverPreview.y}px` }}
        >
          <img className="cover-img" src={currentSong.pic} alt={currentSong?.name || '歌曲封面'} />
          <div className="cover-info">
            <span className="cover-name">{currentSong?.name || '未知歌曲'}</span>
            <span className="cover-artist">{currentSong?.artist || '未知歌手'}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})

export default PlayerComponent