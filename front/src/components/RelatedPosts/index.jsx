import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRelatedArticles } from '../../api/article'
import './index.css'

function RelatedPosts({ articleId, limit = 5 }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRelatedArticles()
  }, [articleId])

  const fetchRelatedArticles = async () => {
    try {
      const res = await getRelatedArticles(articleId, { limit })
      setArticles(res.data || [])
    } finally {
      setLoading(false)
    }
  }

  if (loading || articles.length === 0) return null

  return (
    <div className="related-posts">
      <h3 className="related-posts-title">
        <i className="fa fa-bookmark" aria-hidden="true"></i> 相关文章
      </h3>
      <ul className="related-posts-list">
        {articles.map(article => (
          <li key={article.id} className="related-posts-item">
            <Link to={`/article/${article.id}`}>
              {article.coverImage && (
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="related-posts-thumb"
                />
              )}
              <div className="related-posts-content">
                <span className="related-posts-item-title">{article.title}</span>
                <span className="related-posts-item-meta">
                  <i className="fa fa-clock-o" aria-hidden="true"></i>
                  {article.publishTime || article.createTime}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RelatedPosts