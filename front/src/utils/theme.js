/**
 * 主题（亮色 / 暗色）管理
 *
 * 规则：
 *  1. 用户手动切换过一次 → 记录到 localStorage，之后一直沿用手动设置的模式；
 *  2. 从未手动切换过 → 按时间自动判断：19:00 - 次日 06:00 为暗色，其余时间为亮色。
 */

export const THEME_STORAGE_KEY = 'blog_theme_mode'

export const THEME_LIGHT = 'light'
export const THEME_DARK = 'dark'

/** 自动切换的暗色时段：19:00 ~ 06:00 */
const DARK_START_HOUR = 19
const DARK_END_HOUR = 6

/**
 * 根据当前时间判断应使用的模式
 * @returns {'light'|'dark'}
 */
export function getAutoTheme() {
  const hour = new Date().getHours()
  const isDark = hour >= DARK_START_HOUR || hour < DARK_END_HOUR
  return isDark ? THEME_DARK : THEME_LIGHT
}

/**
 * 读取用户手动设置过的模式（没有则返回 null）
 * @returns {'light'|'dark'|null}
 */
export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === THEME_LIGHT || stored === THEME_DARK) {
      return stored
    }
  } catch (e) {
    /* localStorage 不可用（隐私模式等）时静默降级 */
  }
  return null
}

/**
 * 当前生效的模式：手动优先，否则自动
 * @returns {'light'|'dark'}
 */
export function resolveTheme() {
  return getStoredTheme() || getAutoTheme()
}

/**
 * 把模式应用到 DOM
 * @param {'light'|'dark'} theme
 */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const target = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT
  document.documentElement.setAttribute('data-theme', target)
  document.documentElement.classList.toggle('dark', target === THEME_DARK)
  // 同步浏览器表单控件 / 滚动条等原生 UI 的配色
  document.documentElement.style.colorScheme = target
  // 通知订阅者（图标同步等）
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: target } }))
}

/**
 * 手动切换并持久化
 * @param {'light'|'dark'} theme
 */
export function setTheme(theme) {
  const target = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT
  try {
    localStorage.setItem(THEME_STORAGE_KEY, target)
  } catch (e) {
    /* ignore */
  }
  applyTheme(target)
  return target
}

/**
 * 在两种模式之间切换
 * @returns {'light'|'dark'} 切换后的模式
 */
export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || resolveTheme()
  return setTheme(current === THEME_DARK ? THEME_LIGHT : THEME_DARK)
}

let autoTimer = null

/**
 * 初始化主题：
 *  - 立即应用（避免闪白由 index.html 内联脚本先行处理）
 *  - 若用户从未手动设置，则每分钟检查一次时间，跨越 19:00 / 06:00 时自动切换
 */
export function initTheme() {
  applyTheme(resolveTheme())

  // 清掉旧的定时器，避免重复注册
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }

  autoTimer = setInterval(() => {
    // 一旦用户手动切换过，就不再自动干预
    if (getStoredTheme()) return
    const auto = getAutoTheme()
    if (document.documentElement.getAttribute('data-theme') !== auto) {
      applyTheme(auto)
    }
  }, 60 * 1000)
}
