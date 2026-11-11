import request from '../utils/request'

/**
 * 网易云音乐相关接口
 *
 * 说明：
 * - /api/music/search、/api/music/url、/api/music/playlist 等返回统一的 R 信封（{ code, data, message }）
 * - /api/music/meting 兼容 Meting 原始格式，不走 R 信封，因此单独用 fetch
 */

// 搜索歌曲
export function searchMusic(keyword, limit = 30) {
  return request({
    url: '/music/search',
    method: 'get',
    params: { keyword, limit }
  })
}

// 获取歌曲播放链接
export function getMusicUrl(id, br = 320) {
  return request({
    url: `/music/url/${id}`,
    method: 'get',
    params: { br }
  })
}

// 获取歌单歌曲列表
export function getMusicPlaylist(id) {
  return request({
    url: `/music/playlist/${id}`,
    method: 'get'
  })
}

// 获取歌曲详情
export function getMusicSong(id) {
  return request({
    url: `/music/song/${id}`,
    method: 'get'
  })
}

/**
 * Meting 兼容接口（返回原始格式，不带 R 信封）
 * @param {string} type song | playlist | album | artist
 * @param {string} id 资源ID
 */
export async function getMeting(type, id) {
  const response = await fetch(`/api/music/meting?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`)
  if (!response.ok) {
    throw new Error('加载音乐失败')
  }
  const data = await response.json()
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('未找到音乐')
  }
  return Array.isArray(data) ? data : [data]
}

/**
 * 生成歌曲下载地址（服务端代理转发，跨域也能正常下载）
 * @param {string} id 歌曲ID
 * @param {string} name 文件名（不含扩展名）
 * @param {number} br 码率
 */
export function buildMusicDownloadUrl(id, name = '', br = 320) {
  const params = new URLSearchParams({ br: String(br) })
  if (name) {
    params.append('name', name)
  }
  return `/api/music/download/${encodeURIComponent(id)}?${params.toString()}`
}
