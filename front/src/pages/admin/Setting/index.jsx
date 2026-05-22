import React, { useState, useEffect } from 'react'
import { Form, Input, InputNumber, Button, message, Spin, Card, Switch, Row, Col, Tooltip, DatePicker } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getSiteConfig, updateConfigs } from '../../../api/config'

// 字段映射：驼峰 -> 下划线
const camelToSnake = {
  siteName: 'site_name',
  siteUrl: 'site_url',
  siteDescription: 'site_description',
  siteKeywords: 'site_keywords',
  siteLogo: 'site_logo',
  siteFooterLogo: 'site_footer_logo',
  siteFavicon: 'site_favicon',
  footerInfo: 'footer_info',
  skillList: 'skill_list',
  typewriterEnabled: 'typewriter_enabled',
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
  trackingCode: 'tracking_code',
  ossEnabled: 'oss_enabled',
  ossStyle: 'oss_style',
  gravatarDomain: 'gravatar_domain',
  commentEnabled: 'comment_enabled',
  mailEnabled: 'mail_enabled',
  totalPv: 'total_pv',
  totalUv: 'total_uv',
  siteCreateDate: 'site_create_date',
  htmlRenderEnabled: 'html_render_enabled'
}

// 字段映射：下划线 -> 驼峰
const snakeToCamel = Object.fromEntries(
  Object.entries(camelToSnake).map(([k, v]) => [v, k])
)

