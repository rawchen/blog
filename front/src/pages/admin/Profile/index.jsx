import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message, Row, Col, DatePicker, Radio, Spin } from 'antd'
import { LockOutlined, UserOutlined, MailOutlined, EditOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { changePassword, updateProfile, getCurrentUser, logout } from '../../../api/auth'
import { setUserInfo, clearAuth } from '../../../store/modules/auth'
import dayjs from 'dayjs'

function Profile() {
  const [passwordForm] = Form.useForm()
  const [profileForm] = Form.useForm()
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const { userInfo } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    setLoading(true)
    try {
      const res = await getCurrentUser()
      if (res.data) {
        const formValues = {
          nickname: res.data.nickname,
          email: res.data.email,
          signature: res.data.signature,
          gender: res.data.gender,
          birthday: res.data.birthday ? dayjs(res.data.birthday) : null
        }
        profileForm.setFieldsValue(formValues)
        dispatch(setUserInfo(res.data))
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (values) => {
    setPasswordLoading(true)
    try {
      await changePassword(values)
      message.success('密码修改成功，请重新登录')
      passwordForm.resetFields()
      // 退出登录
      try {
        await logout()
      } catch (e) {
        // ignore
      }
      dispatch(clearAuth())
      navigate('/admin/login')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleProfileSubmit = async (values) => {
    setProfileLoading(true)
    try {
      const data = {
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : null
      }
      await updateProfile(data)
      message.success('资料更新成功')
      loadUserInfo()
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <Spin spinning={loading}>
      <Row gutter={24}>
        <Col span={12}>
          <Card
            title={<><LockOutlined /> 修改密码</>}
            style={{ marginBottom: 24 }}
          >
            <Form
              form={passwordForm}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              onFinish={handlePasswordSubmit}
            >
              <Form.Item
                label="旧密码"
                name="oldPassword"
                rules={[{ required: true, message: '请输入旧密码' }]}
              >
                <Input.Password placeholder="请输入旧密码" maxLength={20} />
              </Form.Item>
              <Form.Item
                label="新密码"
                name="newPassword"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, max: 20, message: '密码长度为6-20位' }
                ]}
              >
                <Input.Password placeholder="请输入新密码（6-20位）" maxLength={20} />
              </Form.Item>
              <Form.Item
                label="确认密码"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    }
                  })
                ]}
              >
                <Input.Password placeholder="请再次输入新密码" maxLength={20} />
              </Form.Item>
              <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
                <Button type="primary" htmlType="submit" loading={passwordLoading}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={<><UserOutlined /> 个人资料</>}
          >
            <Form
              form={profileForm}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              onFinish={handleProfileSubmit}
            >
              <Form.Item
                label="用户名"
              >
                <Input value={userInfo?.username} disabled />
              </Form.Item>
              <Form.Item
                label="昵称"
                name="nickname"
                rules={[{ max: 50, message: '昵称最多50个字符' }]}
              >
                <Input placeholder="请输入昵称" maxLength={50} />
              </Form.Item>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[{ type: 'email', message: '请输入正确的邮箱格式' }]}
              >
                <Input placeholder="请输入邮箱" prefix={<MailOutlined />} />
              </Form.Item>
              <Form.Item
                label="签名"
                name="signature"
                rules={[{ max: 255, message: '签名最多255个字符' }]}
              >
                <Input.TextArea rows={2} placeholder="请输入个性签名" maxLength={255} />
              </Form.Item>
              <Form.Item
                label="性别"
                name="gender"
              >
                <Radio.Group>
                  <Radio value={0}>未知</Radio>
                  <Radio value={1}>男</Radio>
                  <Radio value={2}>女</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="生日"
                name="birthday"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择生日" />
              </Form.Item>
              <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
                <Button type="primary" htmlType="submit" loading={profileLoading}>
                  保存资料
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </Spin>
  )
}

export default Profile
