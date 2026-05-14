import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'

// 前台页面
import WebLayout from './layouts/WebLayout'
import Home from './pages/Home'
import ArticleDetail from './pages/Article'
import CategoryPage from './pages/Category'
import TagPage from './pages/Tag'
import Archive from './pages/Archive'
import SearchPage from './pages/Search'
import TimelinePage from './pages/Timeline'
import MomentsPage from './pages/Moments'
import FriendsPage from './pages/Friends'
import NotFoundPage from './pages/NotFound'
import PageDetail from './pages/Page'

// 后台页面
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import ArticleList from './pages/admin/article/List'
import ArticleEdit from './pages/admin/article/Edit'
import CategoryList from './pages/admin/Category'
import TagList from './pages/admin/Tag'
import CommentList from './pages/admin/Comment'
import UserList from './pages/admin/User'
import FriendLinkList from './pages/admin/FriendLink'
import Setting from './pages/admin/Setting'
import Tool from './pages/admin/Tool'
import PageList from './pages/admin/Page'

// API
import { getPageList } from './api/article'

// 路由守卫
function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector(state => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

// 动态路由组件：判断是文章ID还是页面slug
function DynamicRoute() {
  const { slug } = useParams()
  const [loading, setLoading] = useState(true)
  const [pageData, setPageData] = useState(null)
  const [isPage, setIsPage] = useState(false)

  useEffect(() => {
    // 如果是纯数字，说明是文章ID，不需要判断
    if (/^\d+$/.test(slug)) {
      setIsPage(false)
      setLoading(false)
      return
    }

    // 非数字，尝试获取独立页面
    const fetchPage = async () => {
      try {
        const res = await import('./api/article').then(api => api.getPageBySlug(slug))
        if (res.data) {
          setPageData(res.data)
          setIsPage(true)
        }
      } catch (e) {
        // 不是独立页面，会404
      } finally {
        setLoading(false)
      }
    }
    fetchPage()
  }, [slug])

  if (loading) return <div className="loading">加载中...</div>

  // 数字ID返回文章详情
  if (!isPage) {
    return <ArticleDetail />
  }

  // 独立页面
  return <PageDetail page={pageData} />
}

function App() {
  return (
    <Routes>
      {/* 前台路由 */}
      <Route path="/" element={<WebLayout />}>
        <Route index element={<Home />} />
        <Route path="page/:page" element={<Home />} />
        <Route path="category" element={<CategoryPage />} />
        <Route path="category/:id" element={<CategoryPage />} />
        <Route path="tag" element={<TagPage />} />
        <Route path="tag/:id" element={<TagPage />} />
        <Route path="archive" element={<Archive />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="timeline" element={<TimelinePage />} />
        {/* 动态路由：文章ID或页面slug */}
        <Route path=":slug" element={<DynamicRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 后台路由 */}
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="article/list" element={<ArticleList />} />
        <Route path="article/add" element={<ArticleEdit />} />
        <Route path="article/edit/:id" element={<ArticleEdit />} />
        <Route path="page" element={<PageList />} />
        <Route path="category" element={<CategoryList />} />
        <Route path="tag" element={<TagList />} />
        <Route path="comment" element={<CommentList />} />
        <Route path="friend-link" element={<FriendLinkList />} />
        <Route path="user" element={<UserList />} />
        <Route path="setting" element={<Setting />} />
        <Route path="tool" element={<Tool />} />
      </Route>
    </Routes>
  )
}

export default App