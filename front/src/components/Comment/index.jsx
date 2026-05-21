import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { message } from 'antd'
import CommentItem from './CommentItem'
import CommentForm from './CommentForm'
import { getCommentList, submitComment, getCommentPageNum } from '../../api/comment'
import { clearAuth } from '../../store/modules/auth'
import './index.css'

function CommentList({ articleId, initialPage = 1, anchorCommentId = null }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState(null)
  const [page, setPage] = useState(initialPage)
  const [total, setTotal] = useState(0)
  const [pageResolved, setPageResolved] = useState(!anchorCommentId) // 页码是否已确定
  const pageSize = 10
  const siteConfig = useSelector(state => state.siteConfig.data) || {}
  const gravatarDomain = siteConfig.gravatarDomain
  const dispatch = useDispatch()

  // 登录用户状态
  const { isAuthenticated, userInfo } = useSelector(state => state.auth)

  // 游客信息状态
  const [savedInfo, setSavedInfo] = useState(null)
  const [showGuestInfo, setShowGuestInfo] = useState(true)

  // 是否为登录用户
  const isLoggedIn = isAuthenticated && userInfo

  // 当有锚点评论ID时，先查询其所在页码
  useEffect(() => {
    if (!articleId || !/^\d+$/.test(String(articleId))) {
      setLoading(false)
      setPageResolved(true)
      return
    }
    if (anchorCommentId) {
      getCommentPageNum(articleId, anchorCommentId, pageSize).then(res => {
        const targetPage = res.data || 1
        setPage(targetPage)
        setPageResolved(true)
      }).catch(() => {
        setPage(initialPage)
        setPageResolved(true)
      })
    }
  }, [articleId, anchorCommentId])

  // 页码确定后才加载评论
  useEffect(() => {
    if (!pageResolved) return
    if (articleId && /^\d+$/.test(String(articleId))) {
      fetchComments()
    } else {
      setLoading(false)
    }
  }, [articleId, page, pageResolved])

  // 加载完评论后滚动到锚点
  useEffect(() => {
    if (!comments.length) return

    const hash = window.location.hash
    if (!hash) return

    const commentMatch = hash.match(/^#comment-(\d+)$/)
    if (commentMatch) {
      // 延迟滚动，等DOM渲染完成
      setTimeout(() => {
        const el = document.getElementById(`comment-${commentMatch[1]}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add('comment-highlight')
          setTimeout(() => el.classList.remove('comment-highlight'), 3000)
        }
      }, 300)
    } else if (hash === '#comments') {
      setTimeout(() => {
        const el = document.getElementById('comments')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300)
    }
  }, [comments])

  useEffect(() => {
    // 登录用户不需要读取游客信息
    if (isLoggedIn) {
      setShowGuestInfo(false)
      return
    }
    // 从localStorage读取保存的游客信息
    const saved = localStorage.getItem('comment_user_info')
    if (saved) {
      const info = JSON.parse(saved)
      setSavedInfo(info)
      setShowGuestInfo(false)
    }
  }, [isLoggedIn])

  const fetchComments = async () => {
    try {
      const res = await getCommentList(articleId, { current: page, size: pageSize })
      // 后端已返回树形结构，直接使用
      setComments(res.data?.records || [])
      setTotal(res.data?.total || 0)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data) => {
    try {
      // 构建评论数据
      const commentData = {
        articleId,
        parentId: replyTo?.id || 0,
        replyUserId: replyTo?.userId || null,
        userAgent: navigator.userAgent,
        content: data.content
      }

      if (isLoggedIn) {
        // 登录用户：使用用户信息
        commentData.nickname = userInfo.nickname || userInfo.username || userInfo.name
        commentData.email = userInfo.email
        commentData.userId = userInfo.id
        // website使用siteConfig.site_url或当前域名
        commentData.website = siteConfig.siteUrl || window.location.origin
      } else {
        // 游客：使用表单数据
        commentData.nickname = data.nickname
        commentData.email = data.email
        commentData.website = data.website
        // 保存游客信息
        if (data.nickname && data.email) {
          const info = {
            nickname: data.nickname,
            email: data.email,
            website: data.website
          }
          localStorage.setItem('comment_user_info', JSON.stringify(info))
          setSavedInfo(info)
          setShowGuestInfo(false)
        }
      }

      await submitComment(commentData)
      setReplyTo(null)
      fetchComments()
      message.success('发送评论成功')
      return true
    } catch (error) {
      message.error('发送评论失败')
      return false
    }
  }

  const handleReply = (comment) => {
    setReplyTo(comment)
  }

  const cancelReply = () => {
    setReplyTo(null)
  }

  const toggleGuestInfo = () => {
    setShowGuestInfo(!showGuestInfo)
  }

  // 退出登录
  const handleLogout = () => {
    dispatch(clearAuth())
    message.success('已退出登录')
  }

  // 生成分页永久链接URL
  const getCommentPageUrl = (pageNum) => {
    const basePath = window.location.pathname.replace(/\/comment-page-\d+$/, '')
    if (pageNum === 1) {
      return `${basePath}#comments`
    }
    return `${basePath}/comment-page-${pageNum}#comments`
  }

  // 分页导航（使用replaceState避免组件重新挂载）
  const handlePageChange = (pageNum) => {
    const url = getCommentPageUrl(pageNum)
    window.history.replaceState(null, '', url)
    setPage(pageNum)
    // 滚动到评论区顶部
    const commentsEl = document.getElementById('comments')
    if (commentsEl) {
      commentsEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 渲染response头部
  const renderResponse = (replyDisplayName) => (
    <span className="response">
      发表评论
      {isLoggedIn ? (
        <>
          {' / '}
          <span style={{ color: '#eb5055' }}>{userInfo.nickname || userInfo.username || userInfo.name}</span> 你好.{' '}
          <a onClick={handleLogout} style={{ cursor: 'pointer', color: '#eb5055' }}>注销</a> ?
        </>
      ) : savedInfo && !showGuestInfo ? (
        <>
          {' / '}
          <span style={{ color: '#eb5055' }}>{savedInfo.nickname}</span> 你好.{' '}
          <a onClick={toggleGuestInfo} style={{ cursor: 'pointer', color: '#eb5055' }}>修改昵称</a> ?
        </>
      ) : null}
      {replyDisplayName && (
        <>
          {' '}
          <span style={{ marginLeft: 10 }}>
            回复 <span style={{ color: '#eb5055' }}>@{replyDisplayName}</span>
          </span>
          <a onClick={cancelReply} style={{ marginLeft: 10, cursor: 'pointer' }}>取消评论</a>
        </>
      )}
    </span>
  )

  if (loading) return null

  return (
    <div className="comment-container">
      <div id="comments" className="clearfix">
        {/* 评论表单 - 只在不回复时显示在顶部 */}
        <div id="respond-page-0" className="zdypl" style={{ display: replyTo ? 'none' : 'block' }}>
          {renderResponse()}
          <CommentForm
            onSubmit={handleSubmit}
            replyTo={null}
            savedInfo={isLoggedIn ? null : savedInfo}
            showGuestInfo={isLoggedIn ? false : showGuestInfo}
            toggleGuestInfo={isLoggedIn ? null : toggleGuestInfo}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* 评论列表 */}
        {comments.length > 0 ? (
          <>
            <ol className="comment-list">
              {comments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                  depth={1}
                  gravatarDomain={gravatarDomain}
                  replyTo={replyTo}
                  cancelReply={cancelReply}
                  renderResponse={renderResponse}
                  commentFormProps={{
                    onSubmit: handleSubmit,
                    savedInfo: isLoggedIn ? null : savedInfo,
                    showGuestInfo: isLoggedIn ? false : showGuestInfo,
                    toggleGuestInfo: isLoggedIn ? null : toggleGuestInfo,
                    isLoggedIn
                  }}
                />
              ))}
            </ol>

            {/* 分页 */}
            {total > pageSize && (
              <div className="lists-navigator clearfix">
                <ol className="page-navigator">
                  {page > 1 && (
                    <li className="prev">
                      <a onClick={() => handlePageChange(page - 1)}>&lt;</a>
                    </li>
                  )}
                  {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1)
                    .slice(Math.max(0, page - 3), Math.min(Math.ceil(total / pageSize), page + 2))
                    .map(p => (
                      <li key={p} className={p === page ? 'current' : ''}>
                        <a onClick={() => handlePageChange(p)}>{p}</a>
                      </li>
                    ))}
                  {page < Math.ceil(total / pageSize) && (
                    <li className="next">
                      <a onClick={() => handlePageChange(page + 1)}>&gt;</a>
                    </li>
                  )}
                </ol>
              </div>
            )}
          </>
        ) : (
          <div className="no-comments">暂无评论，快来抢沙发吧！</div>
        )}
      </div>
    </div>
  )
}

export default CommentList
