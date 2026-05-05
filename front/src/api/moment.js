import request from '../utils/request'

// 获取朋友圈列表(分页)
export function getMomentList(params) {
  return request({ url: '/moment/list', method: 'get', params })
}

// 获取朋友圈详情
export function getMomentDetail(id) {
  return request({ url: `/moment/${id}`, method: 'get' })
}

// 后台管理接口
export function getMomentListAdmin(params) {
  return request({ url: '/moment/admin/list', method: 'get', params })
}

export function createMoment(data) {
  return request({ url: '/moment/admin', method: 'post', data })
}

export function updateMoment(data) {
  return request({ url: '/moment/admin', method: 'put', data })
}

export function deleteMoment(id) {
  return request({ url: `/moment/admin/${id}`, method: 'delete' })
}

export function batchDeleteMoments(ids) {
  return request({ url: '/moment/admin/batch-delete', method: 'post', data: { ids } })
}

// 从RSS订阅拉取
export function fetchFromRss(url) {
  return request({ url: '/moment/admin/fetch-rss', method: 'post', data: { url } })
}