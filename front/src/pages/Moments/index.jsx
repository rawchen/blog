import React, { useState, useEffect } from 'react'
import { getMomentList } from '../../api/moment'
import './index.css'

// Format relative time
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

function MomentsPage() {
  const [moments, setMoments] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    fetchMoments()
  }, [page])

  const fetchMoments = async () => {
    setLoading(true)
    try {
      const res = await getMomentList({ current: page, size: pageSize })
      if (res.code === 200) {
        setMoments(res.data?.records || [])
        setTotal(res.data?.total || 0)
      }
    } catch (error) {
      console.error('加载动态失败', error)
    } finally {
      setLoading(false)
    }
  }

  const renderPagination = () => {
    const totalPages = Math.ceil(total / pageSize)
    if (totalPages <= 1) return null

    const items = []
    const showPages = 5
    let startPage = Math.max(1, page - Math.floor(showPages / 2))
    let endPage = Math.min(totalPages, startPage + showPages - 1)

    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1)
    }

    // Previous button
    items.push(
      <li key="prev" className={`pagination-item ${page === 1 ? 'disabled' : ''}`}>
        {page > 1 ? (
          <a onClick={() => setPage(page - 1)}>&lt;</a>
        ) : (
          <span>&lt;</span>
        )}
      </li>
    )

    // First page
    if (startPage > 1) {
      items.push(
        <li key={1} className="pagination-item">
          <a onClick={() => setPage(1)}>1</a>
        </li>
      )
      if (startPage > 2) {
        items.push(
          <li key="ellipsis1" className="pagination-item">
            <span>...</span>
          </li>
        )
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <li key={i} className={`pagination-item ${i === page ? 'current' : ''}`}>
          <a onClick={() => setPage(i)}>{i}</a>
        </li>
      )
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <li key="ellipsis2" className="pagination-item">
            <span>...</span>
          </li>
        )
      }
      items.push(
        <li key={totalPages} className="pagination-item">
          <a onClick={() => setPage(totalPages)}>{totalPages}</a>
        </li>
      )
    }

    // Next button
    items.push(
      <li key="next" className={`pagination-item ${page === totalPages ? 'disabled' : ''}`}>
        {page < totalPages ? (
          <a onClick={() => setPage(page + 1)}>&gt;</a>
        ) : (
          <span>&gt;</span>
        )}
      </li>
    )

    return <ol className="pagination-list">{items}</ol>
  }

  return (
    <div className="moments-page">
      {/* Header */}
      <div className="moments-header">
        <h1>朋友圈</h1>
        <div className="moments-meta">
          订阅分享，发现精彩
        </div>
      </div>

      {/* Moments List */}
      <div className="moments-container">
        {loading ? (
          <div className="moments-loading">加载中...</div>
        ) : moments.length > 0 ? (
          <>
            <ol className="moments-list">
              {moments.map(moment => (
                <li key={moment.id} className="moment-item">
                  <a
                    className="moment-link"
                    href={moment.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="moment-view">
                      <div className="moment-title">
                        {moment.title}
                      </div>
                      <div className="moment-content">
                        <p>{moment.description}</p>
                      </div>
                      {moment.img && (
                        <img
                          className="moment-image"
                          src={moment.img}
                          alt={moment.title}
                        />
                      )}
                      <div className="moment-footer">
                        <span className="moment-author">
                          {moment.icon && (
                            <img
                              className="site-icon"
                              src={moment.icon}
                              alt={moment.siteName || moment.author}
                            />
                          )}
                          <span className="author-name">
                            {moment.author || moment.siteName}
                          </span>
                        </span>
                        <time className="moment-time">
                          {formatRelativeTime(moment.publishTime)}
                        </time>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ol>

            {/* Pagination */}
            <div className="moments-pagination">
              {renderPagination()}
            </div>
          </>
        ) : (
          <div className="moments-empty">
            <i className="fa fa-rss" aria-hidden="true"></i>
            <p>暂无动态</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MomentsPage