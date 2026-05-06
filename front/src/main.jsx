import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_cn'
import { BrowserRouter } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')
import App from './App'
import store from './store'
import { setSiteConfig } from './store/modules/siteConfig'
import './index.css'
import { getSiteConfig } from './api/config'

// 应用站点配置到 DOM
export function applySiteConfig(data) {
  const siteName = data.siteName || 'Blog'
  if (document.title !== siteName) {
    document.title = siteName
  }
  if (data.siteFavicon) {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
    link.rel = 'icon'
    link.href = data.siteFavicon
    document.head.appendChild(link)
  }
  if (data.siteDescription) {
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = data.siteDescription
  }
  if (data.siteKeywords) {
    let meta = document.querySelector('meta[name="keywords"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'keywords'
      document.head.appendChild(meta)
    }
    meta.content = data.siteKeywords
  }
  if (data.trackingCode && !document.getElementById('tracking-script')) {
    const container = document.createElement('div')
    container.id = 'tracking-script'
    container.innerHTML = data.trackingCode
    document.head.appendChild(container)
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

// 初始化：先应用缓存，再请求最新配置
const cached = localStorage.getItem('site_config')
if (cached) {
  try {
    applySiteConfig(JSON.parse(cached))
  } catch {}
}

// 请求最新配置，存入 Redux store
getSiteConfig().then(res => {
  const data = res.data || {}
  store.dispatch(setSiteConfig(data))
  applySiteConfig(data)
}).catch(() => {})

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
