import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getArticleList } from '../../api/article'
import { getCategoryList } from '../../api/category'
import './index.css'

// Random background colors for icons
const bgIcos = ['book', 'game', 'note', 'chat', 'code', 'image', 'web', 'link', 'design', 'lock']

function getRandomBgIco() {
  return bgIcos[Math.floor(Math.random() * bgIcos.length)]
}

function CategoryPage() {
  const { id } = useParams()
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [currentCategory, setCurrentCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (id) fetchArticles()
    else setLoading(false)
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
      const res = await getArticleList({ current: 1, size: 20, categoryId: id })
      setArticles(res.data.records || [])
      const cat = categories.find(c => c.id === parseInt(id))
      setCurrentCategory(cat)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div className="category-page">
      {/* Header */}
      <div className="category-header">
        <h1>{currentCategory?.categoryName || '分类文章'}</h1>
        {currentCategory?.description && <p>{currentCategory.description}</p>}
      </div>

      {/* Category List */}
      <div className="category-list">
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

export default CategoryPage
