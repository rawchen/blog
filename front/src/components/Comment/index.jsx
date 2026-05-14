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

  useEffect(() => {
    // 非数字ID不请求
    if (articleId && /^\d+$/.test(String(articleId))) {
      fetchComments()
    } else {
      setLoading(false)
    }
  }, [articleId, page])

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
    // 滚动到评论框
    document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const cancelReply = () => {
    setReplyTo(null)
  }

  // 获取用户代理信息
  const getUserAgent = () => {
    return navigator.userAgent
  }

  if (loading) return null

  return (
    <div className="comment-container">
      <div id="comments" className="clearfix">
        {/* 评论表单 */}
        <div id="respond-page-0" className="zdypl">
          <span className="response">
            发表评论
            {replyTo && (
              <>
                <span style={{ marginLeft: 10 }}>
                  回复 <span style={{ color: '#eb5055' }}>@{replyTo.nickname || replyTo.author}</span>
                </span>
                <a onClick={cancelReply} style={{ marginLeft: 10, cursor: 'pointer' }}>取消回复</a>
              </>
            )}
          </span>
          <CommentForm
            onSubmit={handleSubmit}
            replyTo={replyTo}
            getUserAgent={getUserAgent}
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
