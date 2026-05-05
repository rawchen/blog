import request from '../utils/request'

/**
 * 获取OSS STS临时凭证
 */
export function getStsToken() {
  return request({ url: '/oss/sts-token', method: 'get' })
}
