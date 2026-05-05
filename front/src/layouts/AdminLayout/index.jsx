import React, { useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, message } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FolderOutlined,
  TagsOutlined,
  CommentOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { clearAuth } from '../../store/modules/auth'
import { logout } from '../../api/auth'
import './index.css'

const { Header, Sider, Content } = Layout

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { userInfo } = useSelector(state => state.auth)

  const menuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
    { key: '/admin/article/list', icon: <FileTextOutlined />, label: '文章管理' },
    { key: '/admin/category', icon: <FolderOutlined />, label: '分类管理' },
    { key: '/admin/tag', icon: <TagsOutlined />, label: '标签管理' },
    { key: '/admin/comment', icon: <CommentOutlined />, label: '评论管理' },
    { key: '/admin/user', icon: <UserOutlined />, label: '用户管理' },
    { key: '/admin/setting', icon: <SettingOutlined />, label: '网站设置' }
  ]

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
          selectedKeys={[location.pathname]}
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
                <Avatar icon={<UserOutlined />} src={userInfo?.avatar} />
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
