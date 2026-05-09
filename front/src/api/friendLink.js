import request from '../utils/request'

// 获取友链列表(前台)
export function getFriendLinkList() {
  return request({ url: '/friend-link/list', method: 'get' })
}

// 申请友链(前台)
export function applyFriendLink(data) {
  return request({ url: '/friend-link/apply', method: 'post', data })
}

// 后台管理接口
export function getFriendLinkPage(params) {
  return request({ url: '/friend-link/admin/page', method: 'get', params })
}

export function getFriendLinkDetail(id) {
  return request({ url: `/friend-link/admin/${id}`, method: 'get' })
}

export function createFriendLink(data) {
  return request({ url: '/friend-link/admin', method: 'post', data })
}

export function updateFriendLink(data) {
  return request({ url: '/friend-link/admin', method: 'put', data })
}

export function deleteFriendLink(id) {
  return request({ url: `/friend-link/admin/${id}`, method: 'delete' })
}

export function auditFriendLink(id, status) {
  return request({ url: `/friend-link/admin/${id}/audit`, method: 'put', params: { status } })
}

// 检测友链状态
export function checkFriendLinkStatus(id) {
  return request({ url: `/friend-link/admin/check/${id}`, method: 'post' })
}
