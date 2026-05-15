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
import { dateWord } from '../../utils/datetime'
import { parseSmilies } from '../../utils/smilies'
import CommentForm from './CommentForm'
import './index.css'

// 导入所有表情图片
const smilieImages = import.meta.glob('../../assets/images/smilies/bilibili/*.png', { eager: true, import: 'default' })

// 获取表情图片URL
const getSmilieImgUrl = (filename) => {
  const key = `../../assets/images/smilies/bilibili/${filename}`
  return smilieImages[key] || ''
}

// 解析表情代码为图片
const renderSmilies = (text) => {
  if (!text) return ''

  // 先解析链接，再解析表情
  let result = parseLinks(text)

  // 替换表情代码为实际图片URL
  const SMILIES_MAP = {
    ':mrgreen:': 'icon_mrgreen.png',
    ':neutral:': 'icon_neutral.png',
    ':twisted:': 'icon_twisted.png',
    ':arrow:': 'icon_arrow.png',
    ':shock:': 'icon_eek.png',
    ':smile:': 'icon_smile.png',
    ':???:': 'icon_confused.png',
    ':cool:': 'icon_cool.png',
    ':evil:': 'icon_evil.png',
    ':grin:': 'icon_biggrin.png',
    ':idea:': 'icon_idea.png',
    ':oops:': 'icon_redface.png',
    ':razz:': 'icon_razz.png',
    ':roll:': 'icon_rolleyes.png',
    ':wink:': 'icon_wink.png',
    ':cry:': 'icon_cry.png',
    ':eek:': 'icon_surprised.png',
    ':lol:': 'icon_lol.png',
    ':mad:': 'icon_mad.png',
    ':sad:': 'icon_sad.png',
    ':!:': 'icon_exclaim.png',
    ':?:': 'icon_question.png',
    ':guzhang:': 'guzhang.png',
    ':ok:': 'ok.png',
    ':chigua:': 'chigua.png',
    ':waizui:': 'waizui.png',
    ':keguazi:': 'keguazi.png',
  }

  // 替换表情图片URL
  Object.entries(SMILIES_MAP).forEach(([code, filename]) => {
    const imgUrl = getSmilieImgUrl(filename)
    const escapedCode = code.replace(/[?!]/g, '\\$&')
    const regex = new RegExp(escapedCode, 'g')
    result = result.replace(regex, `<img class="smilies-img" src="${imgUrl}" alt="${code}" title="${code}" style="max-width:30px;display:inline-block;vertical-align:middle;margin:2px 0;" />`)
  })

  return result
}

// 获取头像URL
const getAvatarUrl = (email, domain) => {
  const hash = email ? Md5(email.toLowerCase()) : 'default'
  const gravatarDomain = domain || 'weavatar.com'
  return `https://${gravatarDomain}/avatar/${hash}?d=mp`
}

// 解析链接，将URL转换为可点击的a标签
const parseLinks = (text) => {
  if (!text) return ''
  // 匹配 http:// 或 https:// 开头的URL
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
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

function CommentItem({ comment, onReply, depth = 1, gravatarDomain, replyTo, cancelReply, renderResponse, commentFormProps }) {
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
  const isReplying = replyTo?.id === id

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
            <span dangerouslySetInnerHTML={{ __html: renderSmilies(content) }} />
          </div>
          <div className="comment-meta">
            <time className="comment-time">{dateWord(createTime)}</time>
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

      {/* 回复表单 - 当回复此评论时显示 */}
      {isReplying && commentFormProps && (
        <div id={`respond-comment-${id}`} className="zdypl">
          {renderResponse(displayName)}
          <CommentForm {...commentFormProps} />
        </div>
      )}

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
                replyTo={replyTo}
                cancelReply={cancelReply}
                renderResponse={renderResponse}
                commentFormProps={commentFormProps}
              />
            ))}
          </ol>
        </div>
      )}
    </li>
  )
}

export default CommentItem
