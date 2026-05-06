import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faTags, faComment, faEye, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { getArticleDetail, incrementViewCount } from '../../api/article'
import CommentList from '../../components/Comment'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import RelatedPosts from '../../components/RelatedPosts'
import Headroom from 'headroom.js'
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

function ArticleDetail() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const bottomBarRef = useRef(null)
  const headroomRef = useRef(null)

  useEffect(() => {
    fetchArticle()
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

  const fetchArticle = async () => {
    try {
      const res = await getArticleDetail(id)
      setArticle(res.data)
      incrementViewCount(id)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">加载中...</div>
  if (!article) return <div className="empty">文章不存在</div>

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
                  {article.viewCount || 0} 浏览
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
                {article.viewCount || 0} 浏览
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
              <MarkdownRenderer content={article.content} />
            </div>
          </div>

          {/* Post Info */}
          <div className="post-info">
            <div style={{ textAlign: 'center' }}>
              本文由 <a href="/">{article.authorName || 'RawChen'}</a> 发表
              {article.updateTime && (
                <>， 最后编辑时间为：{formatDate(article.updateTime)}</>
              )}
            </div>
          </div>
        </div>

        {/* Related Posts */}
        <RelatedPosts articleId={id} limit={5} />

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

      {/* Comments */}
      {article.allowComment !== false && (
        <CommentList articleId={id} />
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
