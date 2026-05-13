import request from '../utils/request'

/**
 * 获取数据库列表
 */
export function getDatabases(data) {
  return request({
    url: '/migration/admin/databases',
    method: 'post',
    data
  })
}

/**
 * 测试数据库连接
 */
export function testConnection(data) {
  return request({
    url: '/migration/admin/connect',
    method: 'post',
    data
  })
}

/**
 * 获取已迁移数据统计
 */
export function getMigrationStats() {
  return request({
    url: '/migration/admin/stats',
    method: 'get'
  })
}

/**
 * 开始迁移
 */
export function startMigration(data) {
  return request({
    url: '/migration/admin/start',
    method: 'post',
    data
  })
}

/**
 * 获取迁移进度
 */
export function getMigrationProgress() {
  return request({
    url: '/migration/admin/progress',
    method: 'get'
  })
}
