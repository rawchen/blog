import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faTags, faComment, faEye, faAngleLeft, faAngleRight, faLock } from '@fortawesome/free-solid-svg-icons'
import { getArticleDetail, incrementViewCount } from '../../api/article'
import CommentList from '../../components/Comment'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import RelatedPosts from '../../components/RelatedPosts'
import TOC from '../../components/TOC'
import NotFoundPage from '../NotFound'
import Headroom from 'headroom.js'
import eyeIcon from '../../assets/images/eye.png'
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

// 获取缓存的密码（有效期1天）
function getCachedPassword(articleId) {
  const key = `article_pwd_${articleId}`
  const cached = localStorage.getItem(key)
  if (cached) {
    try {
      const data = JSON.parse(cached)
      const expireTime = data.expireTime
      if (expireTime && new Date(expireTime) > new Date()) {
        return data.password
      } else {
        localStorage.removeItem(key)
      }
    } catch (e) {
      localStorage.removeItem(key)
    }
  }
  return null
}

// 缓存密码（有效期1天）
function cachePassword(articleId, password) {
  const key = `article_pwd_${articleId}`
  const expireTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  localStorage.setItem(key, JSON.stringify({ password, expireTime }))
}

function ArticleDetail({ commentPage = 1, anchorCommentId = null }) {
  const { slug: id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReward, setShowReward] = useState(false)
  const [rewardEnabled, setRewardEnabled] = useState(false)
  const [relatedPostsEnabled, setRelatedPostsEnabled] = useState(true)
  const [tocItems, setTocItems] = useState([])
  const [isNotTop, setIsNotTop] = useState(false)
  const [needPassword, setNeedPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const bottomBarRef = useRef(null)
  const headroomRef = useRef(null)
  const { isAuthenticated } = useSelector(state => state.auth)

  // 接收目录数据的回调
  const handleTocReady = useCallback((items) => {
    setTocItems(items)
  }, [])

  // 监听滚动，控制目录显示
  useEffect(() => {
    const handleScroll = () => {
      setIsNotTop(window.scrollY > 120)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const config = localStorage.getItem('site_config')
    if (config) {
      try {
        const parsed = JSON.parse(config)
        setRewardEnabled(parsed.rewardEnabled === true)
        setRelatedPostsEnabled(parsed.relatedPostsEnabled !== false)
      } catch (e) {}
    }
  }, [])

  useEffect(() => {
    fetchArticle()
  }, [id])

  // 恢复刷新前的滚动位置
  useEffect(() => {
    if (!article) return
    const key = `scroll_${id}`
    const saved = sessionStorage.getItem(key)
    if (saved) {
      sessionStorage.removeItem(key)
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(saved, 10))
      })
    }
  }, [article, id])

  // 页面卸载前保存滚动位置
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(`scroll_${id}`, String(window.scrollY))
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [id])

  useEffect(() => {
    if (bottomBarRef.current && !headroomRef.current) {
      headroomRef.current = new Headroom(bottomBarRef.current, {
        tolerance: 5,
        offset: 100,
        classes: {
          initial: 'bottom-bar-animated',
          pinned: 'bottom-bar-slideUp',
          unpinned: 'bottom-bar-slideDown'
        }
      })
      headroomRef.current.init()
    }
    return () => {
      if (headroomRef.current) {
        try {
          headroomRef.current.destroy()
        } catch (e) {
          // Headroom element already removed
        }
        headroomRef.current = null
      }
    }
  }, [article])

  const fetchArticle = async (pwd = null) => {
    // 非数字ID不请求
    if (!id || !/^\d+$/.test(id)) {
      setLoading(false)
      return
    }
    try {
      // 先检查缓存的密码
      const cachedPwd = pwd || getCachedPassword(id)
      const res = await getArticleDetail(id, cachedPwd || undefined)
      if (res.data.needPassword) {
        setNeedPassword(true)
        setArticle(res.data)
        setLoading(false)
      } else {
        setNeedPassword(false)
        setArticle(res.data)
        incrementViewCount(id)
        setLoading(false)
      }
    } catch (e) {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) {
      setPasswordError('请输入密码')
      return
    }
    setSubmitting(true)
    setPasswordError('')
    try {
      const res = await getArticleDetail(id, password)
      if (res.data.needPassword) {
        setPasswordError('密码错误，请重试')
      } else {
        cachePassword(id, password)
        setNeedPassword(false)
        setArticle(res.data)
        incrementViewCount(id)
      }
    } catch (e) {
      setPasswordError('验证失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading">加载中...</div>
  if (!article) return <NotFoundPage />

  // 密码输入界面
  if (needPassword) {
    return (
      <div className="article-page">
        <div className="article">
          <header className="article-header">
            <h1 className="post-title">
              <FontAwesomeIcon icon={faLock} style={{ marginRight: '8px', color: '#ff6b6b' }} />
              {article.title}
            </h1>
            <div className="post-data">
              <span className="meta-item">
                <FontAwesomeIcon icon={faClock} className="fa-icon" />
                {formatDate(article.publishTime || article.createTime)}
              </span>
            </div>
          </header>
          <div className="password-protected-content">
            <div className="password-form-container">
              <div className="password-icon">
                <FontAwesomeIcon icon={faLock} size="3x" />
              </div>
              <h3>该文章需要密码访问</h3>
              <p>请输入文章密码以查看完整内容</p>
              <form onSubmit={handlePasswordSubmit} className="password-form">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="password-input"
                  autoFocus
                />
                {passwordError && <div className="password-error">{passwordError}</div>}
                <button type="submit" className="password-submit" disabled={submitting}>
                  {submitting ? '验证中...' : '确认访问'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const bgColor = getRandomBgColor()

  return (
    <>
      {/* Post Header with Thumbnail */}
      {article.coverImage ? (
        <div className={`post-header-thumb ${bgColor}`}>
          <div
            className="post-header-thumb-op"
            style={{ backgroundImage: `url(${article.coverImage})` }}
          />
          <div className="post-header-thumb-cover">
            <div className="post-header-thumb-container">
              <div className="post-header-thumb-title">
                {article.title}
              </div>
              <div className="post-header-thumb-meta">
                <span className="meta-item">
                  <FontAwesomeIcon icon={faClock} className="fa-icon" />
                  {formatDate(article.publishTime || article.createTime)}
                </span>
                <span className="meta-item">
                  <FontAwesomeIcon icon={faTags} className="fa-icon" />
                  {article.categoryName && (
                    <Link to={`/category/${article.categoryId}`}>{article.categoryName}</Link>
                  )}
                </span>
                <span className="meta-item">
                  <FontAwesomeIcon icon={faComment} className="fa-icon" />
                  <Link to="#comments">{article.commentCount || 0} 评论</Link>
                </span>
                <span className="meta-item">
                  <FontAwesomeIcon icon={faEye} className="fa-icon" />
                  {isAuthenticated ? (
                    <a href={`/admin/article/edit/${article.id}`} target="_blank" rel="noopener noreferrer" title="编辑文章">
                      {article.viewCount || 0} 浏览
                    </a>
                  ) : (
                      <span>{article.viewCount || 0} 浏览</span>
                  )}

                </span>
              </div>
              <div className="post-tags">
                {article.tags?.map(tag => (
                  <Link key={tag.id} to={`/tag/${tag.id}`}>{tag.tagName}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Article Content */}
      <article className="article-page">
        <div className="article">
          {/* Header (shown on mobile without thumbnail) */}
          <header className="article-header">
            <h1 className="post-title">{article.title}</h1>
            <div className="post-data">
              <span className="meta-item">
                <FontAwesomeIcon icon={faClock} className="fa-icon" />
                {formatDate(article.publishTime || article.createTime)}
              </span>
              <span className="meta-item">
                <FontAwesomeIcon icon={faTags} className="fa-icon" />
                {article.categoryName && (
                  <Link to={`/category/${article.categoryId}`}>{article.categoryName}</Link>
                )}
              </span>
              <span className="meta-item">
                <FontAwesomeIcon icon={faComment} className="fa-icon" />
                <Link to="#comments">{article.commentCount || 0} 评论</Link>
              </span>
              <span className="meta-item">
                <FontAwesomeIcon icon={faEye} className="fa-icon" />
                {isAuthenticated ? (
                  <a href={`/admin/article/edit/${article.id}`} target="_blank" rel="noopener noreferrer" title="编辑文章">
                    {article.viewCount || 0} 浏览
                  </a>
                ) : (
                    <span>{article.viewCount || 0} 浏览</span>
                )}
              </span>
            </div>
          </header>

          {/* Post Tags (shown on mobile) */}
          <div className="post-content">
            <p className="post-tags">
              {article.tags?.map(tag => (
                <Link key={tag.id} to={`/tag/${tag.id}`}>{tag.tagName}</Link>
              ))}
            </p>

            {/* Article Content */}
            <div className="article-content">
              <MarkdownRenderer content={article.content} onTocReady={handleTocReady} />
            </div>
          </div>

          {/* Post Info */}
          <div className="post-info">
            {isAuthenticated && (
              <a className="post-info-edit" href={`/admin/article/edit/${article.id}`} target="_blank" rel="noopener noreferrer">
                <img src={eyeIcon} height="16px" width="16px" alt="编辑" />
              </a>
            )}
            <div className="post-info-author">
              本文由 <a href="/">{article.authorName || 'RawChen'}</a> 发表， 最后编辑时间为：{article.updateTime}
              <br/>如果你觉得我的文章不错，不妨鼓励我继续写作。
            </div>
          </div>

          {/* 打赏支持按钮 */}
          {rewardEnabled && (
            <div className="reward-button">
              <button onClick={() => setShowReward(true)}>支持</button>
            </div>
          )}
          {showReward && (
            <div className="reward-overlay" onClick={() => setShowReward(false)}>
              <div className="reward-qr-code" onClick={e => e.stopPropagation()}>
                <img src="/reward.jpg" alt="打赏二维码" />
              </div>
            </div>
          )}
        </div>

        {/* Related Posts */}
        {relatedPostsEnabled && <RelatedPosts articleId={id} limit={5}/>}

        {/* Next/Prev Navigation */}
        <div className="post-next-prev">
          <div className="padd">
            {article.prevArticle && (
                <div className="next-prev">
                  <Link to={`/${article.prevArticle.id}`} title={article.prevArticle.title}>
                  <div className="card">
                    <div className="card-img">
                      <img
                        src={article.prevArticle.coverImage || 'https://cdn.rawchen.com/cover.jpg'}
                        alt={article.prevArticle.title}
                      />
                      <div className="overlay"></div>
                    </div>
                    <div className="card-body">
                      <h2 className="card-title">{article.prevArticle.title}</h2>
                      <div className="card-footer">
                        <FontAwesomeIcon icon={faAngleLeft} />
                        <span>上一篇</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}
            {article.nextArticle && (
              <div className="next-prev">
                <Link to={`/${article.nextArticle.id}`} title={article.nextArticle.title}>
                  <div className="card">
                    <div className="card-img">
                      <img
                        src={article.nextArticle.coverImage || 'https://cdn.rawchen.com/cover.jpg'}
                        alt={article.nextArticle.title}
                      />
                      <div className="overlay"></div>
                    </div>
                    <div className="card-body">
                      <h2 className="card-title">{article.nextArticle.title}</h2>
                      <div className="card-footer">
                        <span>下一篇</span>
                        <FontAwesomeIcon icon={faAngleRight} />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* TOC Directory */}
      {tocItems.length > 0 && (
        <div className={`directory-content ${isNotTop ? 'headroom-not-top' : ''}`}>
          <div id="directory">
            <TOC items={tocItems} />
          </div>
        </div>
      )}

      {/* Comments */}
      {article.allowComment !== false && (
        <CommentList articleId={id} initialPage={commentPage} anchorCommentId={anchorCommentId} />
      )}

      {/* Post Bottom Bar */}
      <div id="post-bottom-bar" className="post-bottom-bar" ref={bottomBarRef}>
        <div className="bottom-bar-inner">
          <div className="bottom-bar-items social-share left">
            <span className="bottom-bar-item">Share : </span>
            <span className="bottom-bar-item bottom-bar-twitter">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                title={article.title}
              >
                Twitter
              </a>
            </span>
            <span className="bottom-bar-item bottom-bar-facebook">
              <a
                href={`https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(window.location.href)}&title=${article.title}`}
                target="_blank"
                rel="noopener noreferrer"
                title={article.title}
              >
                Qzone
              </a>
            </span>
            <span className="bottom-bar-item bottom-bar-weibo">
              <a
                href={`http://service.weibo.com/share/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(article.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                title={article.title}
              >
                Weibo
              </a>
            </span>
          </div>
          <div className="bottom-bar-items right">
            {article.nextArticle && (
              <span className="bottom-bar-item">
                <Link to={`/${article.nextArticle.id}`}>下一篇 &rarr;</Link>
              </span>
            )}
            {article.prevArticle && (
              <span className="bottom-bar-item">
                <Link to={`/${article.prevArticle.id}`}>&larr; 上一篇</Link>
              </span>
            )}
            <span className="bottom-bar-item">
              <a href="#footer">&darr;</a>
            </span>
            <span className="bottom-bar-item">
              <a href="#">&uarr;</a>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default ArticleDetail
