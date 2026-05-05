import request from '../utils/request'

// 获取文章评论列表(树形结构)
export function getCommentList(articleId, params) {
  return request({ url: `/comment/list/${articleId}`, method: 'get', params })
}

// 获取最近评论
export function getRecentComments(params) {
  return request({ url: '/comment/recent', method: 'get', params })
}

// 提交评论
export function submitComment(data) {
  return request({ url: '/comment/submit', method: 'post', data })
}

// 回复评论
export function replyComment(data) {
  return request({ url: '/comment/reply', method: 'post', data })
}

// 点赞评论
export function likeComment(id) {
  return request({ url: `/comment/like/${id}`, method: 'post' })
}

// 后台管理接口
export function getCommentListAdmin(params) {
  return request({ url: '/comment/admin/list', method: 'get', params })
}

export function auditComment(id, status) {
  return request({ url: `/comment/admin/audit/${id}`, method: 'put', params: { status } })
}

export function deleteComment(id) {
  return request({ url: `/comment/admin/${id}`, method: 'delete' })
}

export function batchAuditComment(ids, status) {
  return request({ url: '/comment/admin/batch-audit', method: 'put', data: { ids, status } })
}

export function batchDeleteComment(ids) {
  return request({ url: '/comment/admin/batch-delete', method: 'post', data: { ids } })
}
