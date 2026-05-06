import request from '../utils/request'

// 获取站点统计
export function getSiteStat() {
  return request({ url: '/stat/site-stat', method: 'get' })
}

// 获取访问趋势
export function getVisitTrend(params) {
  return request({ url: '/stat/trend', method: 'get', params })
}

// 记录PV
export function recordPv(data) {
  return request({ url: '/stat/pv', method: 'post', data })
}

// 获取热门文章
export function getHotArticles(params) {
  return request({ url: '/stat/hot-articles', method: 'get', params })
}

// 获取热门标签
export function getHotTags(params) {
  return request({ url: '/stat/hot-tags', method: 'get', params })
}

// 获取文章统计
export function getArticleStats() {
  return request({ url: '/stat/articles', method: 'get' })
}

// 获取评论统计
export function getCommentStats() {
  return request({ url: '/stat/comments', method: 'get' })
}
