import React from 'react'
import Md5 from 'md5'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDesktop } from '@fortawesome/free-solid-svg-icons'
import {
  faChrome,
  faFirefox,
  faEdge,
  faSafari,
  faOpera,
  faWindows,
  faApple,
  faAndroid,
  faLinux
} from '@fortawesome/free-brands-svg-icons'
import './index.css'

// 获取头像URL
const getAvatarUrl = (email, domain) => {
  const hash = email ? Md5(email.toLowerCase()) : 'default'
  const gravatarDomain = domain || 'weavatar.com'
  return `https://${gravatarDomain}/avatar/${hash}?d=mp`
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 解析User-Agent获取浏览器和操作系统
const parseUserAgent = (ua) => {
  if (!ua) return { browser: null, os: null }

  let browser = null
  let os = null

  // 检测操作系统
  if (ua.includes('Windows NT 10')) os = 'Windows 11'
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1'
  else if (ua.includes('Windows NT 6.2')) os = 'Windows 8'
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7'
  else if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS X')) {
    os = `OSX`
    // const match = ua.match(/Mac OS X (\d+[._]\d+)/)
    // os = match ? `OSX ${match[1].replace('_', '.')}` : 'macOS'
  }
  else if (ua.includes('Android')) {
    const match = ua.match(/Android (\d+\.?\d*)/)
    os = match ? `Android ${match[1]}` : 'Android'
  }
  else if (ua.includes('iPhone') || ua.includes('iPad')) {
    const match = ua.match(/OS (\d+[._]\d+)/)
    os = match ? `iOS ${match[1].replace('_', '.')}` : 'iOS'
  }
  else if (ua.includes('Linux')) os = 'Linux'

  // 检测浏览器
  if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/(\d+)/)
    browser = match ? `Edge ${match[1]}` : 'Edge'
  }
  else if (ua.includes('Chrome/') && !ua.includes('Edg')) {
    const match = ua.match(/Chrome\/(\d+)/)
    browser = match ? `Chrome ${match[1]}` : 'Chrome'
  }
  else if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/(\d+)/)
    browser = match ? `Firefox ${match[1]}` : 'Firefox'
  }
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/(\d+)/)
    browser = match ? `Safari ${match[1]}` : 'Safari'
  }
  else if (ua.includes('Opera') || ua.includes('OPR/')) {
    const match = ua.match(/(?:Opera|OPR)\/(\d+)/)
    browser = match ? `Opera ${match[1]}` : 'Opera'
  }

  return { browser, os }
}

function CommentItem({ comment, onReply, depth = 1, gravatarDomain }) {
  const {
    id,
    nickname,
    author,
    email,
    avatar,
    content,
    createTime,
    userAgent,
    userId,
    children = [],
    replyUserName,
    replyUserId
  } = comment

  const displayName = nickname || author || '游客'
  const displayAvatar = avatar || getAvatarUrl(email, gravatarDomain)
  const isAuthor = userId && userId !== 0 // 文章作者
  const { browser, os } = parseUserAgent(userAgent)

  // 根据浏览器类型选择图标
  const getBrowserIcon = () => {
    if (!browser) return null
    if (browser.includes('Chrome')) return faChrome
    if (browser.includes('Firefox')) return faFirefox
    if (browser.includes('Edge')) return faEdge
    if (browser.includes('Safari')) return faSafari
    if (browser.includes('Opera')) return faOpera
    return faDesktop
  }

  // 根据操作系统选择图标
  const getOsIcon = () => {
    if (!os) return null
    if (os.includes('Windows')) return faWindows
    if (os.includes('OSX') || os.includes('iOS')) return faApple
    if (os.includes('Android')) return faAndroid
    if (os.includes('Linux')) return faLinux
    return faDesktop
  }

  const commentClass = [
    'comment-body',
    depth > 1 && depth < 3 ? 'comment-child' : '',
    depth > 2 ? 'comment-child2' : '',
    depth === 1 ? 'comment-parent' : '',
    depth % 2 === 0 ? 'comment-even' : 'comment-odd'
  ].filter(Boolean).join(' ')

  return (
    <li id={`li-comment-${id}`} className={commentClass}>
      <div id={`comment-${id}`}>
        <div className="comment-view">
          <div className="comment-header">
            <img
              className="avatar"
              src={displayAvatar}
              alt={displayName}
              width="40"
              height="40"
            />
            <span className={`comment-author ${isAuthor ? 'comment-by-author' : ''}`}>
              {comment.website ? (
                <a href={comment.website} target="_blank" rel="noopener noreferrer">
                  {displayName}
                </a>
              ) : (
                displayName
              )}
              {isAuthor && <span style={{ color: '#eb5055', marginLeft: 5 }}></span>}
            </span>
          </div>
          <div className="comment-content">
            {replyUserName && (
              <span className="comment-author-at">
                <a href={`#comment-${replyUserId}`}>@{replyUserName}</a>
              </span>
            )}
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </div>
          <div className="comment-meta">
            <time className="comment-time">{formatTime(createTime)}</time>
            {os && (
              <span className="agent">
                <FontAwesomeIcon icon={getOsIcon()} />
                {os}
              </span>
            )}
            {browser && (
              <span className="agent">
                <FontAwesomeIcon icon={getBrowserIcon()} />
                {browser}
              </span>
            )}
            <span
              className="comment-reply"
              onClick={() => onReply(comment)}
              title="回复"
            >
            </span>
          </div>
        </div>
      </div>

      {/* 子评论 */}
      {children && children.length > 0 && (
        <div className="comment-children">
          <ol className="comment-list">
            {children.map(child => (
              <CommentItem
                key={child.id}
                comment={child}
                onReply={onReply}
                depth={depth + 1}
                gravatarDomain={gravatarDomain}
              />
            ))}
          </ol>
        </div>
      )}
    </li>
  )
}

export default CommentItem
