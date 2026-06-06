import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Modal, Form, Input, message, Button, Space } from 'antd'
import { PlusOutlined, LoadingOutlined, CloseOutlined } from '@ant-design/icons'
import { getFriendLinkList, applyFriendLink, getCaptcha, getStsTokenPublic, uploadImageUrl } from '../../api/friendLink'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import './index.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faClock, faComment, faEye, faUser} from "@fortawesome/free-regular-svg-icons";
import {Link} from "react-router-dom";

// 动态加载OSS SDK
const loadOSS = () => {
  return new Promise((resolve, reject) => {
    if (window.OSS) {
      resolve(window.OSS)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://gosspublic.alicdn.com/aliyun-oss-sdk-6.18.0.min.js'
    script.onload = () => resolve(window.OSS)
    script.onerror = () => reject(new Error('OSS SDK加载失败'))
    document.head.appendChild(script)
  })
}

function FriendsPage({ pageContent }) {
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const siteConfig = useSelector(state => state.siteConfig.data) || {}

  // 验证码状态
  const [captchaQuestion, setCaptchaQuestion] = useState('')
  const [captchaSessionId, setCaptchaSessionId] = useState('')

  // 本地文件预览状态
  const [localFile, setLocalFile] = useState(null)
  const localFileRef = useRef(null)
  const [localFilePreview, setLocalFilePreview] = useState('')
  // URL预览状态
  const [urlPreview, setUrlPreview] = useState('')
  const logoInputRef = useRef(null)

  useEffect(() => {
    fetchFriends()
  }, [])

  // Modal 完全打开后初始化 form
  const handleModalOpenChange = (open) => {
    if (open) {
      form.resetFields()
      setLocalFile(null)
      localFileRef.current = null
      setLocalFilePreview('')
      setUrlPreview('')
      setCaptchaQuestion('')
      setCaptchaSessionId('')
      fetchCaptcha()
    }
  }

  // 恢复刷新前的滚动位置
  useEffect(() => {
    if (loading) return
    const key = `scroll_page_${pageContent?.slug || 'friends'}`
    const saved = sessionStorage.getItem(key)
    if (saved) {
      sessionStorage.removeItem(key)
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(saved, 10))
      })
    }
  }, [loading, pageContent?.slug])

  // 页面卸载前保存滚动位置
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(`scroll_page_${pageContent?.slug || 'friends'}`, String(window.scrollY))
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pageContent?.slug])

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

  // 获取验证码
  const fetchCaptcha = async () => {
    try {
      const res = await getCaptcha()
      setCaptchaSessionId(res.data.sessionId)
      setCaptchaQuestion(res.data.question)
    } catch (err) {
      message.error('获取验证码失败')
    }
  }

  const handleApply = (e) => {
    e.preventDefault()
    const scrollY = window.scrollY
    setModalVisible(true)
    // 阻止 Modal 打开时的滚动跳转
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
    })
  }

  // 点击上传图标按钮
  const handleLogoUploadClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    logoInputRef.current?.click()
  }

  // 选择本地文件后预览
  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件')
      return
    }

    setLocalFile(file)
    localFileRef.current = file
    // 清空URL预览
    setUrlPreview('')
    // 生成本地预览URL
    const previewUrl = URL.createObjectURL(file)
    setLocalFilePreview(previewUrl)
    // 用文件名填充输入框
    form.setFieldValue('logo', file.name)
    // 触发验证
    form.validateFields(['logo'])
    e.target.value = ''
  }

  // 删除本地文件预览
  const handleRemoveLocalFile = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (localFilePreview) {
      URL.revokeObjectURL(localFilePreview)
    }
    setLocalFile(null)
    localFileRef.current = null
    setLocalFilePreview('')
    form.setFieldValue('logo', '')
    form.validateFields(['logo'])
  }

  // 删除URL预览
  const handleRemoveUrlPreview = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setUrlPreview('')
    form.setFieldValue('logo', '')
  }

  // 上传文件到OSS
  const uploadToOSS = async (file, captchaAnswer) => {
    const OSSClient = await loadOSS()
    const res = await getStsTokenPublic({
      captchaSessionId,
      captchaAnswer
    })
    const stsToken = res.data

    // 生成文件路径
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const dateFolder = `${year}/${month}`
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileExt = file.name.split('.').pop() || 'png'
    const objectKey = `${stsToken.uploadFolder || 'blog'}/${dateFolder}/${randomStr}.${fileExt}`

    const client = new OSSClient({
      region: stsToken.region,
      accessKeyId: stsToken.accessKeyId,
      accessKeySecret: stsToken.accessKeySecret,
      stsToken: stsToken.securityToken,
      bucket: stsToken.bucketName,
      secure: true
    })

    const result = await client.put(objectKey, file)

    // 返回文件URL
    let url
    if (stsToken.customDomain) {
      url = `https://${stsToken.customDomain}/${objectKey}`
    } else {
      url = result.url || `https://${stsToken.bucketName}.${stsToken.endpoint}/${objectKey}`
    }
    // 拼接Logo样式
    if (siteConfig.ossStyleLogo) {
      url = url + siteConfig.ossStyleLogo
    }
    return url
  }

  const handleSubmit = async () => {
    try {
      // 验证所有字段
      const values = await form.validateFields()

      setSubmitting(true)

      let logoUrl = values.logo

      // 统一上传到OSS
      if (localFileRef.current) {
        // 本地文件上传
        try {
          logoUrl = await uploadToOSS(localFileRef.current, values.captchaAnswer)
        } catch (error) {
          await fetchCaptcha()
          setSubmitting(false)
          return
        }
      } else if (values.logo && /^https?:\/\/.+/i.test(values.logo)) {
        // 公网URL上传到OSS
        try {
          const res = await uploadImageUrl({
            imageUrl: values.logo,
            captchaSessionId: captchaSessionId,
            captchaAnswer: Number(values.captchaAnswer)
          })
          logoUrl = res.data
        } catch (error) {
          await fetchCaptcha()
          setSubmitting(false)
          return
        }
      }

      // 提交申请
      await applyFriendLink({
        siteName: values.siteName,
        siteUrl: values.siteUrl,
        logo: logoUrl,
        description: form.getFieldValue('description'),
        captchaSessionId: captchaSessionId,
        captchaAnswer: Number(values.captchaAnswer)
      })
      message.success('申请已提交，请等待审核')
      setModalVisible(false)
      setSubmitting(false)
      // 清理本地预览URL
      if (localFilePreview) {
        URL.revokeObjectURL(localFilePreview)
      }
    } catch (error) {
      setSubmitting(false)
      // 区分表单校验错误和 API 错误
      if (error.errorFields) {
        // 表单校验错误，不刷新验证码
        return
      }
      // API 错误，刷新验证码（拦截器已显示错误信息）
      await fetchCaptcha()
    }
  }

  // 监听logo字段变化，自动预览URL图片
  const handleLogoUrlChange = (e) => {
    const value = e.target.value
    // 如果是输入URL模式（不是文件名），尝试预览
    if (value && /^https?:\/\/.+/i.test(value)) {
      // 清除本地文件预览
      if (localFileRef.current) {
        if (localFilePreview) {
          URL.revokeObjectURL(localFilePreview)
        }
        setLocalFile(null)
        localFileRef.current = null
        setLocalFilePreview('')
      }
      setUrlPreview(value)
    } else if (!value) {
      // 清空时清除所有预览
      setUrlPreview('')
      if (localFileRef.current) {
        if (localFilePreview) {
          URL.revokeObjectURL(localFilePreview)
        }
        setLocalFile(null)
        localFileRef.current = null
        setLocalFilePreview('')
      }
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
                <span className={`status-dot ${friend.status === 1 ? 'normal' : 'invalid'}`}></span>
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
        <button className="apply-btn" type="button" onClick={handleApply}>
          发送申请
        </button>
      </div>

      {/* Apply Modal */}
      <Modal
        title="申请友链"
        open={modalVisible}
        onOk={() => handleSubmit()}
        onCancel={() => {
          setModalVisible(false)
          if (localFilePreview) {
            URL.revokeObjectURL(localFilePreview)
          }
          setLocalFile(null)
          setLocalFilePreview('')
          setUrlPreview('')
        }}
        afterOpenChange={handleModalOpenChange}
        confirmLoading={submitting}
        okText="提交申请"
        cancelText="取消"
        focusTriggerAfterClose={false}
        maskClosable={false}
        getContainer={false}
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
            required={true}
            rules={[{
              validator: (_, value) => {
                // 如果有本地文件，视为有效
                if (localFileRef.current) {
                  return Promise.resolve()
                }
                // 如果没有值
                if (!value) {
                  return Promise.reject(new Error('请输入图标链接或上传图标'))
                }
                // 如果值不是有效的 URL
                if (!/^https?:\/\/.+/i.test(value)) {
                  return Promise.reject(new Error('请输入有效的图标链接地址'))
                }
                return Promise.resolve()
              }
            }]}
          >
            <Input
              placeholder="输入图标URL或点击右侧上传"
              onChange={handleLogoUrlChange}
              suffix={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* 本地文件预览 */}
                  {localFilePreview && (
                    <div
                      style={{
                        position: 'relative',
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid #d9d9d9'
                      }}
                      className="logo-preview-wrapper"
                    >
                      <img
                        src={localFilePreview}
                        alt="预览"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <div
                        className="logo-preview-delete"
                        onClick={handleRemoveLocalFile}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          opacity: 0,
                          transition: 'opacity 0.2s'
                        }}
                      >
                        <CloseOutlined style={{ color: '#fff', fontSize: 12 }} />
                      </div>
                    </div>
                  )}
                  {/* URL预览 */}
                  {urlPreview && !localFilePreview && (
                    <div
                      style={{
                        position: 'relative',
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid #d9d9d9'
                      }}
                      className="logo-preview-wrapper"
                    >
                      <img
                        src={urlPreview}
                        alt="预览"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={() => setUrlPreview('')}
                      />
                      <div
                        className="logo-preview-delete"
                        onClick={handleRemoveUrlPreview}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          opacity: 0,
                          transition: 'opacity 0.2s'
                        }}
                      >
                        <CloseOutlined style={{ color: '#fff', fontSize: 12 }} />
                      </div>
                    </div>
                  )}
                  <PlusOutlined
                    style={{ cursor: 'pointer', color: '#1890ff' }}
                    onClick={handleLogoUploadClick}
                    title="上传本地图片"
                  />
                </div>
              }
            />
          </Form.Item>
          {/* 隐藏的文件输入 */}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleLogoFileChange}
          />
          <Form.Item
            label="网站描述"
            name="description"
          >
            <Input.TextArea rows={2} placeholder="网站简介（选填）" maxLength={200} />
          </Form.Item>
          <Form.Item
            label="人机验证"
            name="captchaAnswer"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="请输入计算结果"
                type="number"
                style={{ flex: 1 }}
              />
              <Button
                onClick={fetchCaptcha}
              >
                {captchaQuestion || '获取验证码'}
              </Button>
            </Space.Compact>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FriendsPage
