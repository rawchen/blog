import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { getArticleList } from '../../api/article'
import { getCategoryList } from '../../api/category'
import './index.css'

function CategoryPage() {
  const { id } = useParams()
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [currentCategory, setCurrentCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [id])

  const fetchCategories = async () => {
    try {
      const res = await getCategoryList()
      setCategories(res.data || [])
      if (id) {
        const cat = res.data?.find(c => c.id === parseInt(id))
        setCurrentCategory(cat)
      }
    } catch (error) {
      // error handled
    }
  }

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params = { current: 1, size: 20 }
      if (id) params.categoryId = id
      const res = await getArticleList(params)
      setArticles(res.data.records || [])
      setTotal(res.data.total || 0)
      if (id) {
        const cat = categories.find(c => c.id === parseInt(id))
        setCurrentCategory(cat)
      } else {
        setCurrentCategory(null)
      }
    } finally {
      setLoading(false)
    }
  }

  // if (loading) return <div className="loading">加载中...</div>

  return (
    <div className="category-page">
      {/* Header */}
      <div className="category-header">
        <h1>
          {currentCategory?.categoryName || '全部分类'}
          <span className="category-count">{currentCategory ? currentCategory.articleCount || 0 : total} 篇{currentCategory?.description && <span>{currentCategory.description}</span>}</span>
        </h1>

      </div>

      {/* Category List */}
      <div className="category-list">
        <Link
          to="/category"
          className={`category-list-item ${!id ? 'active' : ''}`}
        >
          全部分类
        </Link>
        {categories.map((cat, index) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className={`category-list-item ${cat.id === parseInt(id) ? 'active' : ''}`}
          >
            {cat.categoryName} ({cat.articleCount || 0})
          </Link>
        ))}
      </div>

      {/* Article List */}
      <div className="post-lists">
        <div className="post-lists-body clearfix">
          {loading ? (
            <div className="list-loading">
              <FontAwesomeIcon icon={faSpinner} spin />
              {/*<span> 加载中...</span>*/}
            </div>
          ) : (
            articles.map(article => (
              <div key={article.id} className="post-list-item">
                <div className="post-list-item-container">
                  <Link to={`/${article.id}`}>
                    <div className="item-label">
                      <div className="item-title">
                        <a>{article.title}</a>
                      </div>
                      <div className="item-meta clearfix">
                        <div className="item-meta-date">
                          <i className="fa fa-clock-o" aria-hidden="true"></i>
                          {article.publishTime || article.createTime}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Empty State */}
      {articles.length === 0 && !loading && <div className="empty">暂无文章</div>}
    </div>
  )
}

export default CategoryPage
