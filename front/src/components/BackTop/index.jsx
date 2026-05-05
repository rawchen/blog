import React, { useState, useEffect } from 'react'
import './index.css'
import arrowIcon from '../../assets/icons/cd-top-arrow.svg'

function BackTop({ visibilityHeight = 300 }) {
  const [visible, setVisible] = useState(false)
  const [fadeout, setFadeout] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      if (scrollTop > visibilityHeight) {
        setVisible(true)
        setFadeout(scrollTop > visibilityHeight * 3)
      } else {
        setVisible(false)
        setFadeout(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [visibilityHeight])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!visible) return null

  return (
    <div
      className={`cd-top cd-is-visible ${fadeout ? 'cd-fade-out' : ''}`}
      onClick={scrollToTop}
      title="返回顶部"
    >
      <img src={arrowIcon} alt="返回顶部" className="cd-top-arrow" />
    </div>
  )
}

export default BackTop
