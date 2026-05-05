import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getSiteConfig } from '../../api/config'
import { getCategoryList } from '../../api/category'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faUser } from '@fortawesome/free-solid-svg-icons'
import Headroom from 'headroom.js'
import './index.css'

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [siteConfig, setSiteConfig] = useState({})
  const [categories, setCategories] = useState([])
  const headerRef = useRef(null)
  const headroomRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    loadSiteConfig()
    loadCategories()
  }, [])

  useEffect(() => {
    if (headerRef.current && !headroomRef.current) {
      headroomRef.current = new Headroom(headerRef.current, {
        tolerance: 0,
        offset: 70,
        classes: {
          initial: 'animated',
          pinned: 'slideDown',
          unpinned: 'slideUp'
        }
      })
      headroomRef.current.init()
    }
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  const loadSiteConfig = async () => {
    try {
      const res = await getSiteConfig()
      if (res.code === 200) {
        setSiteConfig(res.data || {})
      }
    } catch (e) {
      console.error('加载站点配置失败', e)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await getCategoryList()
      if (res.code === 200) {
        setCategories(res.data || [])
      }
    } catch (e) {
      console.error('加载分类失败', e)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header className="web-header" ref={headerRef}>
      <div className="header-content">
        <Link to="/" className="logo" onClick={scrollToTop}>
          <img src={siteConfig.siteLogo || 'logo.png'} alt={siteConfig.siteName || 'RawChen Blog'} />
        </Link>

        <div className="header-right">
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'current' : ''}>
              首页
            </Link>

            {/* 分类下拉菜单 */}
            <Link
                to="/category"
                className={`nav-dropdown ${location.pathname.startsWith('/category') ? 'current' : ''}`}
            >
              分类
              {categories.length > 0 && (
                  <div className="dropdown-menu">
                    {categories.map(cat => (
                        <span
                            key={cat.id}
                            className="dropdown-item"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              navigate(`/category/${cat.id}`)
                            }}
                        >
                          {cat.categoryName}
                        </span>
                    ))}
                  </div>
              )}
            </Link>

            <Link to="/tag" className={location.pathname.startsWith('/tag') ? 'current' : ''}>
              标签
            </Link>
            <Link to="/archive" className={location.pathname.startsWith('/archive') ? 'current' : ''}>
              归档
            </Link>
            <Link to="/friends" className={location.pathname === '/friends' ? 'current' : ''}>
              友链
            </Link>
          </nav>

          <div className="header-actions">
            {/* 搜索按钮 */}
            <Link to="/search" className="search-toggle">
              <FontAwesomeIcon icon={faSearch} />
            </Link>
          </div>
        </div>

        {/* 移动端右侧操作区 */}
        <div className="mobile-actions">
          <Link to="/search" className="mobile-search-toggle">
            <FontAwesomeIcon icon={faSearch} />
          </Link>
          <div
            className={`navbar-mobile-menu ${mobileMenuOpen ? 'navbar-mobile-menu-on' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`icon-menu${mobileMenuOpen ? ' cross' : ''}`}>
              <span className="middle"></span>
            </span>
            <ul>
              <li><Link to="/">首页</Link></li>
              <li><Link to="/category">分类</Link></li>
              <li><Link to="/tag">标签</Link></li>
              <li><Link to="/archive">归档</Link></li>
              <li><Link to="/friends">友链</Link></li>
              <li><Link to="/search">搜索</Link></li>
              <li><Link to="/admin/login">管理</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
