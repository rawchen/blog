import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faGithubAlt, faTelegram, faWeibo, faTwitter} from '@fortawesome/free-brands-svg-icons'
import {faEnvelope, faComments, faRss, faComment, faGlobe, faEarthAsia} from '@fortawesome/free-solid-svg-icons'
import { getSiteConfig } from '../../api/config'
import { getArticleList } from '../../api/article'
import { getRecentComments } from '../../api/comment'
import { getSiteStat } from '../../api/stat'
import './index.css'

// 打字机效果
function startTypewriter(element) {
  const colors = [
    "rgb(110,64,170)", "rgb(150,61,179)", "rgb(191,60,175)", "rgb(228,65,157)",
    "rgb(254,75,131)", "rgb(255,94,99)", "rgb(255,120,71)", "rgb(251,150,51)",
    "rgb(226,183,47)", "rgb(198,214,60)", "rgb(175,240,91)", "rgb(127,246,88)",
    "rgb(82,246,103)", "rgb(48,239,130)", "rgb(29,223,163)", "rgb(26,199,194)",
    "rgb(35,171,216)", "rgb(54,140,225)", "rgb(76,110,219)", "rgb(96,84,200)"
  ]
  const prefix = "喜欢什么就去做吧！"
  const skills = ["后端开发", "极简化", "写博客", "去看海", "户外运动", "摄影"].map(s => s + ".")

  function randomColor() {
    return colors[Math.floor(Math.random() * colors.length)]
  }

  function randomChar() {
    return String.fromCharCode(94 * Math.random() + 33)
  }

  function createChars(count) {
    const frag = document.createDocumentFragment()
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span")
      span.textContent = randomChar()
      span.style.color = randomColor()
      frag.appendChild(span)
    }
    return frag
  }

  let state = { text: "", prefixP: -5, skillI: 0, skillP: 0, direction: "forward", delay: 2, step: 1 }

  function tick() {
    const skill = skills[state.skillI]
    if (state.step) {
      state.step--
    } else {
      state.step = 1
      if (state.prefixP < prefix.length) {
        if (state.prefixP >= 0) state.text += prefix[state.prefixP]
        state.prefixP++
      } else if (state.direction === "forward") {
        if (state.skillP < skill.length) {
          state.text += skill[state.skillP]
          state.skillP++
        } else {
          if (state.delay) {
            state.delay--
          } else {
            state.direction = "backward"
            state.delay = 2
          }
        }
      } else {
        if (state.skillP > 0) {
          state.text = state.text.slice(0, -1)
          state.skillP--
        } else {
          state.skillI = (state.skillI + 1) % skills.length
          state.direction = "forward"
        }
      }
    }
    element.textContent = state.text
    const charCount = state.prefixP < prefix.length
      ? Math.min(5, 5 + state.prefixP)
      : Math.min(5, skill.length - state.skillP)
    element.appendChild(createChars(charCount))
    setTimeout(tick, 75)
  }

  tick()
}

