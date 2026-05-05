import request from '../utils/request'

// 获取站点配置（公开）
export function getSiteConfig() {
  return request({ url: '/config/site', method: 'get' })
}

// 获取所有配置（后台）
export function getAllConfig() {
  return request({ url: '/config/all', method: 'get' })
}

// 更新配置
export function updateConfig(data) {
  return request({ url: '/config', method: 'put', data })
}

// 批量更新配置
export function updateConfigs(data) {
  return request({ url: '/config/batch', method: 'put', data })
}
