import React, { useMemo, useEffect } from 'react'
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
import useFancybox from '../../hooks/useFancybox'
import { parseSmilies } from '../../utils/smilies'
import DPlayerComponent from '../DPlayerComponent'
import PlayerComponent from '../PlayerComponent'
import './index.css'

// 代码块组件
function CodeBlock({ className, children }) {
  const match = /language-(\w+)/.exec(className || '')
  const codeContent = String(children).replace(/\n$/, '')
  const language = match ? match[1] : 'text'

  const grammar = Prism.languages[language] || Prism.languages.markup
  const highlighted = Prism.highlight(codeContent, grammar, language)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent)
      window.showToast('代码复制成功')
    } catch (err) {
      window.showToast('代码复制失败')
    }
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-actions">
        <span className="code-block-lang">{language}</span>
        <button className="code-block-copy" onClick={handleCopy}>
          复制
        </button>
      </div>
      <pre className={className}>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  )
}

const MarkdownRenderer = React.memo(function MarkdownRenderer({ content, className = '', onTocReady }) {
  const [fancyboxRef] = useFancybox({
    Thumbs: {
      type: 'classic',
    },
  });

  // 读取HTML渲染配置
  const htmlRenderEnabled = (() => {
    try {
      const config = localStorage.getItem('site_config')
      if (config) {
        const parsed = JSON.parse(config)
        return parsed.htmlRenderEnabled === true
      }
    } catch {}
    return false
  })()

  // 预处理函数（纯函数，移到组件外部使用）
  const preprocessContent = useMemo(() => {
    if (!content) return { processed: '', tocItems: [] }

    let text = content

    // 解析短代码
    text = text.replace(/\[dplayer\s+([^\]]*)\/\]/g, (match, attrs) => {
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
    text = text.replace(/\[player\s+([^\]]*)\/\]/g, (match, attrs) => {
      const idMatch = attrs.match(/id="([^"]*)"/)
      const typeMatch = attrs.match(/type="([^"]*)"/)
      const autoplayMatch = attrs.match(/autoplay="([^"]*)"/)
      const id = idMatch ? idMatch[1] : ''
      const type = typeMatch ? typeMatch[1] : 'song'
      const autoplay = autoplayMatch ? autoplayMatch[1] : 'false'
      return `<player-data id="${id}" type="${type}" autoplay="${autoplay}"></player-data>`
    })

    // 修复标题格式
    text = text.replace(/^(#{1,6})([^\s#])/gm, '$1 $2')

    // 修复自动链接：将裸露的 URL 转换为显式链接，避免中文标点和Markdown语法被误包含
    text = text.replace(/(?<![<\[('"（])(https?:\/\/[^\s<>\[\]()（）'"`*]+?)(?=[\s<>\[\]()（）,\u3000，。！？；："'`]|$)/gi, '<$1>')

    // 修复换行
    const fixLineBreaks = (txt) => {
      const lines = txt.split('\n')
      let inCodeBlock = false
      return lines.map((line, i) => {
        if (line.startsWith('```')) {
          const isInlineBlock = line.length > 3 && line.endsWith('```') && !line.slice(3, -3).includes('```')
          if (!isInlineBlock) inCodeBlock = !inCodeBlock
          return line
        }
        if (inCodeBlock) return line
        if (i === lines.length - 1) return line
        if (line.trim() === '') return line
        if (line.startsWith('    ') || line.startsWith('\t') || line.startsWith('> ') ||
            line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ') ||
            /^\d+\. /.test(line) || line.startsWith('#') || line.includes('|')) {
          return line
        }
        return line + '  '
      }).join('\n')
    }
    text = fixLineBreaks(text)

    // 解析表情
    text = parseSmilies(text)

    // HTML渲染处理
    if (!htmlRenderEnabled) {
      let smiliePlaceholders = []
      let smilieIndex = 0
      text = text.replace(/<img class="smilies-img"[^>]*\/>/g, (match) => {
        smiliePlaceholders.push(match)
        return `SMILIE_PH_${smilieIndex++}`
      })
      let dplayerPlaceholders = []
      let dplayerIndex = 0
      text = text.replace(/<dplayer-data[^>]*><\/dplayer-data>/g, (match) => {
        dplayerPlaceholders.push(match)
        return `DPLAYER_PH_${dplayerIndex++}`
      })
      let playerPlaceholders = []
      let playerIndex = 0
      text = text.replace(/<player-data[^>]*><\/player-data>/g, (match) => {
        playerPlaceholders.push(match)
        return `PLAYER_PH_${playerIndex++}`
      })
      text = text.replace(/<\/?[a-zA-Z][^>]*>/g, (tag) => {
        return tag.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      })
      text = text.replace(/SMILIE_PH_(\d+)/g, (_, i) => smiliePlaceholders[parseInt(i)])
      text = text.replace(/DPLAYER_PH_(\d+)/g, (_, i) => dplayerPlaceholders[parseInt(i)])
      text = text.replace(/PLAYER_PH_(\d+)/g, (_, i) => playerPlaceholders[parseInt(i)])
    }

    // 计算目录并转换标题为带ID的HTML标签
    const counters = [0, 0, 0, 0, 0, 0]
    const tocItems = []
    let headingIndex = 0

    // 将标题文本中的Markdown格式转换为HTML
    const convertMarkdownToHtml = (text) => {
      return text
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    }

    // 逐行处理，排除代码块内的内容
    const lines = text.split('\n')
    let inCodeBlock = false
    const processedLines = lines.map((line) => {
      // 检测代码块边界
      if (line.startsWith('```')) {
        const isInlineBlock = line.length > 3 && line.endsWith('```') && !line.slice(3, -3).includes('```')
        if (!isInlineBlock) {
          inCodeBlock = !inCodeBlock
        }
        return line
      }
      // 代码块内不处理
      if (inCodeBlock) return line

      // 匹配标题，转换为带ID的HTML标签
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headingMatch) {
        const hashes = headingMatch[1]
        const headingText = headingMatch[2]
        const level = hashes.length
        const id = `heading-${headingIndex}`
        headingIndex++

        counters[level - 1]++
        for (let i = level; i < 6; i++) counters[i] = 0
        const number = counters.slice(0, level).filter(n => n > 0).join('.')

        // 提取纯文本用于目录（移除Markdown格式）
        const plainText = headingText.replace(/\*\*([^*]+)\*\*/g, '$1')
                                     .replace(/\*([^*]+)\*/g, '$1')
                                     .replace(/`([^`]+)`/g, '$1')
                                     .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

        tocItems.push({ level, text: plainText, id, number })

        // 转换为带ID的HTML标签，同时转换内部Markdown格式
        const htmlContent = convertMarkdownToHtml(headingText)
        return `\n<h${level} id="${id}">${htmlContent}</h${level}>\n`
      }
      return line
    })

    return { processed: processedLines.join('\n'), tocItems }
  }, [content, htmlRenderEnabled])

  const processedContent = preprocessContent.processed
  const tocItems = preprocessContent.tocItems

  // 目录数据变化时通知父组件
  useEffect(() => {
    if (onTocReady) {
      onTocReady(tocItems)
    }
  }, [tocItems, onTocReady])

  // 自定义组件
  const components = {
    // dplayer 短代码组件
    'dplayer-data': ({ url, pic, danmu, autoplay, addition }) => (
      <DPlayerComponent key={url} url={url} pic={pic} danmu={danmu} autoplay={autoplay} addition={addition} />
    ),
    // player 短代码组件
    'player-data': ({ id, type, autoplay }) => (
      <PlayerComponent key={id} id={id} type={type} autoplay={autoplay} />
    ),
    // 自定义 paragraph 组件，避免块级元素被包裹在 <p> 内
    p: ({ children, ...props }) => {
      // 检查子元素是否包含自定义块级组件
      const childArray = React.Children.toArray(children)
      const hasBlockComponent = childArray.some(child => {
        if (!child || typeof child !== 'object') return false
        const type = child.type
        // 检查是否是自定义组件（函数组件且名称包含 '-data' 或是 DPlayerComponent/PlayerComponent）
        if (typeof type === 'function') {
          const name = type.displayName || type.name || ''
          return name.includes('-data') || name === 'DPlayerComponent' || name === 'PlayerComponent'
        }
        // 检查是否是自定义元素字符串
        if (typeof type === 'string') {
          return type.includes('-data')
        }
        return false
      })
      // 如果包含块级组件，直接返回子元素
      if (hasBlockComponent) {
        return <>{children}</>
      }
      return <p {...props}>{children}</p>
    },
    // 标题组件 - 直接使用预处理生成的HTML标签（已有ID）
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
    h4: ({ children, ...props }) => <h4 {...props}>{children}</h4>,
    h5: ({ children, ...props }) => <h5 {...props}>{children}</h5>,
    h6: ({ children, ...props }) => <h6 {...props}>{children}</h6>,
    // 外链在新窗口打开
    a: ({ href, children, ...props }) => {
      const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'))
      return isExternal ? (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      ) : (
        <a href={href} {...props}>{children}</a>
      )
    },
    // 图片点击放大（使用 fancybox），表情图片不加
    img: ({ src, alt, className, ...props }) => {
      const isSmilie = className && className.includes('smilies-img')
      if (isSmilie) {
        return <img src={src} alt={alt} className={className} {...props} />
      }
      return (
        <a data-fancybox="article-gallery" style={{ display: 'contents' }} draggable="false" href={src}>
          <img src={src} alt={alt} draggable="false" {...props} />
        </a>
      )
    },
    // pre 直接返回 children，避免嵌套
    pre: ({ children }) => children,
    // 代码块
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '')
      const isInline = !match && !className

      // 内联代码
      if (isInline) {
        return <code className="inline-code" {...props}>{children}</code>
      }

      // 代码块
      return <CodeBlock className={className}>{children}</CodeBlock>
    }
  }

  if (!content) return null

  return (
    <div ref={fancyboxRef} className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
})

export default MarkdownRenderer