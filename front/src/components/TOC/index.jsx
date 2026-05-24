import React, { useState, useEffect, useRef, useCallback } from 'react'

function TOC({ items }) {
  const [activeId, setActiveId] = useState(null)

  // 点击跳转到锚点
  const handleClick = useCallback((e, id) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      history.pushState(null, null, `#${id}`)
      setActiveId(id)
    }
  }, [])

  // 滚动时高亮当前阅读的标题
  useEffect(() => {
    if (!items || items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0
      }
    )

    items.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [items])

  if (!items || items.length === 0) return null

  // 将扁平列表转换为嵌套结构
  const buildNestedStructure = (items) => {
    const result = []
    const stack = [{ level: 0, children: result }]

    items.forEach(item => {
      const node = { ...item, children: [] }

      // 找到合适的父级
      while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
        stack.pop()
      }

      // 添加到父级的children
      stack[stack.length - 1].children.push(node)
      stack.push(node)
    })

    return result
  }

  // 渲染嵌套结构
  const renderItems = (items) => {
    return (
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              title={item.text}
              className={activeId === item.id ? 'active' : ''}
            >
              {item.number} {item.text}
            </a>
            {item.children && item.children.length > 0 && renderItems(item.children)}
          </li>
        ))}
      </ul>
    )
  }

  const nestedItems = buildNestedStructure(items)

  return renderItems(nestedItems)
}

export default TOC
