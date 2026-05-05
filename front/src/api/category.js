import request from '../utils/request'

export function getCategoryList() {
  return request({ url: '/category/list', method: 'get' })
}

export function getCategoryById(id) {
  return request({ url: `/category/admin/${id}`, method: 'get' })
}

export function createCategory(data) {
  return request({ url: '/category/admin', method: 'post', data })
}

export function updateCategory(data) {
  return request({ url: '/category/admin', method: 'put', data })
}

export function deleteCategory(id) {
  return request({ url: `/category/admin/${id}`, method: 'delete' })
}
