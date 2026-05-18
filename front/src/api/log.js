import request from '../utils/request'

// ========== 登录日志 ==========

export function getLoginLogList(params) {
  return request({ url: '/log/login/list', method: 'get', params })
}

export function deleteLoginLog(id) {
  return request({ url: `/log/login/${id}`, method: 'delete' })
}

export function batchDeleteLoginLog(ids) {
  return request({ url: '/log/login/batch-delete', method: 'post', data: ids })
}

// ========== 操作日志 ==========

export function getOperationLogList(params) {
  return request({ url: '/log/operation/list', method: 'get', params })
}

export function getOperationLogById(id) {
  return request({ url: `/log/operation/${id}`, method: 'get' })
}

export function deleteOperationLog(id) {
  return request({ url: `/log/operation/${id}`, method: 'delete' })
}

export function batchDeleteOperationLog(ids) {
  return request({ url: '/log/operation/batch-delete', method: 'post', data: ids })
}

export function clearOperationLog(retainDays) {
  return request({ url: '/log/operation/clear', method: 'delete', params: { retainDays } })
}

// ========== 访问日志 ==========

export function getAccessLogList(params) {
  return request({ url: '/log/access/list', method: 'get', params })
}

export function getAccessLogById(id) {
  return request({ url: `/log/access/${id}`, method: 'get' })
}

export function deleteAccessLog(id) {
  return request({ url: `/log/access/${id}`, method: 'delete' })
}

export function batchDeleteAccessLog(ids) {
  return request({ url: '/log/access/batch-delete', method: 'post', data: ids })
}

export function clearAccessLog(retainDays) {
  return request({ url: '/log/access/clear', method: 'delete', params: { retainDays } })
}