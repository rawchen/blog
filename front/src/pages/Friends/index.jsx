import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Modal, Form, Input, message } from 'antd'
import { getFriendLinkList, applyFriendLink } from '../../api/friendLink'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import './index.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClock, faComment, faEye, faUser} from "@fortawesome/free-regular-svg-icons";
import {Link} from "react-router-dom";

function FriendsPage({ pageContent }) {
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const siteConfig = useSelector(state => state.siteConfig.data) || {}

  useEffect(() => {
    fetchFriends()
  }, [])

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

  const handleApply = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await applyFriendLink(values)
      message.success('申请已提交，请等待审核')
      setModalVisible(false)
    } catch (error) {
      // error handled
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="friends-loading">加载中...</div>
  }

  return (
    <div className="friends-page">
      {/* Header */}
      <div className="friends-header">
        <h1>{pageContent?.title || '友情链接'}</h1>
      </div>

      {/* Meta */}
      {/*<div className="friends-meta">*/}
      {/*  <i className="fa fa-clock-o" aria-hidden="true"></i>*/}
      {/*  更新于 {pageContent?.updateTime ? new Date(pageContent.updateTime).toLocaleDateString('zh-CN') : new Date().toLocaleDateString('zh-CN')}*/}
      {/*  <i className="fa fa-eye" aria-hidden="true"></i>*/}
      {/*  {pageContent?.viewCount || 0} 浏览*/}
      {/*  <i className="fa fa-link" aria-hidden="true" style={{ marginLeft: '15px' }}></i>*/}

      {/*</div>*/}
      <div className="friends-meta">
        <span className="meta-item">
          <FontAwesomeIcon icon={faClock} className="fa-icon" />
            {new Date(pageContent.publishTime).toLocaleDateString('zh-CN')}
        </span>
        <span className="meta-item">
                  <FontAwesomeIcon icon={faComment} className="fa-icon" />
                  <Link to="#comments">{pageContent.commentCount || 0} 评论</Link>
                </span>
        <span className="meta-item">
                  <FontAwesomeIcon icon={faEye} className="fa-icon" />
          {pageContent.viewCount || 0} 浏览
                </span>
        <span className="meta-item">
                  <FontAwesomeIcon icon={faUser} className="fa-icon" />
          {friends.length || 0} 个友链
                </span>

      </div>

      {/* Content */}
      <div className="friends-content">
        {pageContent?.content ? (
          <MarkdownRenderer content={pageContent.content} />
        ) : (
          <p>这里是一些朋友的博客链接，欢迎互换友链~</p>
        )}
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
        <button className="apply-btn" onClick={handleApply}>
          发送申请
        </button>
      </div>

      {/* Apply Modal */}
      <Modal
        title="申请友链"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        okText="提交申请"
        cancelText="取消"
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item
            label="网站名称"
            name="siteName"
            rules={[{ required: true, message: '请输入网站名称' }]}
          >
            <Input placeholder="请输入网站名称" maxLength={50} />
          </Form.Item>
          <Form.Item
            label="网站地址"
            name="siteUrl"
            rules={[
              { required: true, message: '请输入网站地址' },
              { pattern: /^https?:\/\/.*/, message: '请输入有效的网址' }
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item
            label="图标链接"
            name="logo"
            rules={[{ required: true, message: '请输入图标链接' }]}
          >
            <Input placeholder="网站Logo图标链接" />
          </Form.Item>
          <Form.Item
            label="网站描述"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="网站简介（选填）" maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FriendsPage
