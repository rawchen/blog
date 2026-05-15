import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { message } from 'antd'
import CommentItem from './CommentItem'
import CommentForm from './CommentForm'
import { getCommentList, submitComment } from '../../api/comment'
import { clearAuth } from '../../store/modules/auth'
import './index.css'

function CommentList({ articleId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
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

  useEffect(() => {
    // 非数字ID不请求
    if (articleId && /^\d+$/.test(String(articleId))) {
      fetchComments()
    } else {
      setLoading(false)
    }
  }, [articleId, page])

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
                      <a onClick={() => setPage(page - 1)}>&lt;</a>
                    </li>
                  )}
                  {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1)
                    .slice(Math.max(0, page - 3), Math.min(Math.ceil(total / pageSize), page + 2))
                    .map(p => (
                      <li key={p} className={p === page ? 'current' : ''}>
                        <a onClick={() => setPage(p)}>{p}</a>
                      </li>
                    ))}
                  {page < Math.ceil(total / pageSize) && (
                    <li className="next">
                      <a onClick={() => setPage(page + 1)}>&gt;</a>
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
