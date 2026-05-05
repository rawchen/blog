import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getArticleList } from '../../api/article'
import { getTagList } from '../../api/tag'
import './index.css'

// Random background colors for icons
const bgIcos = ['book', 'game', 'note', 'chat', 'code', 'image', 'web', 'link', 'design', 'lock']

function getRandomBgIco() {
  return bgIcos[Math.floor(Math.random() * bgIcos.length)]
}

function TagPage() {
  const { id } = useParams()
  const [articles, setArticles] = useState([])
  const [tags, setTags] = useState([])
  const [currentTag, setCurrentTag] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTags()
  }, [])

  useEffect(() => {
    if (id) fetchArticles()
    else setLoading(false)
  }, [id])

  const fetchTags = async () => {
    try {
      const res = await getTagList()
      setTags(res.data || [])
    } catch (error) {
      // error handled
    }
  }

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const res = await getArticleList({ current: 1, size: 20, tagId: id })
      setArticles(res.data.records || [])
      const tag = tags.find(t => t.id === parseInt(id))
      setCurrentTag(tag)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div className="tag-page">
      {/* Header */}
      <div className="tag-header">
        <h1>{currentTag?.tagName || '标签文章'}</h1>
        {currentTag?.description && <p>{currentTag.description}</p>}
      </div>

      {/* Tag Cloud */}
      <div className="tag-cloud">
        {tags.map((tag, index) => (
          <Link
            key={tag.id}
            to={`/tag/${tag.id}`}
            className={`tag-cloud-item ${tag.id === parseInt(id) ? 'active' : ''}`}
          >
            {tag.tagName} ({tag.articleCount || 0})
          </Link>
        ))}
      </div>

      {/* Article List */}
      <div className="post-lists">
        <div className="post-lists-body clearfix">
          {articles.map(article => (
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
                      <div className="item-meta-date">
                        <i className="fa fa-clock-o" aria-hidden="true"></i>
                        {article.publishTime || article.createTime}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {articles.length === 0 && !loading && <div className="empty">暂无文章</div>}
    </div>
  )
}

export default TagPage
