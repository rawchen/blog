import request from '../utils/request'

export function login(data) {
  return request({ url: '/auth/login', method: 'post', data })
}

export function register(data) {
  return request({ url: '/auth/register', method: 'post', data })
}

export function getCurrentUser() {
  return request({ url: '/auth/info', method: 'get' })
}

export function logout() {
  return request({ url: '/auth/logout', method: 'post' })
}
