/**
 * 音乐资源地址工具
 *
 * 网易云音乐接口返回的封面 / 音频地址默认是 http://，
 * 站点本身是 https 时浏览器会按「混合内容」拦截（提示「不安全」），
 * 这里统一在数据进入页面时升级为 https。
 */

/**
 * 将 http:// 开头的地址升级为 https://
 * @param {string} url 原始地址
 * @returns {string} 升级后的地址
 */
export function toHttps(url) {
  if (typeof url !== 'string' || !url) return url
  if (url.startsWith('http://')) {
    return `https://${url.slice('http://'.length)}`
  }
  return url
}

/**
 * 规范化单首歌曲：封面与播放地址统一使用 https
 * @param {object} song 歌曲对象
 * @returns {object} 规范化后的歌曲对象
 */
export function normalizeSong(song) {
  if (!song || typeof song !== 'object') return song
  return {
    ...song,
    pic: toHttps(song.pic),
    url: toHttps(song.url)
  }
}

/**
 * 规范化歌曲列表
 * @param {Array} songs 歌曲列表
 * @returns {Array} 规范化后的歌曲列表
 */
export function normalizeSongs(songs) {
  if (!Array.isArray(songs)) return songs
  return songs.map(normalizeSong)
}
