import React, { useState, useMemo } from 'react'
import { Layout, Menu, Dropdown, Avatar, message } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  FolderOutlined,
  TagsOutlined,
  CommentOutlined,
  UserOutlined,
  LinkOutlined,
  SettingOutlined,
  LogoutOutlined,
  EditOutlined,
  OrderedListOutlined,
  BookOutlined,
  ToolOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { clearAuth } from '../../store/modules/auth'
import { logout } from '../../api/auth'
import Md5 from 'md5'
import './index.css'

const { Header, Sider, Content } = Layout

// 获取头像URL
const getAvatarUrl = (email, domain) => {
  const hash = email ? Md5(email.toLowerCase()) : 'default'
  const gravatarDomain = domain || 'weavatar.com'
  return `https://${gravatarDomain}/avatar/${hash}?d=mp`
}

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { userInfo } = useSelector(state => state.auth)
  const siteConfig = useSelector(state => state.siteConfig.data) || {}
  const gravatarDomain = siteConfig.gravatarDomain

  // 获取用户头像，优先使用用户设置的头像，否则使用邮箱生成
  const userAvatar = userInfo?.avatar || (userInfo?.email ? getAvatarUrl(userInfo.email, gravatarDomain) : null)

  const menuItems = [
    { key: '/admin', icon: <DashboardOutlined />, label: '仪表盘' },
    {
      key: 'blog',
      icon: <BookOutlined />,
      label: '博客管理',
      children: [
        { key: '/admin/article/add', icon: <EditOutlined />, label: '写文章' },
        { key: '/admin/article/list', icon: <OrderedListOutlined />, label: '文章管理' },
        { key: '/admin/page', icon: <FileTextOutlined />, label: '页面管理' }
      ]
    },
    { key: '/admin/category', icon: <FolderOutlined />, label: '分类管理' },
    { key: '/admin/tag', icon: <TagsOutlined />, label: '标签管理' },
    { key: '/admin/comment', icon: <CommentOutlined />, label: '评论管理' },
    { key: '/admin/friend-link', icon: <LinkOutlined />, label: '友链管理' },
    { key: '/admin/user', icon: <UserOutlined />, label: '用户管理' },
    { key: '/admin/setting', icon: <SettingOutlined />, label: '网站设置' },
    { key: '/admin/tool', icon: <ToolOutlined />, label: '工具库' }
  ]

  // 获取当前选中的菜单key
  const selectedKey = useMemo(() => {
    const path = location.pathname
    // 仪表盘
    if (path === '/admin' || path === '/admin/dashboard') {
      return '/admin'
    }
    // 编辑文章时选中文章管理
    if (path.startsWith('/admin/article/edit/')) {
      return '/admin/article/list'
    }
    return path
  }, [location.pathname])

  // 获取展开的子菜单keys
  const openKeys = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/admin/article')) {
      return ['blog']
    }
    return []
  }, [location.pathname])

  const handleMenuClick = ({ key }) => navigate(key)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      // ignore
    }
    dispatch(clearAuth())
    message.success('退出成功')
    navigate('/admin/login')
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  return (
    <Layout className="admin-layout">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo">{collapsed ? 'BLOG' : '博客管理系统'}</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header className="header">
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: () => setCollapsed(!collapsed)
          })}
          <div className="user-info">
            <Dropdown menu={{ items: userMenuItems }}>
              <div style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} src={userAvatar} />
                <span style={{ marginLeft: 8 }}>{userInfo?.nickname || userInfo?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout
