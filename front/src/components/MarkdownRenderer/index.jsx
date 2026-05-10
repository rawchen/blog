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
    <pre className={className}>
      <div className="code-block-actions">
        <span className="code-block-lang">{language}</span>
        <button className="code-block-copy" onClick={handleCopy}>
          复制
        </button>
      </div>
      <code dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  )
}

function MarkdownRenderer({ content, className = '' }) {
  const [fancyboxRef] = useFancybox({
    Thumbs: {
      type: 'classic',
    },
  });

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
    // 图片点击放大（使用 fancybox）
    img: ({ src, alt, ...props }) => (
      <a data-fancybox="article-gallery" draggable="false" href={src}>
        <img src={src} alt={alt} draggable="false" {...props} />
      </a>
    ),
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
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer