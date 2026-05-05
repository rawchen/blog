import request from '../utils/request'

export function getTagList() {
  return request({ url: '/tag/list', method: 'get' })
}

export function getTagListAdmin(params) {
  return request({ url: '/tag/admin/list', method: 'get', params })
}

export function getTagById(id) {
  return request({ url: `/tag/admin/${id}`, method: 'get' })
}

export function createTag(data) {
  return request({ url: '/tag/admin', method: 'post', data })
}

export function updateTag(data) {
  return request({ url: '/tag/admin', method: 'put', data })
}

export function deleteTag(id) {
  return request({ url: `/tag/admin/${id}`, method: 'delete' })
}