function Setting() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ossEnabled, setOssEnabled] = useState(true)
  const [commentEnabled, setCommentEnabled] = useState(false)
  const [mailEnabled, setMailEnabled] = useState(false)
  const [typewriterEnabled, setTypewriterEnabled] = useState(true)
  const [htmlRenderEnabled, setHtmlRenderEnabled] = useState(false)
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
          let value = res.data[camelKey]
          // 布尔值字段特殊处理
          if (camelKey === 'ossEnabled' || camelKey === 'commentEnabled' || camelKey === 'mailEnabled' || camelKey === 'typewriterEnabled' || camelKey === 'htmlRenderEnabled') {
            value = value === true || value === 'true'
          }
          // 日期字段转为dayjs对象
          if (camelKey === 'siteCreateDate' && value) {
            value = dayjs(value)
          }
          formValues[snakeKey] = value ?? ''
        })
        form.setFieldsValue(formValues)
        setOssEnabled(formValues['oss_enabled'])
        setCommentEnabled(formValues['comment_enabled'])
        setMailEnabled(formValues['mail_enabled'])
        setTypewriterEnabled(formValues['typewriter_enabled'])
        setHtmlRenderEnabled(formValues['html_render_enabled'])
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
      // 处理布尔值字段转字符串
      if (values.oss_enabled !== undefined) {
        values.oss_enabled = String(values.oss_enabled)
      }
      if (values.comment_enabled !== undefined) {
        values.comment_enabled = String(values.comment_enabled)
      }
      if (values.mail_enabled !== undefined) {
        values.mail_enabled = String(values.mail_enabled)
      }
      if (values.typewriter_enabled !== undefined) {
        values.typewriter_enabled = String(values.typewriter_enabled)
      }
      if (values.html_render_enabled !== undefined) {
        values.html_render_enabled = String(values.html_render_enabled)
      }
      // 处理数字字段转字符串
      if (values.total_pv !== undefined && values.total_pv !== null) {
        values.total_pv = String(values.total_pv)
      }
      if (values.total_uv !== undefined && values.total_uv !== null) {
        values.total_uv = String(values.total_uv)
      }
      // 处理日期字段转字符串
      if (values.site_create_date && dayjs.isDayjs(values.site_create_date)) {
        values.site_create_date = values.site_create_date.format('YYYY-MM-DD')
      }
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
          // 布尔值字段保持布尔值
          if (camelKey === 'ossEnabled' || camelKey === 'commentEnabled' || camelKey === 'mailEnabled' || camelKey === 'typewriterEnabled' || camelKey === 'htmlRenderEnabled') {
            cacheData[camelKey] = value === 'true'
          } else {
            cacheData[camelKey] = value
          }
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
    <Form
      form={form}
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      onFinish={handleSave}
    >
      <Spin spinning={loading}>
        <Row gutter={24}>
          <Col span={12}>
            <Card title="网站基础设置">
              <Form.Item label="站点名称" name="site_name">
                <Input placeholder="请输入站点名称" />
              </Form.Item>
              <Form.Item label={<span><Tooltip title="网站完整URL，用于feed、表情邮件永久图片链接等场景。"><QuestionCircleOutlined style={{ color: '#999', marginLeft: 4 }} /></Tooltip> 网站地址</span>} name="site_url">
                <Input placeholder="如：https://example.com" />
              </Form.Item>
              <Form.Item label="站点描述" name="site_description">
                <Input placeholder="请输入站点描述" />
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
            </Card>
          </Col>
          <Col span={12}>
            <Card title="系统设置">
              <Form.Item label="统计链接" name="stats_url">
                <Input placeholder="统计查看链接，如 https://umami.example.com" />
              </Form.Item>
              <Form.Item label="跟踪代码" name="tracking_code">
                <Input.TextArea rows={2} placeholder='跟踪脚本代码，如：<script async defer src="https://umami.example.com/umami.js"></script>' />
              </Form.Item>
              <Form.Item label="开启OSS上传" name="oss_enabled" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" onChange={(checked) => setOssEnabled(checked)} />
              </Form.Item>
              <Form.Item label="OSS图片处理样式" name="oss_style" style={{ display: ossEnabled ? 'block' : 'none' }}>
                <Input placeholder="如：?x-oss-process=style/small" />
              </Form.Item>
              <Form.Item label="Gravatar头像域名" name="gravatar_domain">
                <Input placeholder="如：weavatar.com，为空则默认使用weavatar.com" />
              </Form.Item>
              <Form.Item label="开启评论审核" name="comment_enabled" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" onChange={(checked) => setCommentEnabled(checked)} />
              </Form.Item>
              <Form.Item label="开启邮件通知" name="mail_enabled" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" onChange={(checked) => setMailEnabled(checked)} />
              </Form.Item>
              <Form.Item label={<span><Tooltip title="开启后文章中的HTML标签将被渲染为真实元素，关闭则HTML标签以纯文本显示。"><QuestionCircleOutlined style={{ color: '#999', marginLeft: 4 }} /></Tooltip> 渲染HTML</span>} name="html_render_enabled" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" onChange={(checked) => setHtmlRenderEnabled(checked)} />
              </Form.Item>
              <Form.Item label="开启打字机" name="typewriter_enabled" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" onChange={(checked) => setTypewriterEnabled(checked)} />
              </Form.Item>
              <Form.Item label={<span><Tooltip title="打字机效果循环显示的技能，逗号分隔。如：写博客,极简化,户外运动"><QuestionCircleOutlined style={{ color: '#999', marginLeft: 4 }} /></Tooltip> 技能列表</span>} name="skill_list" style={{ display: typewriterEnabled ? 'block' : 'none' }}>
                <Input placeholder="逗号分隔，如：写博客,极简化,户外运动" />
              </Form.Item>
              <Form.Item label={<span><Tooltip title="系统自动累积，清理日志前会自动保存。可手动设置初始值。"><QuestionCircleOutlined style={{ color: '#999', marginLeft: 4 }} /></Tooltip> 历史累积PV</span>} name="total_pv">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="历史累积总访问量" />
              </Form.Item>
              <Form.Item label={<span><Tooltip title="系统自动累积，清理日志前会自动保存。可手动设置初始值。"><QuestionCircleOutlined style={{ color: '#999', marginLeft: 4 }} /></Tooltip> 历史累积UV</span>} name="total_uv">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="历史累积独立访客数" />
              </Form.Item>
              <Form.Item label={<span><Tooltip title="用于在页脚计算网站已运行时间。"><QuestionCircleOutlined style={{ color: '#999', marginLeft: 4 }} /></Tooltip> 建站日期</span>} name="site_create_date">
                <DatePicker style={{ width: '100%' }} placeholder="选择建站日期" />
              </Form.Item>
            </Card>
          </Col>
        </Row>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button type="primary" htmlType="submit" loading={saving}>
            保存设置
          </Button>
        </div>
      </Spin>
    </Form>
  )
}

export default Setting