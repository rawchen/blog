import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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

// 路由守卫
function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector(state => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return children
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
        <Route path="moments" element={<MomentsPage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path=":id" element={<ArticleDetail />} />
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
