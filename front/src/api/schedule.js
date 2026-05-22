import request from '../utils/request'

// 分页查询任务列表
export function getJobPage(params) {
  return request({ url: '/admin/task/page', method: 'get', params })
}

// 获取任务详情
export function getJobDetail(id) {
  return request({ url: `/admin/task/${id}`, method: 'get' })
}

// 创建任务
export function createJob(data) {
  return request({ url: '/admin/task', method: 'post', data })
}

// 更新任务
export function updateJob(data) {
  return request({ url: '/admin/task', method: 'put', data })
}

// 删除任务
export function deleteJob(id) {
  return request({ url: `/admin/task/${id}`, method: 'delete' })
}

// 手动触发任务
export function triggerJob(id) {
  return request({ url: `/admin/task/trigger/${id}`, method: 'post' })
}

// 启用/禁用任务
export function updateJobStatus(id, enabled) {
  return request({ url: `/admin/task/${id}/status`, method: 'put', params: { enabled } })
}

// 获取单个任务的执行日志
export function getJobLogs(id, params) {
  return request({ url: `/admin/task/${id}/logs`, method: 'get', params })
}

// 获取所有任务的执行日志（分页）
export function getTaskLogPage(params) {
  return request({ url: '/admin/task/logs', method: 'get', params })
}

// 获取所有处理器
export function getHandlers() {
  return request({ url: '/admin/task/handlers', method: 'get' })
}
