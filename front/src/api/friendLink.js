import request from '../utils/request'

// 获取友链列表(前台)
export function getFriendLinkList() {
  return request({ url: '/friend-link/list', method: 'get' })
}

// 后台管理接口
export function getFriendLinkListAdmin(params) {
  return request({ url: '/friend-link/admin/list', method: 'get', params })
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

export function updateFriendLinkSort(data) {
  return request({ url: '/friend-link/admin/sort', method: 'put', data })
}

// 检测友链状态
export function checkFriendLinkStatus(id) {
  return request({ url: `/friend-link/admin/check/${id}`, method: 'get' })
}

export function batchCheckFriendLinkStatus(ids) {
  return request({ url: '/friend-link/admin/batch-check', method: 'post', data: { ids } })
}