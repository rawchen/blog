import React from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import './index.css'

function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">页面未找到</h1>
        <p className="not-found-desc">
          抱歉，您访问的页面不存在或已被删除。
        </p>
        <div className="not-found-actions">
          <Link to="/" className="btn-home">
            <FontAwesomeIcon icon={faHome} /> 返回首页
          </Link>
          <button
            className="btn-back"
            onClick={() => window.history.back()}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> 返回上页
          </button>
        </div>
      </div>

      {/* 装饰元素 */}
      <div className="not-found-decoration">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>
    </div>
  )
}

export default NotFoundPage
