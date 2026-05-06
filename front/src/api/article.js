import request from '../utils/request'

// 前台接口
export function getArticleList(data) {
  return request({ url: '/article/article-list', method: 'post', data })
}

export function getArticleDetail(id, password) {
  return request({ url: `/article/detail/${id}`, method: 'get', params: { password } })
}

export function getArticleBySlug(slug) {
  return request({ url: `/article/slug/${slug}`, method: 'get' })
}

export function incrementViewCount(id) {
  return request({ url: `/article/view/${id}`, method: 'post' })
}

export function incrementLikeCount(id) {
  return request({ url: `/article/like/${id}`, method: 'post' })
}

// 搜索文章
export function searchArticles(params) {
  return request({ url: '/article/search', method: 'get', params })
}

// 时间线归档
export function getArticleTimeline(params) {
  return request({ url: '/article/timeline', method: 'get', params })
}

// 随机文章
export function getRandomArticles(params) {
  return request({ url: '/article/random', method: 'get', params })
}

// 推荐文章
export function getRecommendArticles(params) {
  return request({ url: '/article/recommend', method: 'get', params })
}

// 相关文章(根据标签)
export function getRelatedArticles(id, params) {
  return request({ url: `/article/${id}/related`, method: 'get', params })
}

// 最新文章
export function getRecentArticles(data) {
  return request({ url: '/article/latest-article', method: 'post', data })
}

// 后台接口
export function getArticleListAdmin(params) {
  return request({ url: '/article/admin/list', method: 'get', params })
}

export function getArticleById(id) {
  return request({ url: `/article/admin/${id}`, method: 'get' })
}

export function createArticle(data) {
  return request({ url: '/article/admin', method: 'post', data })
}

export function updateArticle(data) {
  return request({ url: '/article/admin', method: 'put', data })
}

export function deleteArticle(id) {
  return request({ url: `/article/admin/${id}`, method: 'delete' })
}

export function batchDeleteArticles(ids) {
  return request({ url: '/article/admin/batch-delete', method: 'post', data: { ids } })
}

// 草稿保存
export function saveDraft(data) {
  return request({ url: '/article/admin/draft', method: 'post', data })
}

export function getDraft(articleId) {
  return request({ url: `/article/admin/draft/${articleId}`, method: 'get' })
}

// 版本历史
export function getArticleVersions(id) {
  return request({ url: `/article/admin/${id}/versions`, method: 'get' })
}

export function restoreArticleVersion(articleId, versionId) {
  return request({ url: `/article/admin/${articleId}/restore/${versionId}`, method: 'post' })
}

// 上传文章图片
export function uploadArticleImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/article/admin/upload-image',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// AI生成文章摘要
export function generateSummary(content) {
  return request({ url: '/article/admin/ai/summary', method: 'post', data: { content } })
}
