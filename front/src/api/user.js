import request from '../utils/request'

export function getUserList(params) {
  return request({ url: '/user/admin/list', method: 'get', params })
}

export function updateUserStatus(id, status) {
  return request({ url: `/user/admin/status/${id}`, method: 'put', params: { status } })
}

export function resetPassword(id) {
  return request({ url: `/user/admin/reset-password/${id}`, method: 'put' })
}
