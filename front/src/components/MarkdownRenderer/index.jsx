import React, { useMemo } from 'react'
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

function MarkdownRenderer({ content, className = '' }) {
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

  // 生成目录数据
  const tocItems = useMemo(() => {
    if (!content) return []
    const headings = content.match(/^#{1,6}\s+.+$/gm) || []
    return headings.map((heading, index) => {
      const level = heading.match(/^#+/)[0].length
      const text = heading.replace(/^#+\s+/, '')
      const id = `heading-${index}`
      return { level, text, id }
    })
  }, [content])

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
    // 为标题添加ID
    h1: ({ children, ...props }) => {
      const id = `heading-${tocItems.findIndex(t => t.text === children[0])}`
      return <h1 id={id} {...props}>{children}</h1>
    },
    h2: ({ children, ...props }) => {
      const id = `heading-${tocItems.findIndex(t => t.text === children[0])}`
      return <h2 id={id} {...props}>{children}</h2>
    },
    h3: ({ children, ...props }) => {
      const id = `heading-${tocItems.findIndex(t => t.text === children[0])}`
      return <h3 id={id} {...props}>{children}</h3>
    },
    h4: ({ children, ...props }) => {
      const id = `heading-${tocItems.findIndex(t => t.text === children[0])}`
      return <h4 id={id} {...props}>{children}</h4>
    },
    h5: ({ children, ...props }) => {
      const id = `heading-${tocItems.findIndex(t => t.text === children[0])}`
      return <h5 id={id} {...props}>{children}</h5>
    },
    h6: ({ children, ...props }) => {
      const id = `heading-${tocItems.findIndex(t => t.text === children[0])}`
      return <h6 id={id} {...props}>{children}</h6>
    },
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

  // 预处理：修复 # 后无空格的标题（兼容Typecho等宽松解析器）
  const fixMarkdownHeaders = (text) => {
    return text.replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
  }

  // 预处理：解析 dplayer 短代码，转换为 HTML 占位符
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

  // 预处理：解析 player 短代码，转换为 HTML 占位符
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

  // 预处理：将单个换行符转换为Markdown硬换行（两个空格+换行）
  // 兼容Typecho等宽松解析器的换行行为
  const fixLineBreaks = (text) => {
    const lines = text.split('\n')
    let inCodeBlock = false
    return lines.map((line, i) => {
      // 检测代码块开始/结束
      if (line.startsWith('```')) {
        // 单行代码块如 ```code``` 不切换状态
        const isInlineBlock = line.length > 3 && line.endsWith('```') && !line.slice(3, -3).includes('```')
        if (!isInlineBlock) {
          inCodeBlock = !inCodeBlock
        }
        return line
      }
      // 代码块内部不处理
      if (inCodeBlock) return line
      // 最后一行不加
      if (i === lines.length - 1) return line
      // 空行不加（段落分隔）
      if (line.trim() === '') return line
      // 缩进代码块、引用、列表、标题、表格等特殊内容不加
      if (line.startsWith('    ') ||
          line.startsWith('\t') ||
          line.startsWith('> ') ||
          line.startsWith('- ') ||
          line.startsWith('* ') ||
          line.startsWith('+ ') ||
          /^\d+\. /.test(line) ||
          line.startsWith('#') ||
          line.includes('|')) {
        return line
      }
      // 普通文本行，添加两个空格实现硬换行
      return line + '  '
    }).join('\n')
  }

  // 先解析短代码，再修复标题格式，再修复换行，最后解析表情代码
  let processedContent = parseSmilies(fixLineBreaks(fixMarkdownHeaders(parsePlayerShortcode(parseDPlayerShortcode(content)))))

  // 如果HTML渲染关闭，保护表情标签和dplayer标签，转义其他HTML标签，再恢复表情标签
  if (!htmlRenderEnabled) {
    let smiliePlaceholders = []
    let index = 0
    // 用占位符替换表情img标签
    processedContent = processedContent.replace(/<img class="smilies-img"[^>]*\/>/g, (match) => {
      smiliePlaceholders.push(match)
      return `SMILIE_PH_${index++}`
    })
    // 用占位符替换dplayer标签
    let dplayerPlaceholders = []
    let dplayerIndex = 0
    processedContent = processedContent.replace(/<dplayer-data[^>]*><\/dplayer-data>/g, (match) => {
      dplayerPlaceholders.push(match)
      return `DPLAYER_PH_${dplayerIndex++}`
    })
    // 用占位符替换player标签
    let playerPlaceholders = []
    let playerIndex = 0
    processedContent = processedContent.replace(/<player-data[^>]*><\/player-data>/g, (match) => {
      playerPlaceholders.push(match)
      return `PLAYER_PH_${playerIndex++}`
    })
    // 转义剩余HTML标签（仅匹配 <tag> 形式，不影响 Markdown 引用 >）
    processedContent = processedContent.replace(/<\/?[a-zA-Z][^>]*>/g, (tag) => {
      return tag.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    })
    // 恢复表情标签
    processedContent = processedContent.replace(/SMILIE_PH_(\d+)/g, (_, i) => smiliePlaceholders[parseInt(i)])
    // 恢复dplayer标签
    processedContent = processedContent.replace(/DPLAYER_PH_(\d+)/g, (_, i) => dplayerPlaceholders[parseInt(i)])
    // 恢复player标签
    processedContent = processedContent.replace(/PLAYER_PH_(\d+)/g, (_, i) => playerPlaceholders[parseInt(i)])
  }

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
}

export default MarkdownRenderer