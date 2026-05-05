import React, { useState, useEffect } from 'react'
import './index.css'

function CommentForm({ onSubmit, replyTo, getBrowserInfo }) {
  const [form, setForm] = useState({
    nickname: '',
    email: '',
    website: '',
    content: ''
  })
  const [showGuestInfo, setShowGuestInfo] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savedInfo, setSavedInfo] = useState(null)

  useEffect(() => {
    // 从localStorage读取保存的用户信息
    const saved = localStorage.getItem('comment_user_info')
    if (saved) {
      const info = JSON.parse(saved)
      setSavedInfo(info)
      setForm(prev => ({
        ...prev,
        nickname: info.nickname || '',
        email: info.email || '',
        website: info.website || ''
      }))
      setShowGuestInfo(false)
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.content.trim()) return

    setSubmitting(true)
    try {
      const browserInfo = getBrowserInfo()
      const data = {
        ...form,
        ...browserInfo
      }

      // 保存用户信息
      if (form.nickname && form.email) {
        localStorage.setItem('comment_user_info', JSON.stringify({
          nickname: form.nickname,
          email: form.email,
          website: form.website
        }))
      }

      const success = await onSubmit(data)
      if (success) {
        setForm(prev => ({ ...prev, content: '' }))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const toggleGuestInfo = () => {
    setShowGuestInfo(!showGuestInfo)
  }

  return (
    <form
      id="comment-form"
      className="comment-form"
      onSubmit={handleSubmit}
      role="form"
    >
      {/* 已登录用户欢迎信息 */}
      {savedInfo && !showGuestInfo && (
        <div className="guest-info-toggle">
          <span>{savedInfo.nickname}</span> 欢迎回来，
          <span onClick={toggleGuestInfo}>修改昵称 ?</span>
        </div>
      )}

      {/* 游客信息输入 */}
      {showGuestInfo && (
        <div className="guest-info">
          <input
            type="text"
            name="nickname"
            className="form-control input-control"
            placeholder="昵称 (必填哦)"
            value={form.nickname}
            onChange={handleChange}
            maxLength={12}
            required
          />
          <input
            type="email"
            name="email"
            className="form-control input-control"
            placeholder="邮箱 (必填哦)"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="url"
            name="website"
            className="form-control input-control"
            placeholder="博客地址 (https://)"
            value={form.website}
            onChange={handleChange}
          />
        </div>
      )}

      {/* 回复提示 */}
      {replyTo && (
        <div style={{ padding: '10px 0', color: '#666', fontSize: '13px' }}>
          回复 <span style={{ color: '#eb5055' }}>@{replyTo.nickname || replyTo.author}</span>
        </div>
      )}

      {/* 评论内容 */}
      <textarea
        id="textarea"
        name="content"
        className="form-control"
        placeholder="我来简单喵两句"
        value={form.content}
        onChange={handleChange}
        required
      />

      <button
        type="submit"
        className="submit"
        id="misubmit"
        disabled={submitting}
      >
        {submitting ? '提交中...' : '提交'}
      </button>
    </form>
  )
}

export default CommentForm
