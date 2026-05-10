import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
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
    if (articleId) {
      fetchComments()
    }
  }, [articleId, page])

  const fetchComments = async () => {
    try {
      const res = await getCommentList(articleId, { current: page, size: pageSize })
      // 将扁平列表转换为树形结构
      const treeData = buildTree(res.data?.records || [])
      setComments(treeData)
      setTotal(res.data?.total || 0)
    } finally {
      setLoading(false)
    }
  }

  // 构建树形结构
  const buildTree = (items) => {
    const map = {}
    const roots = []

    // 先建立id到item的映射
    items.forEach(item => {
      map[item.id] = { ...item, children: [] }
    })

    // 构建树
    items.forEach(item => {
      if (item.parentId && item.parentId !== 0 && map[item.parentId]) {
        map[item.parentId].children.push(map[item.id])
      } else {
        roots.push(map[item.id])
      }
    })

    return roots
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
      return true
    } catch (error) {
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

  // 获取浏览器和操作系统信息
  const getBrowserInfo = () => {
    const ua = navigator.userAgent
    let browser = 'Unknown'
    let os = 'Unknown'

    // 检测操作系统
    if (ua.includes('Windows NT 10')) os = 'Windows 11'
    else if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

    // 检测浏览器
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Edg')) browser = 'Edge'
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

    return { browser, os, agent: ua }
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
            getBrowserInfo={getBrowserInfo}
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
