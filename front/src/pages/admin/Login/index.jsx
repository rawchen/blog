import React from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setAuth } from '../../../store/modules/auth'
import { login } from '../../../api/auth'
import './index.css'

function Login() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [form] = Form.useForm()

  const handleSubmit = async (values) => {
    try {
      const res = await login(values)
      dispatch(setAuth(res.data))
      message.success('登录成功')
      navigate('/admin/dashboard')
    } catch (error) {
      // error handled in request
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card" title="博客后台管理系统">
        <Form form={form} onFinish={handleSubmit}>
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
        <div className="login-tip">
          默认账号: admin / admin123
        </div>
      </Card>
    </div>
  )
}

export default Login
