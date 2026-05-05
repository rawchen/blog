import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { BrowserRouter } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')
import App from './App'
import store from './store'
import './index.css'
import { getSiteConfig } from './api/config'

// 初始化站点配置：先读缓存，再请求更新
const SITE_CONFIG_KEY = 'site_config'

function initSiteConfig() {
  // 1. 先从缓存读取，立即应用
  try {
    const cached = localStorage.getItem(SITE_CONFIG_KEY)
    if (cached) {
      const data = JSON.parse(cached)
      applySiteConfig(data)
    }
  } catch {}

  // 2. 请求最新配置，有变化则更新标题和缓存
  getSiteConfig().then(res => {
    const data = res.data || {}
    applySiteConfig(data)
    localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(data))
  }).catch(() => {})
}

function applySiteConfig(data) {
  // 标题
  const siteName = data.siteName || 'Blog'
  if (document.title !== siteName) {
    document.title = siteName
  }
  // Favicon
  if (data.siteFavicon) {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
    link.rel = 'icon'
    link.href = data.siteFavicon
    document.head.appendChild(link)
  }
  // Description meta
  if (data.siteDescription) {
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = data.siteDescription
  }
  // Keywords meta
  if (data.siteKeywords) {
    let meta = document.querySelector('meta[name="keywords"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'keywords'
      document.head.appendChild(meta)
    }
    meta.content = data.siteKeywords
  }
  // 跟踪代码
  if (data.trackingCode && !document.getElementById('tracking-script')) {
    const container = document.createElement('div')
    container.id = 'tracking-script'
    container.innerHTML = data.trackingCode
    document.head.appendChild(container)
    // 执行其中的script标签
    container.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script')
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value)
      })
      newScript.textContent = oldScript.textContent
      oldScript.parentNode.replaceChild(newScript, oldScript)
    })
  }
}

initSiteConfig()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider locale={zhCN}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
)
