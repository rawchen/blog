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

// ========== 仪表盘统计 ==========

// 获取仪表盘统计数据
export function getDashboardStats() {
  return request({ url: '/stat/dashboard/stats', method: 'get' })
}

// 获取30天访问趋势
export function getAccessTrend() {
  return request({ url: '/stat/dashboard/access-trend', method: 'get' })
}

// 获取热门文章排行
export function getTopArticles(params) {
  return request({ url: '/stat/dashboard/top-articles', method: 'get', params })
}

// 获取浏览器分布
export function getBrowserDistribution() {
  return request({ url: '/stat/dashboard/browser', method: 'get' })
}

// 获取操作系统分布
export function getOsDistribution() {
  return request({ url: '/stat/dashboard/os', method: 'get' })
}

// 获取省份分布
export function getProvinceDistribution() {
  return request({ url: '/stat/dashboard/province', method: 'get' })
}

// 获取来源域名分布
export function getRefererDomainDistribution() {
  return request({ url: '/stat/dashboard/referer', method: 'get' })
}

// 获取操作类型分布
export function getOperationDistribution() {
  return request({ url: '/stat/dashboard/operation', method: 'get' })
}

// 获取分类文章数统计
export function getCategoryArticleCount() {
  return request({ url: '/stat/dashboard/category-articles', method: 'get' })
}

// 获取标签文章数统计
export function getTagArticleCount() {
  return request({ url: '/stat/dashboard/tag-articles', method: 'get' })
}

// 获取访客国家分布
export function getCountryDistribution() {
  return request({ url: '/stat/dashboard/country', method: 'get' })
}

// 获取访客城市分布
export function getCityDistribution() {
  return request({ url: '/stat/dashboard/city', method: 'get' })
}

// 获取页面类型访问对比（昨日vs今日）
export function getPageTypeCompare() {
  return request({ url: '/stat/dashboard/page-type-compare', method: 'get' })
}
