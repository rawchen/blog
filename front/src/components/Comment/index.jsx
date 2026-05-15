import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { message } from 'antd'
import CommentItem from './CommentItem'
import CommentForm from './CommentForm'
import { getCommentList, submitComment } from '../../api/comment'
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

  // 用户信息状态
  const [savedInfo, setSavedInfo] = useState(null)
  const [showGuestInfo, setShowGuestInfo] = useState(true)

  useEffect(() => {
    // 非数字ID不请求
    if (articleId && /^\d+$/.test(String(articleId))) {
      fetchComments()
    } else {
      setLoading(false)
    }
  }, [articleId, page])

  useEffect(() => {
    // 从localStorage读取保存的用户信息
    const saved = localStorage.getItem('comment_user_info')
    if (saved) {
      const info = JSON.parse(saved)
      setSavedInfo(info)
      setShowGuestInfo(false)
    }
  }, [])

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
      await submitComment({
        ...data,
        articleId,
        parentId: replyTo?.id || 0,
        replyUserId: replyTo?.userId || null
      })
      // 保存用户信息
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

  // 获取用户代理信息
  const getUserAgent = () => {
    return navigator.userAgent
  }

  // 渲染response头部
  const renderResponse = (replyDisplayName) => (
    <span className="response">
      发表评论
      {savedInfo && !showGuestInfo && (
        <>
          {' / '}
          <span style={{ color: '#eb5055' }}>{savedInfo.nickname}</span> 你好.{' '}
          <a onClick={toggleGuestInfo} style={{ cursor: 'pointer', color: '#eb5055' }}>修改昵称</a> ?
        </>
      )}
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
            getUserAgent={getUserAgent}
            savedInfo={savedInfo}
            showGuestInfo={showGuestInfo}
            toggleGuestInfo={toggleGuestInfo}
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
                    replyTo,
                    getUserAgent,
                    savedInfo,
                    showGuestInfo,
                    toggleGuestInfo
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
