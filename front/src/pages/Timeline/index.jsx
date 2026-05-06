import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getArticleList } from '../../api/article'
import './index.css'

function TimelinePage() {
  const [articles, setArticles] = useState([])
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalCategories: 0,
    totalComments: 0,
    totalViews: 0,
    years: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const res = await getArticleList({ current: 1, size: 1000 })
      const data = res.data?.records || []
      setArticles(data)

      // Calculate stats
      const totalViews = data.reduce((sum, a) => sum + (a.viewCount || 0), 0)
      const categories = new Set(data.map(a => a.categoryId))
      const years = new Set(data.map(a => {
        if (a.publishTime) return new Date(a.publishTime).getFullYear()
        if (a.createTime) return new Date(a.createTime).getFullYear()
        return null
      }))

      setStats({
        totalArticles: data.length,
        totalCategories: categories.size,
        totalComments: data.reduce((sum, a) => sum + (a.commentCount || 0), 0),
        totalViews,
        years: years.size
      })
    } finally {
      setLoading(false)
    }
  }

  // Group articles by year and month
  const groupByYearMonth = (articles) => {
    const groups = {}

    articles.forEach(article => {
      const date = new Date(article.publishTime || article.createTime)
      const year = date.getFullYear()
      const month = date.getMonth() + 1

      if (!groups[year]) {
        groups[year] = {}
      }
      if (!groups[year][month]) {
        groups[year][month] = []
      }
      groups[year][month].push(article)
    })

    // Sort by year desc, month desc
    const sortedYears = Object.keys(groups).sort((a, b) => b - a)
    const result = []

    sortedYears.forEach(year => {
      const months = Object.keys(groups[year]).sort((a, b) => b - a)
      months.forEach(month => {
        result.push({
          year,
          month,
          articles: groups[year][month].sort((a, b) => {
            const dateA = new Date(a.publishTime || a.createTime)
            const dateB = new Date(b.publishTime || b.createTime)
            return dateB - dateA
          })
        })
      })
    })

    return result
  }

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                      '七月', '八月', '九月', '十月', '十一月', '十二月']

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}-${day}`
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  const groupedArticles = groupByYearMonth(articles)

  return (
    <div className="timeline-page">
      {/* Stats Card */}
      <div className="stats-card">
        <fieldset>
          <legend>统计信息</legend>
          <div className="archives-count">
            <div className="archives-count-item">
              <code>{stats.totalArticles}</code>
              <span>文章</span>
            </div>
            <div className="archives-count-item">
              <code>{stats.totalCategories}</code>
              <span>分类</span>
            </div>
            <div className="archives-count-item">
              <code>{stats.totalComments}</code>
              <span>评论</span>
            </div>
            <div className="archives-count-item">
              <code>{stats.totalViews}</code>
              <span>浏览</span>
            </div>
            <div className="archives-count-item">
              <code>{stats.years}</code>
              <span>年</span>
            </div>
          </div>
        </fieldset>
      </div>

      {/* Timeline List */}
      {groupedArticles.map(({ year, month, articles }) => (
        <div key={`${year}-${month}`} className="month-section">
          <div className="month-title">
            {year}年{monthNames[month - 1]}
          </div>
          <div className="post-lists">
            <div className="post-lists-body clearfix">
              {articles.map(article => (
                <div key={article.id} className="post-list-item">
                  <div className="post-list-item-container">
                    <Link to={`/${article.id}`}>
                      <div className="item-label">
                        <div className="item-title">
                          <a>{article.title}</a>
                        </div>
                        <div className="item-meta">
                          <i className="fa fa-clock-o" aria-hidden="true"></i>
                          {' '}{formatDate(article.publishTime || article.createTime)}
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {articles.length === 0 && (
        <div className="empty">暂无文章</div>
      )}
    </div>
  )
}

export default TimelinePage