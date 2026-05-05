import React, { useState, useEffect, useRef } from 'react'
import './index.css'

function TableOfContents({ html }) {
  const [headings, setHeadings] = useState([])
  const [activeId, setActiveId] = useState('')
  const tocRef = useRef(null)

  useEffect(() => {
    if (!html) return

    // 从HTML中提取标题
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')

    const headingList = []
    headingElements.forEach((el, index) => {
      const level = parseInt(el.tagName.substring(1))
      const text = el.textContent
      const id = el.id || `heading-${index}`

      headingList.push({
        id,
        level,
        text,
        top: 0
      })
    })

    setHeadings(headingList)
  }, [html])

  useEffect(() => {
    if (headings.length === 0) return

    const handleScroll = () => {
      const headingElements = document.querySelectorAll('.article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5, .article-content h6')

      let currentActiveId = ''
      headingElements.forEach(el => {
        const rect = el.getBoundingClientRect()
        if (rect.top <= 100) {
          currentActiveId = el.id
        }
      })

      setActiveId(currentActiveId)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  const scrollToHeading = (id) => {
    const element = document.getElementById(id)
    if (element) {
      const top = element.offsetTop - 80
      window.scrollTo({
        top,
        behavior: 'smooth'
      })
    }
  }

  if (headings.length === 0) return null

  return (
    <div className="table-of-contents" ref={tocRef}>
      <h4 className="toc-title">
        <i className="fa fa-list" aria-hidden="true"></i> 目录
      </h4>
      <ul className="toc-list">
        {headings.map(heading => (
          <li
            key={heading.id}
            className={`toc-item toc-level-${heading.level} ${activeId === heading.id ? 'active' : ''}`}
          >
            <a onClick={() => scrollToHeading(heading.id)}>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TableOfContents