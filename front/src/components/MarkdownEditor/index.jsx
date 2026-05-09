import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button, Tooltip, message, Spin } from 'antd'
import {
  EditOutlined,
  EyeOutlined,
  ColumnWidthOutlined,
  PictureOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/monokai-sublime.min.css'
import { getStsToken } from '../../api/oss'
import { uploadImageLocal } from '../../api/config'
import './index.css'

// 动态导入 ali-oss
let OSS = null
const loadOSS = async () => {
  if (!OSS) {
    const module = await import('ali-oss')
    OSS = module.default
  }
  return OSS
}

/**
 * Markdown 编辑器组件
 * 支持左右分屏预览、单编辑模式切换
 * 支持点击上传图片和粘贴图片上传
 */
function MarkdownEditor({
  value = '',
  onChange,
  placeholder = '请输入Markdown内容',
  height = 500,
  disabled = false
}) {
  const [mode, setMode] = useState('split') // 'edit' | 'preview' | 'split'
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const previewRef = useRef(null)

  // 同步滚动
  const handleScroll = useCallback((e) => {
    if (mode !== 'split' || !previewRef.current) return

    const textarea = e.target
    const preview = previewRef.current
    const scrollRatio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight)
    preview.scrollTop = scrollRatio * (preview.scrollHeight - preview.clientHeight)
  }, [mode])

  // 上传文件到OSS
  const uploadToOSS = async (file, ossStyle) => {
    try {
      const OSSClient = await loadOSS()
      const res = await getStsToken()
      const stsToken = res.data  // request返回完整响应，需要访问data
      console.log('stsToken', stsToken)

      // 生成文件路径：blog/2025-04-27/randomStr.png
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      // const day = String(now.getDate()).padStart(2, '0')
      const dateFolder = `${year}/${month}`
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileExt = file.name.split('.').pop() || 'png'
      const objectKey = `${stsToken.uploadFolder || 'blog'}/${dateFolder}/${randomStr}.${fileExt}`

      const client = new OSSClient({
        region: stsToken.region,
        accessKeyId: stsToken.accessKeyId,
        accessKeySecret: stsToken.accessKeySecret,
        stsToken: stsToken.securityToken,
        bucket: stsToken.bucketName,
        secure: true
      })

      const result = await client.put(objectKey, file)

      // 返回文件URL和altText
      let url
      if (stsToken.customDomain) {
        url = `https://${stsToken.customDomain}/${objectKey}`
      } else {
        url = result.url || `https://${stsToken.bucketName}.${stsToken.endpoint}/${objectKey}`
      }
      // 拼接OSS样式
      if (ossStyle) {
        url = url + ossStyle
      }
      return { url, altText: `${randomStr}.${fileExt}` }
    } catch (error) {
      console.error('上传文件失败:', error)
      throw error
    }
  }

  // 上传文件到本地服务器
  const uploadToLocal = async (file) => {
    try {
      const res = await uploadImageLocal(file)
      // res.data 是相对路径如 /uploads/images/2025/05/09/xxx.png
      // 需要拼接当前域名
      const baseUrl = window.location.origin
      const url = baseUrl + res.data
      const fileName = res.data.split('/').pop()
      return { url, altText: fileName }
    } catch (error) {
      console.error('本地上传失败:', error)
      throw error
    }
  }

  // 获取站点配置
  const getSiteConfigCache = () => {
    try {
      const config = localStorage.getItem('site_config')
      if (config) {
        return JSON.parse(config)
      }
    } catch (e) {
      console.error('获取站点配置失败', e)
    }
    return { ossEnabled: true, ossStyle: '' }
  }

  // 插入Markdown图片语法
  const insertImage = (imageUrl, altText = 'image') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const imageMarkdown = `![${altText}](${imageUrl})`
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.substring(0, start) + imageMarkdown + value.substring(end)

    onChange?.(newValue)

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length
    }, 0)
  }

  // 处理图片上传
  const handleImageUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      message.error('只能上传图片文件')
      return
    }

    setUploading(true)
    try {
      const siteConfig = getSiteConfigCache()
      let result
      if (siteConfig.ossEnabled === true || siteConfig.ossEnabled === 'true') {
        result = await uploadToOSS(file, siteConfig.ossStyle || '')
      } else {
        result = await uploadToLocal(file)
      }
      insertImage(result.url, result.altText)
      message.success('图片上传成功')
    } catch (error) {
      message.error('图片上传失败: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // 点击上传按钮
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // 文件选择变化
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    e.target.value = '' // 重置input
  }

  // 粘贴事件处理
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await handleImageUpload(file)
        }
        break
      }
    }
  }

  // 拖拽上传
  const handleDrop = async (e) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        await handleImageUpload(file)
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // 模式切换配置
  const modeOptions = [
    { key: 'edit', icon: <EditOutlined />, label: '编辑' },
    { key: 'split', icon: <ColumnWidthOutlined />, label: '分屏' },
    { key: 'preview', icon: <EyeOutlined />, label: '预览' }
  ]

  const activeIndex = modeOptions.findIndex(opt => opt.key === mode)
  const sliderPositions = [2, 34, 66]

  return (
    <div className="md-editor-container">
      {/* 工具栏 */}
      <div className="md-editor-toolbar">
        <div className="md-editor-modes">
          <div className="mode-segment">
            <div
              className="mode-slider"
              style={{ left: `${sliderPositions[activeIndex]}px` }}
            />
            {modeOptions.map((opt) => (
              <Tooltip key={opt.key} title={opt.label + '模式'}>
                <div
                  className={`mode-item ${mode === opt.key ? 'active' : ''}`}
                  onClick={() => setMode(opt.key)}
                >
                  {opt.icon}
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
        <div className="md-editor-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Tooltip title="上传图片">
            <Button
              type="text"
              icon={uploading ? <LoadingOutlined /> : <PictureOutlined />}
              onClick={handleUploadClick}
              size="small"
              disabled={disabled || uploading}
            >
              {uploading ? '上传中...' : '图片'}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="md-editor-body" style={{ height }}>
        {mode !== 'preview' && (
          <div className={`md-editor-pane ${mode === 'split' ? 'md-editor-pane-left' : ''}`}>
            <textarea
              ref={textareaRef}
              className="md-editor-textarea"
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onScroll={handleScroll}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder={placeholder}
              disabled={disabled}
            />
          </div>
        )}
        {mode !== 'edit' && (
          <div
            ref={previewRef}
            className={`md-editor-pane md-editor-preview ${mode === 'split' ? 'md-editor-pane-right' : ''}`}
          >
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <div className="md-editor-preview-empty">预览区域</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkdownEditor
