import request from '../utils/request'

export function getCategoryList() {
  return request({ url: '/category/category-list', method: 'get' })
}

export function getCategoryListAdmin(params) {
  return request({ url: '/category/admin/list', method: 'get', params })
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
