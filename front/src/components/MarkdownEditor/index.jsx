import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Tooltip, message, Dropdown, Modal, Input, Switch, Radio, Tabs, Spin } from 'antd'
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
  UpOutlined,
  VideoCameraOutlined, FontSizeOutlined, SmileOutlined, CustomerServiceOutlined
} from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import Prism from 'prismjs'
import 'prismjs/themes/prism-okaidia.css'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-markup'
import { getStsToken } from '../../api/oss'
import { uploadImageLocal } from '../../api/config'
import DPlayerComponent from '../DPlayerComponent'
import { SMILIES_LIST, SMILIES_MAP, parseSmilies } from '../../utils/smilies'
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
  const [videoModalVisible, setVideoModalVisible] = useState(false)
  const [videoParams, setVideoParams] = useState({
    url: '',
    pic: '',
    addition: '',
    danmu: true,
    autoplay: false
  })
  const [musicModalVisible, setMusicModalVisible] = useState(false)
  const [musicParams, setMusicParams] = useState({
    id: '',
    type: 'song',
    autoplay: false
  })
  const [musicSearchKeyword, setMusicSearchKeyword] = useState('')
  const [musicSearchResults, setMusicSearchResults] = useState([])
  const [musicSearching, setMusicSearching] = useState(false)
  const [showSmilies, setShowSmilies] = useState(false)
  const [uploadList, setUploadList] = useState([]) // 上传列表 {file, status, url, altText}
  const [previewValue, setPreviewValue] = useState(value) // 防抖后的预览内容
  const previewTimerRef = useRef(null)

  // 防抖更新预览内容（300ms 延迟）
  useEffect(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current)
    }
    previewTimerRef.current = setTimeout(() => {
      setPreviewValue(value)
    }, 300)
    return () => {
      if (previewTimerRef.current) {
        clearTimeout(previewTimerRef.current)
      }
    }
  }, [value])

  // 插入表情
  const insertSmilie = (code) => {
    insertText(`${code}`, '', '')
    setShowSmilies(false)
  }
  const [dragActive, setDragActive] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showBackTop, setShowBackTop] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const previewRef = useRef(null)

  // 在光标处插入文本（支持 undo）
  const insertText = useCallback((before, after = '', placeholder = '') => {
    const textarea = textareaRef.current
    if (!textarea || disabled) return

    textarea.focus()

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const textToInsert = selectedText || placeholder
    const fullText = before + textToInsert + after

    // 使用 execCommand 插入文本，支持 undo
    const success = document.execCommand('insertText', false, fullText)

    if (!success) {
      // 降级方案：直接修改 value（不支持 undo）
      const newValue = value.substring(0, start) + fullText + value.substring(end)
      onChange?.(newValue)
    }

    // 设置光标位置并滚动到可见区域
    requestAnimationFrame(() => {
      let newStart, newEnd
      if (selectedText) {
        newStart = newEnd = start + fullText.length
      } else {
        newStart = start + before.length
        newEnd = start + before.length + placeholder.length
      }
      textarea.selectionStart = newStart
      textarea.selectionEnd = newEnd

      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
      const linesBeforeCursor = (value.substring(0, newStart) + fullText).split('\n').length
      const scrollTarget = Math.max(0, (linesBeforeCursor - 1) * lineHeight - textarea.clientHeight / 2)
      textarea.scrollTop = scrollTarget
    })
  }, [value, disabled])

  // 插入多行文本（如代码块、列表等，支持 undo）
  const insertMultilineText = useCallback((text) => {
    const textarea = textareaRef.current
    if (!textarea || disabled) return

    textarea.focus()

    // 使用 execCommand 插入文本，支持 undo
    const success = document.execCommand('insertText', false, text)

    if (!success) {
      const start = textarea.selectionStart
      const newValue = value.substring(0, start) + text + value.substring(textarea.selectionEnd)
      onChange?.(newValue)
    }

    requestAnimationFrame(() => {
      const newCursorPos = textarea.selectionStart
      textarea.selectionStart = textarea.selectionEnd = newCursorPos

      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
      const linesBeforeCursor = textarea.value.substring(0, newCursorPos).split('\n').length
      const scrollTarget = Math.max(0, (linesBeforeCursor - 1) * lineHeight - textarea.clientHeight / 2)
      textarea.scrollTop = scrollTarget
    })
  }, [value, disabled])

  // 解析 dplayer 短代码
  const parseDPlayerShortcode = (text) => {
    return text.replace(/\[dplayer\s+([^\]]*)\/\]/g, (match, attrs) => {
      const urlMatch = attrs.match(/url="([^"]*)"/)
      const picMatch = attrs.match(/pic="([^"]*)"/)
      const danmuMatch = attrs.match(/danmu="([^"]*)"/)
      const autoplayMatch = attrs.match(/autoplay="([^"]*)"/)
      const additionMatch = attrs.match(/addition="([^"]*)"/)

      const url = urlMatch ? urlMatch[1] : ''
      const pic = picMatch ? picMatch[1] : ''
      const danmu = danmuMatch ? danmuMatch[1] : 'true'
      const autoplay = autoplayMatch ? autoplayMatch[1] : 'false'
      const addition = additionMatch ? additionMatch[1] : ''

      return `<dplayer-data url="${url}" pic="${pic}" danmu="${danmu}" autoplay="${autoplay}" addition="${addition}"></dplayer-data>`
    })
  }

  // 解析 player 短代码
  const parsePlayerShortcode = (text) => {
    return text.replace(/\[player\s+([^\]]*)\/\]/g, (match, attrs) => {
      const idMatch = attrs.match(/id="([^"]*)"/)
      const typeMatch = attrs.match(/type="([^"]*)"/)
      const autoplayMatch = attrs.match(/autoplay="([^"]*)"/)

      const id = idMatch ? idMatch[1] : ''
      const type = typeMatch ? typeMatch[1] : 'song'
      const autoplay = autoplayMatch ? autoplayMatch[1] : 'false'

      return `<player-data id="${id}" type="${type}" autoplay="${autoplay}"></player-data>`
    })
  }

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
      icon: <FontSizeOutlined />,
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
    {
      key: 'divider',
      icon: <BorderVerticleOutlined />,
      tooltip: '分隔线 (Ctrl+Shift+-)',
      shortcut: '-',
      shiftKey: true,
      action: () => insertMultilineText('\n\n---\n\n')
    },
    { type: 'divider' },
    {
      key: 'music',
      icon: <CustomerServiceOutlined />,
      tooltip: '插入音乐',
      action: () => {
        setMusicParams({ id: '', type: 'song', autoplay: false })
        setMusicSearchKeyword('')
        setMusicSearchResults([])
        setMusicModalVisible(true)
      }
    },
    {
      key: 'video',
      icon: <VideoCameraOutlined />,
      tooltip: '插入视频',
      action: () => {
        setVideoParams({ url: '', pic: '', addition: '', danmu: true, autoplay: false })
        setVideoModalVisible(true)
      }
    },
    {
      key: 'smilies',
      icon: <SmileOutlined />,
      tooltip: '插入表情',
      dropdown: true,
      smilies: true
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

  // 搜索网易云音乐
  const searchNetEaseMusic = useCallback(async (keyword) => {
    if (!keyword || !keyword.trim()) {
      message.warning('请输入搜索关键词')
      return
    }
    setMusicSearching(true)
    setMusicSearchResults([])
    try {
      // 使用公开的网易云音乐API
      const response = await fetch(`https://api.injahow.cn/meting/?type=name&id=${encodeURIComponent(keyword)}`)
      const data = await response.json()
      if (data && Array.isArray(data)) {
        setMusicSearchResults(data.slice(0, 20)) // 限制显示20条
      } else {
        message.info('未找到相关音乐')
      }
    } catch (error) {
      console.error('搜索失败:', error)
      message.error('搜索失败，请稍后重试')
    } finally {
      setMusicSearching(false)
    }
  }, [])

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

    textarea.focus()

    const imageMarkdown = `![${altText}](${imageUrl})`

    // 使用 execCommand 插入文本，支持 undo
    const success = document.execCommand('insertText', false, imageMarkdown)

    if (!success) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.substring(0, start) + imageMarkdown + value.substring(end)
      onChange?.(newValue)
    }

    requestAnimationFrame(() => {
      const newCursorPos = textarea.selectionStart
      textarea.selectionStart = textarea.selectionEnd = newCursorPos

      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
      const linesBeforeCursor = textarea.value.substring(0, newCursorPos).split('\n').length
      const scrollTarget = Math.max(0, (linesBeforeCursor - 1) * lineHeight - textarea.clientHeight / 2)
      textarea.scrollTop = scrollTarget
    })
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

            // 表情按钮
            if (btn.key === 'smilies') {
              return (
                <Dropdown
                  key={btn.key}
                  dropdownRender={() => (
                    <div className="smilies-dropdown">
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
                            src={`/smilies/bilibili/${SMILIES_MAP[code]}`}
                            alt={code}
                            className="smilie-img"
                          />
                        </span>
                      ))}
                    </div>
                  )}
                  trigger={['click']}
                  open={showSmilies}
                  onOpenChange={setShowSmilies}
                >
                  <Tooltip title={btn.tooltip}>
                    <div className="toolbar-btn">
                      {btn.icon}
                    </div>
                  </Tooltip>
                </Dropdown>
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
                rehypePlugins={[rehypeRaw]}
                components={{
                  'dplayer-data': ({ url, pic }) => (
                    <div className="dplayer-placeholder" style={{
                      margin: '16px 0',
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: '#000',
                      position: 'relative',
                      paddingBottom: '56.25%',
                    }}>
                      {pic ? (
                        <img src={pic} alt="视频封面" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                      ) : null}
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        width: 48, height: 48, background: 'rgba(255,255,255,0.8)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <VideoCameraOutlined style={{ fontSize: 24, color: '#333', marginLeft: 3 }} />
                      </div>
                    </div>
                  ),
                  'player-data': ({ id, type }) => (
                    <div className="player-placeholder" style={{
                      margin: '16px 0',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}>
                      <div style={{
                        width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <CustomerServiceOutlined style={{ fontSize: 24, color: '#fff' }} />
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>
                          {type === 'collect' ? '歌单' : '单曲'}播放器
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>ID: {id}</div>
                      </div>
                    </div>
                  ),
                  pre: ({ children }) => children,
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    const isInline = !match && !className
                    if (isInline) {
                      return <code className="inline-code" {...props}>{children}</code>
                    }
                    const codeContent = String(children).replace(/\n$/, '')
                    const language = match ? match[1] : 'text'
                    const grammar = Prism.languages[language] || Prism.languages.markup
                    const highlighted = Prism.highlight(codeContent, grammar, language)
                    return (
                      <pre className={className}>
                        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
                      </pre>
                    )
                  }
                }}
              >
                {parseSmilies(parsePlayerShortcode(parseDPlayerShortcode(value)))}
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

      {/* 视频插入弹窗 */}
      <Modal
        title="插入视频"
        open={videoModalVisible}
        onCancel={() => setVideoModalVisible(false)}
        onOk={() => {
          if (!videoParams.url) {
            message.warning('请输入视频链接')
            return
          }
          const shortcode = `[dplayer url="${videoParams.url}" pic="${videoParams.pic}" autoplay="${videoParams.autoplay}" danmu="${videoParams.danmu}" addition="${videoParams.addition}" /]`
          insertMultilineText(shortcode)
          setVideoModalVisible(false)
        }}
        okText="确定"
        cancelText="取消"
        width={480}
      >
        {/*<p style={{ color: '#8c8c8c', marginBottom: 16 }}>在下方输入参数</p>*/}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>视频链接</label>
          <Input
            placeholder="https://example.com/video.mp4"
            value={videoParams.url}
            onChange={(e) => setVideoParams(prev => ({ ...prev, url: e.target.value }))}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>封面图</label>
          <Input
            placeholder="https://example.com/cover.jpg"
            value={videoParams.pic}
            onChange={(e) => setVideoParams(prev => ({ ...prev, pic: e.target.value }))}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>额外弹幕源</label>
          <Input
            placeholder="https://example.com/danmu.json"
            value={videoParams.addition}
            onChange={(e) => setVideoParams(prev => ({ ...prev, addition: e.target.value }))}
          />
        </div>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontWeight: 500 }}>开启弹幕</label>
              <Switch
                checked={videoParams.danmu}
                onChange={(checked) => setVideoParams(prev => ({ ...prev, danmu: checked }))}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontWeight: 500 }}>自动播放</label>
              <Switch
                checked={videoParams.autoplay}
                onChange={(checked) => setVideoParams(prev => ({ ...prev, autoplay: checked }))}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* 音乐插入弹窗 */}
      <Modal
        title="插入音乐"
        open={musicModalVisible}
        onCancel={() => setMusicModalVisible(false)}
        onOk={() => {
          if (!musicParams.id) {
            message.warning('请输入音乐ID或从搜索结果中选择')
            return
          }
          let shortcode
          if (musicParams.type === 'collect') {
            shortcode = `[player id="${musicParams.id}" type="collect" autoplay="${musicParams.autoplay}" /]`
          } else {
            shortcode = `[player id="${musicParams.id}" autoplay="${musicParams.autoplay}" /]`
          }
          insertMultilineText(shortcode)
          setMusicModalVisible(false)
        }}
        okText="插入"
        cancelText="取消"
        width={560}
      >
        <Tabs
          defaultActiveKey="search"
          items={[
            {
              key: 'search',
              label: '搜索音乐',
              children: (
                <div>
                  <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                    <Input
                      placeholder="输入歌曲名称、歌手或歌单名称..."
                      value={musicSearchKeyword}
                      onChange={(e) => setMusicSearchKeyword(e.target.value)}
                      onPressEnter={() => searchNetEaseMusic(musicSearchKeyword)}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="music-search-btn"
                      onClick={() => searchNetEaseMusic(musicSearchKeyword)}
                      disabled={musicSearching}
                    >
                      {musicSearching ? <Spin size="small" /> : '搜索'}
                    </button>
                  </div>
                  {musicSearchResults.length > 0 && (
                    <div className="music-search-results">
                      {musicSearchResults.map((item, index) => (
                        <div
                          key={index}
                          className={`music-result-item ${musicParams.id === item.id ? 'selected' : ''}`}
                          onClick={() => {
                            setMusicParams(prev => ({
                              ...prev,
                              id: item.id,
                              type: item.type === 'playlist' ? 'collect' : 'song'
                            }))
                          }}
                        >
                          <img src={item.pic} alt="" className="music-result-cover" />
                          <div className="music-result-info">
                            <div className="music-result-title">{item.name}</div>
                            <div className="music-result-artist">{item.artist}</div>
                          </div>
                          <div className="music-result-type-tag">
                            {item.type === 'playlist' ? '歌单' : '歌曲'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {musicSearching && musicSearchResults.length === 0 && (
                    <div className="music-search-loading">
                      <Spin />
                      <span>正在搜索...</span>
                    </div>
                  )}
                  {!musicSearching && musicSearchResults.length === 0 && (
                    <div className="music-search-empty">
                      输入关键词搜索网易云音乐
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'manual',
              label: '手动输入ID',
              children: (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>类型</label>
                    <Radio.Group
                      value={musicParams.type}
                      onChange={(e) => setMusicParams(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <Radio value="song">单曲</Radio>
                      <Radio value="collect">歌单</Radio>
                    </Radio.Group>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                      网易云音乐ID
                    </label>
                    <Input
                      placeholder={musicParams.type === 'collect' ? '输入歌单ID，如：471071972' : '输入歌曲ID，如：38592976'}
                      value={musicParams.id}
                      onChange={(e) => setMusicParams(prev => ({ ...prev, id: e.target.value }))}
                    />
                    <p style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>
                      从网易云音乐网页版获取ID，例如歌曲链接 https://music.163.com/#/song?id=38592976 中的 38592976
                    </p>
                  </div>
                </div>
              )
            }
          ]}
        />
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontWeight: 500 }}>自动播放</label>
          <Switch
            checked={musicParams.autoplay}
            onChange={(checked) => setMusicParams(prev => ({ ...prev, autoplay: checked }))}
          />
        </div>
      </Modal>
    </div>
  )
}

export default MarkdownEditor
