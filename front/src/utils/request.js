import axios from 'axios'
import { message } from 'antd'
import store from '../store'
import { clearAuth } from '../store/modules/auth'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 处理认证失败，跳转登录页
const handleAuthExpired = () => {
  store.dispatch(clearAuth())
  window.location.href = '/admin/login'
}

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      message.error(res.message || '请求失败')
      if (res.code === 401) {
        handleAuthExpired()
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  error => {
    // 处理HTTP 401状态码（token过期或无效）
    if (error.response?.status === 401) {
      message.error('登录已过期，请重新登录')
      handleAuthExpired()
      return Promise.reject(error)
    }
    message.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request
