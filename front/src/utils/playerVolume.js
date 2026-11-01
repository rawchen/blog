/**
 * c-player 全局音量管理
 *
 * 规则：
 *  1. 全站所有 c-player 共享同一个音量，存储于 localStorage（key: cplayer_volume）；
 *  2. 任意播放器修改音量后立即写入 localStorage，并实时广播给页面上的其它播放器；
 *  3. 首次访问（无缓存或缓存非法）使用默认音量 0.7。
 */

export const CPLAYER_VOLUME_STORAGE_KEY = 'cplayer_volume'
export const DEFAULT_PLAYER_VOLUME = 0.7
export const VOLUME_CHANGE_EVENT = 'cplayer_volume_change'

/**
 * 把任意输入规整为 0 ~ 1 之间的音量
 * @param {number|string} value
 * @returns {number}
 */
export function clampVolume(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return DEFAULT_PLAYER_VOLUME
  return Math.min(1, Math.max(0, num))
}

/**
 * 读取已保存的全局音量，无有效缓存时返回默认值 0.7
 * @returns {number}
 */
export function getStoredVolume() {
  try {
    const stored = localStorage.getItem(CPLAYER_VOLUME_STORAGE_KEY)
    if (stored === null || stored === '') return DEFAULT_PLAYER_VOLUME
    const num = parseFloat(stored)
    if (!Number.isFinite(num)) return DEFAULT_PLAYER_VOLUME
    return clampVolume(num)
  } catch (e) {
    /* localStorage 不可用（隐私模式等）时静默降级 */
    return DEFAULT_PLAYER_VOLUME
  }
}

/**
 * 广播音量变化（同标签页内的其它播放器实例）
 * @param {number} volume
 */
function emitVolumeChange(volume) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(VOLUME_CHANGE_EVENT, { detail: { volume } }))
}

/**
 * 持久化音量并广播给所有播放器
 * @param {number} value
 * @returns {number} 实际保存的音量
 */
export function setStoredVolume(value) {
  const target = clampVolume(value)
  try {
    localStorage.setItem(CPLAYER_VOLUME_STORAGE_KEY, String(target))
  } catch (e) {
    /* ignore */
  }
  emitVolumeChange(target)
  return target
}

/**
 * 订阅全局音量变化（同标签页广播 + 跨标签页 storage 事件）
 * @param {(volume:number)=>void} callback
 * @returns {()=>void} 取消订阅函数
 */
export function subscribeVolumeChange(callback) {
  if (typeof window === 'undefined') return () => {}

  const handleCustom = (e) => {
    const detail = e && e.detail
    const volume = detail && typeof detail.volume === 'number' ? detail.volume : getStoredVolume()
    callback(clampVolume(volume))
  }

  const handleStorage = (e) => {
    if (e && e.key && e.key !== CPLAYER_VOLUME_STORAGE_KEY) return
    callback(getStoredVolume())
  }

  window.addEventListener(VOLUME_CHANGE_EVENT, handleCustom)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(VOLUME_CHANGE_EVENT, handleCustom)
    window.removeEventListener('storage', handleStorage)
  }
}
