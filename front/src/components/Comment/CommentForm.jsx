import React, { useState, useEffect, useRef } from 'react'
import { SMILIES_LIST, SMILIES_MAP } from '../../utils/smilies'
import './index.css'

// 导入所有表情图片
const smilieImages = import.meta.glob('../../assets/images/smilies/bilibili/*.png', { eager: true, import: 'default' })

// 获取表情图片URL
const getSmilieImgUrl = (filename) => {
  const key = `../../assets/images/smilies/bilibili/${filename}`
  return smilieImages[key] || ''
}

function CommentForm({ onSubmit, replyTo, getUserAgent, savedInfo, showGuestInfo, toggleGuestInfo }) {
  const [form, setForm] = useState({
    nickname: '',
    email: '',
    website: '',
    content: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [showSmilies, setShowSmilies] = useState(false)
  const textareaRef = useRef(null)
  const smiliesBoxRef = useRef(null)

  useEffect(() => {
    // 从savedInfo初始化表单
    if (savedInfo) {
      setForm(prev => ({
        ...prev,
        nickname: savedInfo.nickname || '',
        email: savedInfo.email || '',
        website: savedInfo.website || ''
      }))
    }
  }, [savedInfo])

  // 点击外部关闭表情框
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (smiliesBoxRef.current && !smiliesBoxRef.current.contains(e.target)) {
        setShowSmilies(false)
      }
    }
    if (showSmilies) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showSmilies])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  // 插入表情到文本框
  const insertSmilie = (code) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = ` ${code} `
    const newContent = form.content.substring(0, start) + text + form.content.substring(end)

    setForm(prev => ({ ...prev, content: newContent }))

    // 设置光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)

    setShowSmilies(false)
  }

  // 切换表情框显示
  const toggleSmilies = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setShowSmilies(!showSmilies)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.content.trim()) return

    setSubmitting(true)
    try {
      const userAgent = getUserAgent()
      const data = {
        ...form,
        userAgent
      }

      const success = await onSubmit(data)
      if (success) {
        setForm(prev => ({ ...prev, content: '' }))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      id="comment-form"
      className="comment-form"
      onSubmit={handleSubmit}
      role="form"
    >
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

      {/* 评论内容 */}
      <textarea
        id="textarea"
        name="content"
        className="form-control"
        placeholder="我来简单喵两句"
        value={form.content}
        onChange={handleChange}
        ref={textareaRef}
        required
      />

      {/* 表情选择器 */}
      <div className="smilies-wrapper" ref={smiliesBoxRef}>
        {showSmilies && (
          <div className="smilies-box">
            {SMILIES_LIST.map(code => (
              <span
                key={code}
                className="smilie-item"
                title={code}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  insertSmilie(code)
                }}
              >
                <img
                  src={getSmilieImgUrl(SMILIES_MAP[code])}
                  alt={code}
                  className="smilie-img"
                />
              </span>
            ))}
          </div>
        )}
        <span
          className="smilies-button"
          title="选择表情"
          onClick={toggleSmilies}
        >
          <img
            src={getSmilieImgUrl(SMILIES_MAP[':smile:'])}
            alt="选择表情"
            className="smilie-trigger"
          />
        </span>
      </div>

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
