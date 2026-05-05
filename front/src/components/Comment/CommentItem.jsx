import React from 'react'
import Md5 from 'md5'
import './index.css'

// 获取头像URL
const getAvatarUrl = (email) => {
  const hash = email ? Md5(email.toLowerCase()) : 'default'
  return `https://weavatar.com/avatar/${hash}?d=mp&s=80`
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

function CommentItem({ comment, onReply, depth = 1 }) {
  const {
    id,
    nickname,
    author,
    email,
    avatar,
    content,
    createTime,
    browser,
    os,
    userId,
    children = [],
    replyUser
  } = comment

  const displayName = nickname || author || '游客'
  const displayAvatar = avatar || getAvatarUrl(email)
  const isAuthor = userId && userId !== 0 // 文章作者

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
              {isAuthor && <span style={{ color: '#eb5055', marginLeft: 5 }}>作者</span>}
            </span>
          </div>
          <div className="comment-content">
            {replyUser && (
              <span className="comment-author-at">
                <a href={`#comment-${replyUser.id}`}>@{replyUser.nickname || replyUser.author}</a>
              </span>
            )}
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </div>
          <div className="comment-meta">
            <time className="comment-time">{formatTime(createTime)}</time>
            {os && (
              <span className="agent">
                <i className="fa fa-apple" aria-hidden="true"></i>
                {os}
              </span>
            )}
            {browser && (
              <span className="agent">
                <i className="fa fa-chrome" aria-hidden="true"></i>
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
              />
            ))}
          </ol>
        </div>
      )}
    </li>
  )
}

export default CommentItem
