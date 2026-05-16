import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Tooltip, message, Dropdown, Modal } from 'antd'
import {
  EditOutlined,
  EyeOutlined,
  ColumnWidthOutlined,
  PictureOutlined,
  LoadingOutlined,
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  LinkOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  FileMarkdownOutlined,
  TableOutlined,
  CheckSquareOutlined,
  CloudUploadOutlined,
  InboxOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  BorderVerticleOutlined,
  JavaScriptOutlined,
  UpOutlined
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
  disabled = false
}) {
  const [mode, setMode] = useState('split') // 'edit' | 'preview' | 'split'
  const [uploading, setUploading] = useState(false)
  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [uploadList, setUploadList] = useState([]) // 上传列表 {file, status, url, altText}
  const [dragActive, setDragActive] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showBackTop, setShowBackTop] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const previewRef = useRef(null)

  // 在光标处插入文本
  const insertText = useCallback((before, after = '', placeholder = '') => {
    const textarea = textareaRef.current
    if (!textarea || disabled) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const textToInsert = selectedText || placeholder

    const newValue =
      value.substring(0, start) +
      before + textToInsert + after +
      value.substring(end)

    onChange?.(newValue)

    // 设置光标位置并滚动到可见区域
    setTimeout(() => {
      textarea.focus()
      let newStart, newEnd
      if (selectedText) {
        // 如果有选中文本，光标放在插入内容之后
        newStart = newEnd = start + before.length + textToInsert.length + after.length
      } else {
        // 如果没有选中文本，光标放在占位符位置（选中占位符便于替换）
        newStart = start + before.length
        newEnd = start + before.length + placeholder.length
      }
      textarea.selectionStart = newStart
      textarea.selectionEnd = newEnd

      // 滚动到光标位置，确保光标可见
      // 计算光标所在行的大致位置
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
      const linesBeforeCursor = newValue.substring(0, newStart).split('\n').length
      const scrollTarget = Math.max(0, (linesBeforeCursor - 1) * lineHeight - textarea.clientHeight / 2)
      textarea.scrollTop = scrollTarget
    }, 0)
  }, [value, onChange, disabled])

  // 插入多行文本（如代码块、列表等）
  const insertMultilineText = useCallback((text) => {
    const textarea = textareaRef.current
    if (!textarea || disabled) return

    const start = textarea.selectionStart
    const newValue =
      value.substring(0, start) +
      text +
      value.substring(textarea.selectionEnd)

    onChange?.(newValue)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + text.length
      textarea.selectionStart = textarea.selectionEnd = newCursorPos

      // 滚动到光标位置
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
      const linesBeforeCursor = newValue.substring(0, newCursorPos).split('\n').length
      const scrollTarget = Math.max(0, (linesBeforeCursor - 1) * lineHeight - textarea.clientHeight / 2)
      textarea.scrollTop = scrollTarget
    }, 0)
  }, [value, onChange, disabled])

  // 工具栏按钮配置
  const toolbarButtons = [
    {
      key: 'bold',
      icon: <BoldOutlined />,
      tooltip: '加粗 (Ctrl+B)',
      shortcut: 'b',
      action: () => insertText('**', '**', '粗体文本')
    },
    {
      key: 'italic',
      icon: <ItalicOutlined />,
      tooltip: '斜体 (Ctrl+I)',
      shortcut: 'i',
      action: () => insertText('*', '*', '斜体文本')
    },
    {
      key: 'strikethrough',
      icon: <StrikethroughOutlined />,
      tooltip: '删除线 (Ctrl+Shift+X)',
      shortcut: 'x',
      shiftKey: true,
      action: () => insertText('~~', '~~', '删除文本')
    },
    { type: 'divider' },
    {
      key: 'heading',
      icon: <FileMarkdownOutlined />,
      tooltip: '标题',
      dropdown: true
    },
    {
      key: 'quote',
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M3 21c-.55 0-1-.45-1-1v-9c0-2.21 1.79-4 4-4h.5c.28 0 .5.22.5.5v1c0 .28-.22.5-.5.5H6c-1.1 0-2 .9-2 2v1h3c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1H3zm9 0c-.55 0-1-.45-1-1v-9c0-2.21 1.79-4 4-4h.5c.28 0 .5.22.5.5v1c0 .28-.22.5-.5.5H15c-1.1 0-2 .9-2 2v1h3c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-4z"/>
        </svg>
      ),
      tooltip: '引用 (Ctrl+Shift+Q)',
      shortcut: 'q',
      shiftKey: true,
      action: () => insertText('> ', '', '引用内容')
    },
    { type: 'divider' },
    {
      key: 'link',
      icon: <LinkOutlined />,
      tooltip: '链接 (Ctrl+K)',
      shortcut: 'k',
      action: () => insertText('[', '](url)', '链接文本')
    },
    {
      key: 'image',
      icon: <PictureOutlined />,
      tooltip: '上传图片',
      action: () => {
        setImageModalVisible(true)
        setUploadList([])
        setDragActive(false)
      }
    },
    { type: 'divider' },
    {
      key: 'code',
      icon: <CodeOutlined />,
      tooltip: '行内代码 (Ctrl+`)',
      shortcut: '`',
      action: () => insertText('`', '`', 'code')
    },
    {
      key: 'codeblock',
      icon: <JavaScriptOutlined />,
      tooltip: '代码块 (Ctrl+Shift+`)',
      shortcut: '`',
      shiftKey: true,
      action: () => insertText('```javascript\n', '\n```', 'code here')
    },
    {
      key: 'table',
      icon: <TableOutlined />,
      tooltip: '表格',
      dropdown: true
    },
    { type: 'divider' },
    {
      key: 'unorderedList',
      icon: <UnorderedListOutlined />,
      tooltip: '无序列表 (Ctrl+Shift+U)',
      shortcut: 'u',
      shiftKey: true,
      action: () => insertText('- ', '', '列表项')
    },
    {
      key: 'orderedList',
      icon: <OrderedListOutlined />,
      tooltip: '有序列表 (Ctrl+Shift+O)',
      shortcut: 'o',
      shiftKey: true,
      action: () => insertText('1. ', '', '列表项')
    },
    {
      key: 'checkList',
      icon: <CheckSquareOutlined />,
      tooltip: '任务列表 (Ctrl+Shift+C)',
      shortcut: 'c',
      shiftKey: true,
      action: () => insertText('- [ ] ', '', '待办项')
    },
    { type: 'divider' },
    {
      key: 'divider',
      icon: <BorderVerticleOutlined />,
      tooltip: '分隔线 (Ctrl+Shift+-)',
      shortcut: '-',
      shiftKey: true,
      action: () => insertMultilineText('\n\n---\n\n')
    }
  ]

  // 标题下拉菜单
  const headingItems = [
    { key: 'h1', label: '一级标题', prefix: '# ' },
    { key: 'h2', label: '二级标题', prefix: '## ' },
    { key: 'h3', label: '三级标题', prefix: '### ' },
    { key: 'h4', label: '四级标题', prefix: '#### ' },
    { key: 'h5', label: '五级标题', prefix: '##### ' },
    { key: 'h6', label: '六级标题', prefix: '###### ' }
  ]

  // 表格下拉菜单
  const [tableVisible, setTableVisible] = useState(false)
  const [tableSize, setTableSize] = useState({ rows: 3, cols: 3 })
  const tableGridRef = useRef(null)

  // 生成表格markdown
  const generateTable = (rows, cols) => {
    let table = '\n'
    // 表头
    table += '| ' + Array(cols).fill('标题').join(' | ') + ' |\n'
    // 分隔符
    table += '| ' + Array(cols).fill('---').join(' | ') + ' |\n'
    // 内容行
    for (let i = 0; i < rows - 1; i++) {
      table += '| ' + Array(cols).fill('内容').join(' | ') + ' |\n'
    }
    table += '\n'
    return table
  }

  // 键盘快捷键处理
  const handleKeyDown = useCallback((e) => {
    if (disabled) return

    const isMod = e.ctrlKey || e.metaKey

    if (isMod) {
      // 查找匹配的快捷键
      const button = toolbarButtons.find(btn => {
        if (!btn.shortcut) return false
        const key = e.key.toLowerCase()
        const shortcutMatch = btn.shortcut.toLowerCase() === key
        const shiftMatch = btn.shiftKey ? e.shiftKey : !e.shiftKey
        return shortcutMatch && shiftMatch
      })

      if (button && button.action) {
        e.preventDefault()
        button.action()
        return
      }

      // Tab键插入空格
      if (e.key === 'Tab') {
        e.preventDefault()
        insertText('  ', '', '')
      }
    }

    // F11进入/退出全屏
    if (e.key === 'F11') {
      e.preventDefault()
      setFullscreen(prev => !prev)
    }

    // ESC退出全屏
    if (e.key === 'Escape') {
      setFullscreen(false)
    }
  }, [disabled, insertText])

  // 全屏切换
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
  }

  // 同步滚动
  const handleScroll = useCallback((e) => {
    const textarea = e.target
    // 显示/隐藏回到顶部按钮
    setShowBackTop(textarea.scrollTop > 200)

    if (mode !== 'split' || !previewRef.current) return

    const preview = previewRef.current
    const scrollRatio = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight)
    preview.scrollTop = scrollRatio * (preview.scrollHeight - preview.clientHeight)
  }, [mode])

  // 滚动到顶部
  const scrollToTop = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

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

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + imageMarkdown.length
      textarea.selectionStart = textarea.selectionEnd = newCursorPos

      // 滚动到光标位置
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
      const linesBeforeCursor = newValue.substring(0, newCursorPos).split('\n').length
      const scrollTarget = Math.max(0, (linesBeforeCursor - 1) * lineHeight - textarea.clientHeight / 2)
      textarea.scrollTop = scrollTarget
    }, 0)
  }

  // 处理图片上传
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        message.error(`${file.name} 不是图片文件`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploading(true)
    const siteConfig = getSiteConfigCache()

    // 添加到上传列表
    const newItems = validFiles.map(file => ({
      file,
      status: 'uploading',
      url: null,
      altText: null
    }))
    setUploadList(prev => [...prev, ...newItems])

    // 逐个上传
    const results = []
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const itemIndex = newItems[i]
      try {
        let result
        if (siteConfig.ossEnabled === true || siteConfig.ossEnabled === 'true') {
          result = await uploadToOSS(file, siteConfig.ossStyle || '')
        } else {
          result = await uploadToLocal(file)
        }
        results.push(result)
        // 更新状态
        setUploadList(prev => prev.map(item =>
          item.file === file ? { ...item, status: 'done', url: result.url, altText: result.altText } : item
        ))
      } catch (error) {
        setUploadList(prev => prev.map(item =>
          item.file === file ? { ...item, status: 'error', error: error.message } : item
        ))
      }
    }

    setUploading(false)

    // 插入所有成功的图片
    const successResults = results.filter(Boolean)
    if (successResults.length > 0) {
      successResults.forEach(result => {
        insertImage(result.url, result.altText)
      })
      message.success(`成功上传 ${successResults.length} 张图片`)
    }
  }

  // 打开图片上传弹窗
  const openImageModal = () => {
    setImageModalVisible(true)
    setUploadList([])
    setDragActive(false)
  }

  // 关闭弹窗
  const closeImageModal = () => {
    setImageModalVisible(false)
    setUploadList([])
  }

  // 弹窗内的拖拽事件
  const handleModalDragEnter = (e) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleModalDragLeave = (e) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleModalDragOver = (e) => {
    e.preventDefault()
  }

  const handleModalDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleImageUpload(files)
    }
  }

  // 弹窗内的粘贴事件
  const handleModalPaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    const files = []
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }
    if (files.length > 0) {
      handleImageUpload(files)
    }
  }

  // 文件选择变化
  const handleFileChange = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleImageUpload(files)
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

  // 表格选择器组件
  const TableSelector = () => {
    const maxSize = 6
    const [hoverSize, setHoverSize] = useState({ rows: 0, cols: 0 })

    return (
      <div className="table-selector">
        <div className="table-grid">
          {Array(maxSize).fill(0).map((_, row) => (
            <div key={row} className="table-grid-row">
              {Array(maxSize).fill(0).map((_, col) => (
                <div
                  key={col}
                  className={`table-cell ${
                    row < hoverSize.rows && col < hoverSize.cols ? 'active' : ''
                  }`}
                  onMouseEnter={() => setHoverSize({ rows: row + 1, cols: col + 1 })}
                  onClick={() => {
                    insertMultilineText(generateTable(row + 1, col + 1))
                    setTableVisible(false)
                  }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="table-size-label">
          {hoverSize.rows > 0 ? `${hoverSize.rows} × ${hoverSize.cols}` : '选择表格大小'}
        </div>
      </div>
    )
  }

  return (
    <div className={`md-editor-container ${fullscreen ? 'fullscreen' : ''}`}>
      {/* 工具栏 */}
      <div className="md-editor-toolbar">
        {/* 左侧工具按钮 */}
        <div className="md-editor-tools">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {toolbarButtons.map((btn) => {
            if (btn.type === 'divider') {
              return <div key={`divider-${Math.random()}`} className="toolbar-divider" />
            }

            // 标题下拉
            if (btn.key === 'heading') {
              return (
                <Dropdown
                  key={btn.key}
                  menu={{
                    items: headingItems.map(item => ({
                      key: item.key,
                      label: item.label,
                      onClick: () => insertText(item.prefix, '', '标题')
                    }))
                  }}
                  trigger={['click']}
                >
                  <Tooltip title={btn.tooltip}>
                    <div className="toolbar-btn">
                      {btn.icon}
                    </div>
                  </Tooltip>
                </Dropdown>
              )
            }

            // 表格下拉
            if (btn.key === 'table') {
              return (
                <Dropdown
                  key={btn.key}
                  dropdownRender={() => <TableSelector />}
                  trigger={['click']}
                  open={tableVisible}
                  onOpenChange={setTableVisible}
                >
                  <Tooltip title={btn.tooltip}>
                    <div className="toolbar-btn">
                      {btn.icon}
                    </div>
                  </Tooltip>
                </Dropdown>
              )
            }

            // 图片按钮（带loading状态）
            if (btn.key === 'image') {
              return (
                <Tooltip key={btn.key} title={btn.tooltip}>
                  <div
                    className={`toolbar-btn`}
                    onClick={() => btn.action()}
                  >
                    {uploading ? <LoadingOutlined /> : btn.icon}
                  </div>
                </Tooltip>
              )
            }

            // 普通按钮
            return (
              <Tooltip key={btn.key} title={btn.tooltip}>
                <div
                  className={`toolbar-btn ${disabled ? 'disabled' : ''}`}
                  onClick={() => !disabled && btn.action()}
                >
                  {btn.icon}
                </div>
              </Tooltip>
            )
          })}
        </div>

        {/* 右侧模式切换 + 全屏按钮 */}
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
          <Tooltip title={fullscreen ? '退出全屏 (Esc)' : '全屏 (F11)'}>
            <div className="toolbar-btn fullscreen-btn" onClick={toggleFullscreen}>
              {fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            </div>
          </Tooltip>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="md-editor-body">
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
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
            />
            {showBackTop && (
              <Tooltip title="回到顶部">
                <div className="md-editor-back-top" onClick={scrollToTop}>
                  <UpOutlined />
                </div>
              </Tooltip>
            )}
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

      {/* 图片上传弹窗 */}
      <Modal
        title="上传图片"
        open={imageModalVisible}
        onCancel={closeImageModal}
        footer={null}
        width={520}
        className="image-upload-modal"
      >
        <div
          className={`image-upload-dropzone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleModalDragEnter}
          onDragLeave={handleModalDragLeave}
          onDragOver={handleModalDragOver}
          onDrop={handleModalDrop}
          onPaste={handleModalPaste}
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <InboxOutlined className="upload-icon" />
          <p className="upload-text">拖拽图片到此处，或点击上传</p>
          <p className="upload-hint">支持多张图片上传，也可直接粘贴剪贴板图片</p>
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUploadOutlined /> 选择图片
          </button>
        </div>

        {/* 上传列表 */}
        {uploadList.length > 0 && (
          <div className="upload-list">
            {uploadList.map((item, index) => (
              <div key={index} className={`upload-item ${item.status}`}>
                <div className="upload-item-info">
                  <span className="upload-item-name">{item.file.name}</span>
                  {item.status === 'uploading' && <LoadingOutlined spin />}
                  {item.status === 'done' && <span className="upload-item-success">✓</span>}
                  {item.status === 'error' && <span className="upload-item-error">✗</span>}
                </div>
                {item.status === 'error' && item.error && (
                  <div className="upload-item-error-msg">{item.error}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MarkdownEditor