function Footer() {
  const [siteConfig, setSiteConfig] = useState({})
  const [recentArticles, setRecentArticles] = useState([])
  const [recentComments, setRecentComments] = useState([])
  const [siteStat, setSiteStat] = useState({})
  const descriptionRef = useRef(null)

  useEffect(() => {
    loadSiteConfig()
    loadRecentArticles()
    loadRecentComments()
    loadSiteStat()
  }, [])

  useEffect(() => {
    if (descriptionRef.current) {
      startTypewriter(descriptionRef.current)
    }
  }, [])

  const loadSiteConfig = async () => {
    try {
      const res = await getSiteConfig()
      if (res.code === 200) {
        setSiteConfig(res.data || {})
      }
    } catch (e) {
      console.error('加载站点配置失败', e)
    }
  }

  const loadRecentArticles = async () => {
    try {
      const res = await getArticleList({ current: 1, size: 5 })
      if (res.code === 200) {
        setRecentArticles(res.data?.records || [])
      }
    } catch (e) {
      console.error('加载最新文章失败', e)
    }
  }

  const loadRecentComments = async () => {
    try {
      const res = await getRecentComments({ limit: 5 })
      if (res.code === 200) {
        setRecentComments(res.data || [])
      }
    } catch (e) {
      console.error('加载最近评论失败', e)
    }
  }

  const loadSiteStat = async () => {
    try {
      const res = await getSiteStat()
      if (res.code === 200) {
        setSiteStat(res.data || {})
      }
    } catch (e) {
      console.error('加载站点统计失败', e)
    }
  }

  // 计算运行年限
  const getRunningYears = () => {
    const startDate = siteConfig.siteCreateDate || '2018-04-10'
    const start = new Date(startDate)
    const now = new Date()
    const years = ((now - start) / (1000 * 60 * 60 * 24 * 365)).toFixed(2)
    return years
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="web-footer">
      {/* 社交链接 */}
      <div className="footer-social">
        <div className="footer-social-center">
          <div className="social-list">
            {siteConfig.weiboUrl && (
              <a
                className="social weibo"
                target="_blank"
                rel="noopener noreferrer"
                href={siteConfig.weiboUrl}
              >
               WEIBO
              </a>
            )}
            {siteConfig.zhihuUrl && (
              <a
                className="social zhihu"
                target="_blank"
                rel="noopener noreferrer"
                href={siteConfig.zhihuUrl}
              >
                ZHIHU
              </a>
            )}
            <a className="social rss" href="/api/feed" target="_blank" rel="noopener noreferrer">
              RSS
            </a>
            {siteConfig.githubUrl && (
              <a
                className="social github"
                target="_blank"
                rel="noopener noreferrer"
                href={siteConfig.githubUrl}
              >
                GITHUB
              </a>
            )}
            {siteConfig.twitterUrl && (
              <a
                className="social twitter"
                target="_blank"
                rel="noopener noreferrer"
                href={siteConfig.twitterUrl}
              >
                TWITTER
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="footer-meta">
        <div className="footer-container">
          {/* 站点信息 */}
          <div className="meta-item meta-copyright">
            <div className="meta-copyright-info">
              <Link to="/" className="info-logo">
                {siteConfig.siteFooterLogo ? (
                  <img src={siteConfig.siteFooterLogo} alt={siteConfig.siteName || 'Blog'} />
                ) : (
                  siteConfig.siteName || 'RawChen'
                )}
              </Link>
              <div className="info-text">
                <p id="yephy" ref={descriptionRef}></p>
                <p>© 2018-{currentYear} {siteConfig.siteName || 'RawChen'}</p>
                {siteConfig.siteIcp && (
                  <p className="icp">
                    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
                      {siteConfig.siteIcp}
                    </a>
                  </p>
                )}
                <p>已在世界的角落里存活了<b> {getRunningYears()} </b>年</p>
                <p>博主共写了<b> {siteStat.articleCount || 0} </b>篇文章</p>
                <p>网站已经被<b> {siteStat.visitCount || 0} </b>人踩踏</p>
                <p className="footer-icons">
                  {siteConfig.githubUrl && (
                    <a href={siteConfig.githubUrl} title="GitHub" target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={faGithubAlt} className="footer-icon" />
                    </a>
                  )}
                  {siteConfig.qqNumber && (
                    <a href={`http://wpa.qq.com/msgrd?v=3&uin=${siteConfig.qqNumber}`} title="QQ" target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={faComment} className="footer-icon" />
                    </a>
                  )}
                  {siteConfig.telegramUrl && (
                    <a href={siteConfig.telegramUrl} title="Telegram" target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={faTelegram} className="footer-icon" />
                    </a>
                  )}
                  <a href="/api/feed" title="Feed" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={faRss} className="footer-icon" />
                  </a>
                  {siteConfig.email && (
                    <a href={`mailto:${siteConfig.email}`} title="Email">
                      <FontAwesomeIcon icon={faEnvelope} className="footer-icon" />
                    </a>
                  )}
                  {/* 统计URL */}
                  {siteConfig.statsUrl && (
                    <a href={siteConfig.statsUrl} title="Stats" target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={faEarthAsia} className="footer-icon" />
                    </a>
                  )}

                </p>
              </div>
            </div>
          </div>

          {/* 最新文章 */}
          <div className="meta-item meta-posts">
            <h3 className="meta-title">最新文章</h3>
            <ul className="meta-posts-list">
              {recentArticles.length > 0 ? (
                recentArticles.map(article => (
                  <li key={article.id}>
                    <Link to={`/article/${article.id}`}>
                      {article.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li><span>暂无文章</span></li>
              )}
            </ul>
          </div>

          {/* 最近评论 */}
          <div className="meta-item meta-comments">
            <h3 className="meta-title">最近评论</h3>
            <ul className="meta-comments-list">
              {recentComments.length > 0 ? (
                recentComments.map(comment => (
                  <li key={comment.id}>
                    <Link to={`/article/${comment.articleId}`}>
                      <span className="comment-author">{comment.nickname}:</span>
                      <span className="comment-content">
                        {comment.content.length > 30
                          ? comment.content.substring(0, 30) + '...'
                          : comment.content}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                <li><span>暂无评论</span></li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
