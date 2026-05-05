import React, { useState, useEffect } from 'react'
import { getFriendLinkList } from '../../api/friendLink'
import { getSiteConfig } from '../../api/config'
import './index.css'

function FriendsPage() {
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [siteConfig, setSiteConfig] = useState({})

  useEffect(() => {
    fetchFriends()
    fetchSiteConfig()
  }, [])

  const fetchSiteConfig = async () => {
    try {
      const res = await getSiteConfig()
      if (res.code === 200) {
        setSiteConfig(res.data || {})
      }
    } catch (e) {
      console.error('加载站点配置失败', e)
    }
  }

  const fetchFriends = async () => {
    setLoading(true)
    try {
      const res = await getFriendLinkList()
      if (res.code === 200) {
        setFriends(res.data || [])
      }
    } catch (error) {
      console.error('加载友链失败', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="friends-loading">加载中...</div>
  }

  return (
    <div className="friends-page">
      {/* Header */}
      <div className="friends-header">
        <h1>友情链接</h1>
      </div>

      {/* Meta */}
      <div className="friends-meta">
        <i className="fa fa-clock-o" aria-hidden="true"></i>
        更新于 {new Date().toLocaleDateString('zh-CN')}
        <i className="fa fa-link" aria-hidden="true" style={{ marginLeft: '15px' }}></i>
        {friends.length} 个友链
      </div>

      {/* Content */}
      <div className="friends-content">
        <p>这里是一些朋友的博客链接，欢迎互换友链~</p>
      </div>

      {/* Friends List */}
      {friends.length > 0 ? (
        <ul className="friends-list clearfix">
          {friends.map(friend => (
            <li key={friend.id}>
              <a
                className={`friend-card ${friend.status !== 1 ? 'hidden' : ''}`}
                href={friend.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={friend.siteName}
              >
                <img
                  className="friend-avatar"
                  src={friend.logo || '/images/default-avatar.png'}
                  alt={friend.siteName}
                />
                <div className="friend-name">{friend.siteName}</div>
                <div className="friend-desc">{friend.description || friend.siteUrl}</div>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="friends-empty">
          <i className="fa fa-link" aria-hidden="true"></i>
          <p>暂无友链</p>
        </div>
      )}

      {/* Apply Section */}
      <div className="apply-section">
        <h3>申请友链</h3>
        <p>
          欢迎互换友链！请确保您的网站符合以下要求：
          <br />
          1. 网站内容健康积极
          <br />
          2. 网站能正常访问
          <br />
          3. 网站有一定的原创内容
        </p>
        <a
          className="apply-btn"
          href={`mailto:${siteConfig.email || 'admin@rawchen.com'}?subject=申请友链`}
        >
          发送申请
        </a>
      </div>
    </div>
  )
}

export default FriendsPage