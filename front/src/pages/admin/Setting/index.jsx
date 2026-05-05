import React, { useState, useEffect } from 'react'
import { Form, Input, Button, message, Spin, Card } from 'antd'
import { getSiteConfig, updateConfigs } from '../../../api/config'

// 字段映射：驼峰 -> 下划线
const camelToSnake = {
  siteName: 'site_name',
  siteDescription: 'site_description',
  siteKeywords: 'site_keywords',
  siteLogo: 'site_logo',
  siteFooterLogo: 'site_footer_logo',
  siteFavicon: 'site_favicon',
  footerInfo: 'footer_info',
  siteIcp: 'site_icp',
  githubUrl: 'github_url',
  telegramUrl: 'telegram_url',
  weiboUrl: 'weibo_url',
  zhihuUrl: 'zhihu_url',
  twitterUrl: 'twitter_url',
  email: 'email',
  wechatQrcode: 'wechat_qrcode',
  qqNumber: 'qq_number',
  statsUrl: 'stats_url',
  trackingCode: 'tracking_code'
}

// 字段映射：下划线 -> 驼峰
const snakeToCamel = Object.fromEntries(
  Object.entries(camelToSnake).map(([k, v]) => [v, k])
)

function Setting() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await getSiteConfig()
      if (res.data) {
        // 驼峰转下划线填充表单
        const formValues = {}
        Object.entries(camelToSnake).forEach(([camelKey, snakeKey]) => {
          formValues[snakeKey] = res.data[camelKey] || ''
        })
        form.setFieldsValue(formValues)
      }
    } catch (e) {
      console.error('加载配置失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const values = await form.validateFields()
      // 直接发送下划线格式
      const configs = Object.entries(values)
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([key, value]) => ({ configKey: key, configValue: value }))
      await updateConfigs(configs)
      message.success('保存成功')
      // 更新 localStorage 缓存，转换为驼峰格式
      const cacheData = {}
      Object.entries(values).forEach(([key, value]) => {
        const camelKey = snakeToCamel[key]
        if (camelKey) {
          cacheData[camelKey] = value
        }
      })
      localStorage.setItem('site_config', JSON.stringify(cacheData))
    } catch (e) {
      console.error('保存失败', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="网站设置">
      <Spin spinning={loading}>
        <Form
          form={form}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 16 }}
          onFinish={handleSave}
        >
          <Form.Item label="站点名称" name="site_name">
            <Input placeholder="请输入站点名称" />
          </Form.Item>
          <Form.Item label="站点描述" name="site_description">
            <Input.TextArea rows={2} placeholder="请输入站点描述" />
          </Form.Item>
          <Form.Item label="站点关键词" name="site_keywords">
            <Input placeholder="多个关键词用逗号分隔" />
          </Form.Item>
          <Form.Item label="站点Logo" name="site_logo">
            <Input placeholder="Logo图片URL" />
          </Form.Item>
          <Form.Item label="页脚Logo" name="site_footer_logo">
            <Input placeholder="页脚Logo图片URL" />
          </Form.Item>
          <Form.Item label="站点Favicon" name="site_favicon">
            <Input placeholder="Favicon图标URL" />
          </Form.Item>
          <Form.Item label="页脚信息" name="footer_info">
            <Input.TextArea rows={2} placeholder="页脚显示的额外信息" />
          </Form.Item>
          <Form.Item label="备案号" name="site_icp">
            <Input placeholder="如：粤ICP备12345678号" />
          </Form.Item>

          <Form.Item label="GitHub链接" name="github_url">
            <Input placeholder="GitHub主页URL" />
          </Form.Item>
          <Form.Item label="电报链接" name="telegram_url">
            <Input placeholder="Telegram链接URL" />
          </Form.Item>
          <Form.Item label="微博链接" name="weibo_url">
            <Input placeholder="微博主页URL" />
          </Form.Item>
          <Form.Item label="知乎链接" name="zhihu_url">
            <Input placeholder="知乎主页URL" />
          </Form.Item>
          <Form.Item label="推特链接" name="twitter_url">
            <Input placeholder="Twitter主页URL" />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="联系邮箱" />
          </Form.Item>
          <Form.Item label="微信二维码" name="wechat_qrcode">
            <Input placeholder="微信二维码图片URL" />
          </Form.Item>
          <Form.Item label="QQ号" name="qq_number">
            <Input placeholder="QQ号码" />
          </Form.Item>

          <Form.Item label="统计链接" name="stats_url">
            <Input placeholder="统计查看链接，如 https://umami.example.com" />
          </Form.Item>
          <Form.Item label="跟踪代码" name="tracking_code">
            <Input.TextArea rows={3} placeholder='跟踪脚本代码，如：<script async defer src="https://umami.example.com/umami.js"></script>' />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  )
}

export default Setting