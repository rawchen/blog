import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getArticleList } from '../../api/article'
import './index.css'

// Random background colors for icons
const bgColors = ['bg-blue', 'bg-purple', 'bg-green', 'bg-yellow', 'bg-red', 'bg-orange']
const bgIcos = ['book', 'game', 'note', 'chat', 'code', 'image', 'web', 'link', 'design', 'lock']

function getRandomBgIco() {
  return bgIcos[Math.floor(Math.random() * bgIcos.length)]
}

function Archive() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const res = await getArticleList({ current: 1, size: 100 })
      setArticles(res.data.records || [])
    } finally {
      setLoading(false)
    }
  }

  // Group by year-month
  const groupByMonth = (articles) => {
    const groups = {}
    articles.forEach(article => {
      if (article.publishTime) {
        const date = new Date(article.publishTime)
        const yearMonth = `${date.getFullYear()}年${date.getMonth() + 1}月`
        if (!groups[yearMonth]) {
          groups[yearMonth] = []
        }
        groups[yearMonth].push(article)
      }
    })
    return groups
  }

  if (loading) return <div className="loading">加载中...</div>

  const groupedArticles = groupByMonth(articles)

  return (
    <div className="archive-page">
      {/* Header */}
      <div className="archive-header">
        <h1>文章归档</h1>
        <p>共 {articles.length} 篇文章</p>
      </div>

      {/* Stats */}
      <div className="archives-count clearfix">
        <div className="archives-count-item">
          <code>{articles.length}</code>
          <span>文章</span>
        </div>
        <div className="archives-count-item">
          <code>{new Set(articles.map(a => a.categoryName)).size}</code>
          <span>分类</span>
        </div>
        <div className="archives-count-item">
          <code>{articles.reduce((sum, a) => sum + (a.viewCount || 0), 0)}</code>
          <span>浏览</span>
        </div>
        <div className="archives-count-item">
          <code>{articles.reduce((sum, a) => sum + (a.commentCount || 0), 0)}</code>
          <span>评论</span>
        </div>
      </div>

      {/* Article List */}
      <div className="post-lists">
        <div className="post-lists-body clearfix">
          {Object.entries(groupedArticles).map(([month, monthArticles]) => (
            <React.Fragment key={month}>
              <div className="categorys-title">{month}</div>
              {monthArticles.map(article => (
                <div key={article.id} className="post-list-item">
                  <div className="post-list-item-container">
                    <Link to={`/article/${article.id}`}>
                      <div className="item-label">
                        <div className="item-title">
                          <a>{article.title}</a>
                        </div>
                        <div className="item-meta clearfix">
                          <div
                            className={`item-meta-ico bg-ico-${getRandomBgIco()}`}
                            style={{
                              background: 'url(/images/bg-ico.png) no-repeat',
                              backgroundSize: '40px auto'
                            }}
                          />
                          <div className="item-meta-cat">
                            {article.categoryName && (
                              <Link to={`/category/${article.categoryId}`}>
                                {article.categoryName}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {articles.length === 0 && <div className="empty">暂无文章</div>}
    </div>
  )
}

export default Archive
