import request from '../utils/request'

// 获取采集文章数量
export function getScraperArticleCount() {
  return request({ url: '/scraper/count', method: 'get' })
}

// 采集网页文章（需要较长超时时间，AI处理可能需要2分钟）
export function fetchArticle(url) {
  return request({
    url: '/scraper/fetch',
    method: 'post',
    data: { url },
    timeout: 120000 // 2分钟超时
  })
}

// 保存采集的文章
export function saveScraperArticle(data) {
  return request({ url: '/scraper/save', method: 'post', data })
}
