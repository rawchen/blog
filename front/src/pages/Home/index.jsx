import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getArticleList } from '../../api/article'
import { getSiteConfig } from '../../api/config'
import Pagination from '../../components/Pagination'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faTags, faComment, faEye } from '@fortawesome/free-solid-svg-icons'
import momentIcon from '../../assets/icons/moment.svg'
import './index.css'

// Random background colors for posts
const bgColors = ['bg-blue', 'bg-purple', 'bg-green', 'bg-yellow', 'bg-red', 'bg-orange']

function getRandomBgColor() {
  return bgColors[Math.floor(Math.random() * bgColors.length)]
}

// Format datetime to date only (yyyy-MM-dd HH:mm:ss -> yyyy-MM-dd)
function formatDate(datetime) {
  return datetime ? datetime.substring(0, 10) : ''
}

function Home() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(1)
  const [size] = useState(10)
  const [total, setTotal] = useState(0)
  const [siteDescription, setSiteDescription] = useState('')
  const typingRef = useRef(null)

  useEffect(() => {
    fetchArticles()
  }, [current])

  useEffect(() => {
    loadSiteConfig()
  }, [])

  useEffect(() => {
    // 初始化打字机效果
    if (typingRef.current && window.yephy && siteDescription) {
      typingRef.current.textContent = siteDescription
      window.yephy(typingRef.current)
    }
  }, [siteDescription])

  const loadSiteConfig = async () => {
    try {
      const res = await getSiteConfig()
      if (res.code === 200) {
        setSiteDescription(res.data?.siteDescription || '')
      }
    } catch (e) {
      console.error('加载站点配置失败', e)
    }
  }

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const res = await getArticleList({ current, size })
      setArticles(res.data.records || [])
      setTotal(res.data.total || 0)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setCurrent(page)
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div className="home">
      {/* Hero Section */}
      <div className="post-onelist-item">
        <div className="post-onelist-item-container">
          <Link to="/">
            <div
              className="onelist-item-thumb bg-deepgrey"
              style={{ backgroundImage: 'url(https://cdn.rawchen.com/cover.jpg)' }}
            />
          </Link>
          <div className="item-title">
            <Link to="/">RawChen · Blog</Link>
            <span className="caret"></span>
          </div>
          <div className="item-meta" style={{ fontFamily: "'Josefin Sans', 'Noto Serif SC', sans-serif", fontWeight: 'bold', fontSize: '15px' }}>
            <p
                id="typing-text">{siteDescription}</p>
          </div>
          <div className="item-meta" style={{ fontSize: '15px' }}>
            <div className="social-list">
              <a href="https://code.rawchen.com" target="_blank" rel="noopener noreferrer"
                 style={{border: 'none'}}>CODE</a>
              丨
              <a href="https://ai.rawchen.com" target="_blank" rel="noopener noreferrer" style={{border: 'none'}}>AI</a>
              丨
              <span id="moment-span" href="https://rawchen.com/moment"><img src={momentIcon} id="moment" /> </span>
              丨
              <a href="https://pan.rawchen.com" target="_blank" rel="noopener noreferrer"
                 style={{border: 'none'}}>PAN</a>
              丨
              <a href="https://link.rawchen.com" target="_blank" rel="noopener noreferrer"
                 style={{border: 'none'}}>LINK</a>
            </div>
          </div>
        </div>
      </div>

      {/* Article List */}
      {articles.map((article, index) => (
          <div key={article.id} className="post-onelist-item">
            <div className="post-onelist-item-container">
            <Link to={`/article/${article.id}`}>
              <div
                className={`onelist-item-thumb ${getRandomBgColor()}`}
                style={{ backgroundImage: `url(${article.coverImage || 'https://cdn.rawchen.com/cover.jpg'})` }}
              />
            </Link>
            <div className="item-title">
              <Link to={`/article/${article.id}`}>{article.title}</Link>
            </div>
            <div className="item-meta">
              <span className="meta-item">
                <FontAwesomeIcon icon={faClock} />
                {` ` + formatDate(article.publishTime || article.createTime)}
              </span>
              <span className="meta-item">
                <FontAwesomeIcon icon={faTags} />
                {article.categoryName && (
                  <Link to={`/category/${article.categoryId}`}>{article.categoryName}</Link>
                )}
              </span>
              <span className="meta-item">
                <FontAwesomeIcon icon={faComment} />
                <Link to={`/article/${article.id}#comments`}>{article.commentCount || 0} 评论</Link>
              </span>
              <span className="meta-item">
                <FontAwesomeIcon icon={faEye} />
                {` ` + article.viewCount || 0} 浏览
              </span>
            </div>
            <div className={`item-meta-hr ${getRandomBgColor()}`}></div>
            <div className="item-content">
              <p>{article.summary || article.content?.substring(0, 150) + '...'}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Empty State */}
      {articles.length === 0 && (
        <div className="post-onelist-item">
          <div className="post-onelist-item-container">
            <div className="empty">暂无文章</div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > size && (
        <Pagination
          current={current}
          size={size}
          total={total}
          onChange={handlePageChange}
        />
      )}
    </div>
  )
}

export default Home
