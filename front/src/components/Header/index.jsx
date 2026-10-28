import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getCategoryList } from '../../api/category'
import { getPageList } from '../../api/article'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faSun, faMoon } from '@fortawesome/free-solid-svg-icons'
import Headroom from 'headroom.js'
import { resolveTheme, toggleTheme, THEME_DARK } from '../../utils/theme'
import './index.css'

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setThemeState] = useState(() => resolveTheme())
  const siteConfig = useSelector(state => state.siteConfig.data) || {}
  const [categories, setCategories] = useState([])
  const [pages, setPages] = useState([])
  const headerRef = useRef(null)
  const headroomRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    loadCategories()
    loadPages()
  }, [])

  // 主题变化时同步图标（手动切换 / 到达 19:00、06:00 自动切换）
  useEffect(() => {
    const onThemeChange = (e) => {
      setThemeState(e.detail && e.detail.theme ? e.detail.theme : resolveTheme())
    }
    document.addEventListener('themechange', onThemeChange)
    return () => document.removeEventListener('themechange', onThemeChange)
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

  const loadPages = async () => {
    try {
      const res = await getPageList()
      setPages(res.data || [])
    } catch (e) {
      console.error('加载页面列表失败', e)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 切换亮色 / 暗色主题
  const handleToggleTheme = () => {
    setThemeState(toggleTheme())
  }

  // 是否有搜索页面（只要存在 template=search 的页面就显示搜索图标）
  const hasSearchPage = pages.some(p => p.template === 'search')

  // 公开的页面（status=1）用于桌面端导航
  const publicPages = pages.filter(p => p.status === 1)

  // 站点 Logo：亮色用 siteLogo，暗色用 siteLogoDark（后台「网站基础设置」可分别配置）
  const lightLogo = siteConfig.siteLogo || '/logo.png'
  const darkLogo = siteConfig.siteLogoDark || '/logo-dark.png'

  return (
    <header className="web-header" ref={headerRef}>
      <div className="header-content">
        <Link to="/" className="logo" onClick={scrollToTop}>
          {/* 亮色 / 暗色主题分别使用对应的 Logo，由 CSS 按 data-theme 切换 */}
          <img className="logo-img logo-img-light" src={lightLogo} alt={siteConfig.siteName || 'RawChen Blog'} />
          <img className="logo-img logo-img-dark" src={darkLogo} alt={siteConfig.siteName || 'RawChen Blog'} />
        </Link>

        <div className="header-right">
          <nav className="nav">
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
            <Link
                to="/tag"
                className={location.pathname === `/tag` ? 'current' : ''}
            >
              标签
            </Link>

            {/* 动态页面导航 */}
            {publicPages.map(page => (
                <Link
                    key={page.id}
                    to={`/${page.slug}`}
                    className={location.pathname === `/${page.slug}` ? 'current' : ''}
                >
                  {page.title}
                </Link>
            ))}
          </nav>

          <div className="header-actions">
            {/* 搜索按钮 - 仅当有搜索页面时显示 */}
            {hasSearchPage && (
              <Link to="/search" className="search-toggle">
                <FontAwesomeIcon icon={faSearch} />
              </Link>
            )}
            {/* 主题切换按钮 - 亮色主题显示太阳图标，暗色主题显示月亮图标 */}
            <button
              type="button"
              className="theme-toggle"
              onClick={handleToggleTheme}
              title={theme === THEME_DARK ? '当前为暗色模式，点击切换到亮色' : '当前为亮色模式，点击切换到暗色'}
              aria-label={theme === THEME_DARK ? '当前为暗色模式，点击切换到亮色' : '当前为亮色模式，点击切换到暗色'}
            >
              <FontAwesomeIcon icon={theme === THEME_DARK ? faMoon : faSun} />
            </button>
          </div>
        </div>

        {/* 移动端右侧操作区 */}
        <div className="mobile-actions">
          {hasSearchPage && (
            <Link to="/search" className="mobile-search-toggle">
              <FontAwesomeIcon icon={faSearch} />
            </Link>
          )}
          <button
            type="button"
            className="theme-toggle mobile-theme-toggle"
            onClick={handleToggleTheme}
            title={theme === THEME_DARK ? '当前为暗色模式，点击切换到亮色' : '当前为亮色模式，点击切换到暗色'}
            aria-label={theme === THEME_DARK ? '当前为暗色模式，点击切换到亮色' : '当前为亮色模式，点击切换到暗色'}
          >
            <FontAwesomeIcon icon={theme === THEME_DARK ? faMoon : faSun} />
          </button>
          <div
            className={`navbar-mobile-menu ${mobileMenuOpen ? 'navbar-mobile-menu-on' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`icon-menu${mobileMenuOpen ? ' cross' : ''}`}>
              <span className="middle"></span>
            </span>
            <ul>
              {/*<li><Link to="/">首页</Link></li>*/}
              <li><Link to="/category">分类</Link></li>
              {publicPages.map(page => (
                <li key={page.id}>
                  <Link to={`/${page.slug}`}>{page.title}</Link>
                </li>
              ))}
              {/*<li><Link to="/admin/login">管理</Link></li>*/}
            </ul>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
