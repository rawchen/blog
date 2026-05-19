import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'

// 前台页面
import WebLayout from './layouts/WebLayout'
import Home from './pages/Home'
import CategoryPage from './pages/Category'
import TagPage from './pages/Tag'
import Archive from './pages/Archive'
import SearchPage from './pages/Search'
import TimelinePage from './pages/Timeline'
import MomentsPage from './pages/Moments'
import NotFoundPage from './pages/NotFound'

// 前台页面 - 懒加载（只在访问时才加载 markdown 等重型依赖）
const ArticleDetail = lazy(() => import('./pages/Article'))
const FriendsPage = lazy(() => import('./pages/Friends'))
const PageDetail = lazy(() => import('./pages/Page'))

// 后台页面 - 懒加载，访客不会加载
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const Login = lazy(() => import('./pages/admin/Login'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const ArticleList = lazy(() => import('./pages/admin/article/List'))
const ArticleEdit = lazy(() => import('./pages/admin/article/Edit'))
const CategoryList = lazy(() => import('./pages/admin/Category'))
const TagList = lazy(() => import('./pages/admin/Tag'))
const CommentList = lazy(() => import('./pages/admin/Comment'))
const UserList = lazy(() => import('./pages/admin/User'))
const FriendLinkList = lazy(() => import('./pages/admin/FriendLink'))
const Setting = lazy(() => import('./pages/admin/Setting'))
const Tool = lazy(() => import('./pages/admin/Tool'))
const PageList = lazy(() => import('./pages/admin/Page'))
const LoginLog = lazy(() => import('./pages/admin/log/LoginLog'))
const OperationLog = lazy(() => import('./pages/admin/log/OperationLog'))
const AccessLog = lazy(() => import('./pages/admin/log/AccessLog'))

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
  const [isPage, setIsPage] = useState(null) // null=未知, true=页面, false=文章

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
        } else {
          setIsPage(false) // 有响应但无数据，当作文章处理（会404）
        }
      } catch (e) {
        setIsPage(false) // 请求失败，当作文章处理（会404）
      } finally {
        setLoading(false)
      }
    }
    fetchPage()
  }, [slug])

  if (loading) return <div className="loading">加载中...</div>

  // 独立页面
  if (isPage === true) {
    return (
      <Suspense fallback={null}>
        <PageDetail page={pageData} />
      </Suspense>
    )
  }

  // 数字ID返回文章详情
  return (
    <Suspense fallback={null}>
      <ArticleDetail />
    </Suspense>
  )
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

      {/* 后台路由 - 懒加载 */}
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={null}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <Suspense fallback={null}>
              <AdminLayout />
            </Suspense>
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
        <Route path="log">
          <Route path="login" element={<LoginLog />} />
          <Route path="operation" element={<OperationLog />} />
          <Route path="access" element={<AccessLog />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App