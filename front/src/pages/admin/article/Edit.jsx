import React, { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Card, message, Switch, Space, Tooltip, DatePicker } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { getArticleById, createArticle, updateArticle, generateSummary } from '../../../api/article'
import { getCategoryList } from '../../../api/category'
import { getTagList } from '../../../api/tag'
import MarkdownEditor from '../../../components/MarkdownEditor'
import './Edit.css'

const { TextArea } = Input
const { Option } = Select

function ArticleEdit() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [contentValue, setContentValue] = useState('')
  const [originalPublishTime, setOriginalPublishTime] = useState(null)
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    fetchCategories()
    fetchTags()
    if (id) fetchArticle()
  }, [id])

  // 监听表单内容变化
  const handleValuesChange = (changedValues) => {
    if ('content' in changedValues) {
      setContentValue(changedValues.content || '')
    }
  }

  const fetchCategories = async () => {
    const res = await getCategoryList()
    setCategories(res.data)
  }

  const fetchTags = async () => {
    const res = await getTagList()
    setTags(res.data)
  }

  const fetchArticle = async () => {
    setLoading(true)
    try {
      const res = await getArticleById(id)
      form.setFieldsValue(res.data)
      setContentValue(res.data.content || '')
      // 编辑时将tagIds转为字符串数组供Select使用
      if (res.data.tagIds) {
        form.setFieldValue('tagValues', res.data.tagIds.map(String))
      }
      // 回写发布时间
      if (res.data.publishTime) {
        setOriginalPublishTime(res.data.publishTime)
        form.setFieldValue('publishTime', dayjs(res.data.publishTime, 'YYYY-MM-DD HH:mm:ss'))
      }
    } finally {
      setLoading(false)
    }
  }

  // 分离标签值为已有标签ID和新标签名称
  const parseTagValues = (tagValues) => {
    if (!tagValues || tagValues.length === 0) {
      return { tagIds: [], newTags: [] }
    }
    const tagIds = []
    const newTags = []
    const existingTagIds = tags.map(t => String(t.id))

    tagValues.forEach(v => {
      if (existingTagIds.includes(v)) {
        tagIds.push(Number(v))
      } else {
        newTags.push(v)
      }
    })
    return { tagIds, newTags }
  }

  const handleSubmit = async (status) => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 处理标签数据
      const { tagIds, newTags } = parseTagValues(values.tagValues)
      const submitData = { ...values, tagIds, newTags, id, status }
      delete submitData.tagValues

      // 处理发布时间
      if (values.publishTime) {
        submitData.publishTime = values.publishTime.format('YYYY-MM-DD HH:mm:ss')
      } else {
        // 如果为空，编辑时使用上次发布时间，新增时使用当前时间
        submitData.publishTime = id && originalPublishTime ? originalPublishTime : dayjs().format('YYYY-MM-DD HH:mm:ss')
      }

      if (id) {
        await updateArticle(submitData)
        message.success('更新成功')
      } else {
        await createArticle(submitData)
        message.success('创建成功')
      }

      navigate('/admin/article/list')
    } catch (error) {
      // error handled
    } finally {
      setLoading(false)
    }
  }

  const handleAiSummary = async () => {
    const content = form.getFieldValue('content')
    if (!content || content.trim() === '') {
      message.warning('请先填写文章内容')
      return
    }

    setAiLoading(true)
    try {
      const res = await generateSummary(content)
      if (res.data) {
        form.setFieldValue('summary', res.data)
        message.success('AI摘要生成成功')
      }
    } catch (error) {
      message.error('AI摘要生成失败: ' + (error.message || '请稍后重试'))
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="article-edit-container">
      <div className="article-edit-main">
        <Card className="article-edit-card">
          <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
            <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
              <Input placeholder="请输入标题" size="large" />
            </Form.Item>

            <Form.Item label="摘要" name="summary">
              <TextArea rows={2} placeholder="请输入摘要（可选）" />
            </Form.Item>

            <Form.Item>
              <Tooltip title={contentValue ? '根据文章内容自动生成摘要' : '请先填写文章内容'}>
                <Button
                  icon={<RobotOutlined />}
                  onClick={handleAiSummary}
                  loading={aiLoading}
                  disabled={!contentValue || contentValue.trim() === ''}
                >
                  AI生成摘要
                </Button>
              </Tooltip>
            </Form.Item>

            <Form.Item label="内容" name="content" rules={[{ required: true, message: '请输入内容' }]} className="content-editor-item">
              <MarkdownEditor height={600} placeholder="请输入Markdown内容，支持粘贴图片自动上传" />
            </Form.Item>
          </Form>
        </Card>
      </div>

      <div className="article-edit-sidebar">
        <Card title="发布设置" className="sidebar-card">
          <Form form={form} layout="vertical">
            <Form.Item
              label="发布时间"
              name="publishTime"
              rules={[{ required: true, message: '请选择发布时间' }]}
              initialValue={dayjs()}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择发布时间"
                style={{ width: '100%' }}
                allowClear={false}
              />
            </Form.Item>

            <Form.Item label="分类" name="categoryId" rules={[{ required: true, message: '请选择分类' }]}>
              <Select placeholder="请选择分类">
                {categories.map(item => (
                  <Option key={item.id} value={item.id}>{item.categoryName}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="标签" name="tagValues">
              <Select mode="tags" placeholder="请选择或输入标签（回车创建新标签）">
                {tags.map(item => (
                  <Option key={item.id} value={String(item.id)}>{item.tagName}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="封面图片" name="coverImage">
              <Input placeholder="请输入封面图片URL" />
            </Form.Item>

            <Form.Item label="置顶" name="isTop" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>

            <Form.Item label="推荐" name="isRecommend" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>

            <Form.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" loading={loading} block onClick={() => handleSubmit(1)}>
                  {id ? '更新文章' : '发布文章'}
                </Button>
                <Button loading={loading} block onClick={() => handleSubmit(0)}>
                  保存草稿
                </Button>
                <Button onClick={() => navigate('/admin/article/list')} block>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
}

export default ArticleEdit
