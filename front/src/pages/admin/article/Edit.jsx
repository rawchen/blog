import React, { useState, useEffect, useRef } from 'react'
import { Form, Input, Select, Button, Card, message, Switch, Space, Tooltip, DatePicker, Popover, Radio } from 'antd'
import { RobotOutlined, DeleteOutlined, SettingOutlined, LinkOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { getArticleById, createArticle, updateArticle, generateSummary } from '../../../api/article'
import { getCategoryList } from '../../../api/category'
import { getTagList } from '../../../api/tag'
import MarkdownEditor from '../../../components/MarkdownEditor'
import './Edit.css'

const { TextArea } = Input
const { Option } = Select

// 草稿存储key
const DRAFT_KEY_PREFIX = 'article_draft_'

function ArticleEdit() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [contentValue, setContentValue] = useState('')
  const [originalPublishTime, setOriginalPublishTime] = useState(null)
  const [draftInfo, setDraftInfo] = useState(null) // 草稿信息
  const navigate = useNavigate()
  const { id } = useParams()
  const isRemoteLoadedRef = useRef(false) // 标记远程数据是否已加载
  const draftCheckedRef = useRef(false) // 防止重复检查草稿

  // 获取草稿存储key
  const getDraftKey = () => id ? `${DRAFT_KEY_PREFIX}edit_${id}` : `${DRAFT_KEY_PREFIX}new`

  // 保存草稿到localStorage
  const saveDraft = (currentValues) => {
    // 获取所有表单字段值（包括两个Form组件的字段）
    const formValues = form.getFieldsValue(true)
    const values = currentValues ? { ...formValues, ...currentValues } : formValues

    // 只有有内容时才保存
    if (!values.title && !values.content && !values.summary) return

    const draftData = {
      ...values,
      publishTime: values.publishTime?.format?.('YYYY-MM-DD HH:mm:ss'),
      savedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      isEdit: !!id
    }
    localStorage.setItem(getDraftKey(), JSON.stringify(draftData))
    setDraftInfo({ savedAt: draftData.savedAt })
  }

  // 加载草稿
  const loadDraft = () => {
    try {
      const draftStr = localStorage.getItem(getDraftKey())
      if (draftStr) {
        return JSON.parse(draftStr)
      }
    } catch (e) {
      console.error('加载草稿失败', e)
    }
    return null
  }

  // 清除草稿
  const clearDraft = () => {
    localStorage.removeItem(getDraftKey())
    setDraftInfo(null)
    message.success('草稿已清除')
  }

  // 恢复草稿
  const restoreDraft = (draft) => {
    if (!draft) return

    const formValues = { ...draft }
    // 移除非表单字段
    delete formValues.savedAt
    delete formValues.isEdit

    if (draft.publishTime) {
      formValues.publishTime = dayjs(draft.publishTime, 'YYYY-MM-DD HH:mm:ss')
    }
    if (draft.tagValues) {
      // 确保tagValues是字符串数组
      formValues.tagValues = draft.tagValues.map(String)
    }
    form.setFieldsValue(formValues)
    setContentValue(draft.content || '')
    message.success('草稿已恢复')
  }

  useEffect(() => {
    // id 变化时重置状态
    draftCheckedRef.current = false
    isRemoteLoadedRef.current = false
    setDraftInfo(null)

    // 清空表单（新建文章时）
    if (!id) {
      form.resetFields()
      setContentValue('')
    }

    fetchCategories()
    fetchTags()
    if (id) {
      fetchArticle()
    } else {
      // 新建文章时检查本地草稿
      checkAndRestoreDraft()
    }
  }, [id])

  // 编辑文章加载完成后检查是否有更新的草稿
  useEffect(() => {
    if (id && isRemoteLoadedRef.current) {
      checkDraftAfterRemoteLoad()
    }
  }, [isRemoteLoadedRef.current])

  // 检查并恢复草稿（新建文章）
  const checkAndRestoreDraft = () => {
    if (draftCheckedRef.current) return
    draftCheckedRef.current = true

    const draft = loadDraft()
    if (draft && (draft.title || draft.content || draft.summary)) {
      setDraftInfo({ savedAt: draft.savedAt })
      restoreDraft(draft)
    }
  }

  // 编辑文章时检查草稿是否比服务器版本新
  const checkDraftAfterRemoteLoad = () => {
    if (draftCheckedRef.current) return
    draftCheckedRef.current = true

    const draft = loadDraft()
    if (!draft || !draft.savedAt) return

    const draftTime = dayjs(draft.savedAt)
    const serverTime = originalPublishTime ? dayjs(originalPublishTime) : dayjs()

    // 如果草稿比服务器版本新（差距大于1分钟，避免刚保存的情况）
    if (draftTime.isAfter(serverTime.subtract(1, 'minute'))) {
      setDraftInfo({ savedAt: draft.savedAt })
      restoreDraft(draft)
    }
  }

  // 监听表单内容变化
  const handleValuesChange = (changedValues, allValues) => {
    if ('content' in changedValues) {
      setContentValue(changedValues.content || '')
    }
    // 内容变化时立即保存草稿，传入所有表单值
    saveDraft(allValues)
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
      isRemoteLoadedRef.current = true
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 处理标签数据
      const { tagIds, newTags } = parseTagValues(values.tagValues)
      const submitData = { ...values, tagIds, newTags, id }
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

      // 成功后清除草稿
      clearDraft()
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
            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item name="title" rules={[{ required: true, message: '请输入标题' }]} style={{ flex: 7, marginBottom: 24 }}>
                <Input placeholder="请输入标题" size="large" />
              </Form.Item>
              <Form.Item style={{ flex: 3, marginBottom: 24 }}>
                <div style={{
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  background: '#f5f5f5',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  color: id ? '#1890ff' : '#8c8c8c',
                  cursor: id ? 'pointer' : 'default',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => {
                  if (id) {
                    const protocol = window.location.protocol
                    const host = window.location.host
                    window.open(`${protocol}//${host}/${id}`, '_blank')
                  }
                }}
                >
                  <LinkOutlined style={{ marginRight: 6, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {window.location.host}/{id || '{id}'}
                  </span>
                </div>
              </Form.Item>
            </div>

            <Form.Item name="content" rules={[{ required: true, message: '请输入内容' }]} className="content-editor-item">
              <MarkdownEditor height={600} placeholder="请输入Markdown内容，支持粘贴图片自动上传" />
            </Form.Item>
          </Form>
        </Card>
      </div>

      <div className="article-edit-sidebar">
        {/* 草稿状态提示 */}
        {draftInfo && (
          <Card size="small" className="sidebar-card draft-info-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                自动保存于 {draftInfo.savedAt}
              </span>
              <Tooltip title="清除本地草稿">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={clearDraft}
                  danger
                />
              </Tooltip>
            </div>
          </Card>
        )}

        <Card title="发布设置" className="sidebar-card">
          <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
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

            <Form.Item label="摘要" name="summary">
              <TextArea rows={1} placeholder="请输入摘要（可选）" />
            </Form.Item>

            <Form.Item>
              <Tooltip title={contentValue ? '根据文章内容自动生成摘要' : '请先填写文章内容'}>
                <Button
                  icon={<RobotOutlined />}
                  onClick={handleAiSummary}
                  loading={aiLoading}
                  disabled={!contentValue || contentValue.trim() === ''}
                  block
                >
                  AI生成摘要
                </Button>
              </Tooltip>
            </Form.Item>

            <Form.Item>
              <Space>
                <Form.Item name="isTop" valuePropName="checked" initialValue={false} noStyle>
                  <Switch /> 置顶
                </Form.Item>
                <Form.Item name="isRecommend" valuePropName="checked" initialValue={false} noStyle>
                  <Switch /> 推荐
                </Form.Item>
                <Popover
                  trigger="click"
                  placement="bottomRight"
                  content={
                    <div style={{ width: 240 }}>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ marginBottom: 6, fontWeight: 500 }}>公开度</div>
                        <Form.Item name="status" initialValue={1} noStyle>
                          <Radio.Group size="small" optionType="button" buttonStyle="solid">
                            <Radio.Button value={0}>待审</Radio.Button>
                            <Radio.Button value={1}>发布</Radio.Button>
                            <Radio.Button value={2}>加密</Radio.Button>
                            <Radio.Button value={3}>隐藏</Radio.Button>
                            <Radio.Button value={4}>私密</Radio.Button>
                          </Radio.Group>
                        </Form.Item>
                        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.status !== cur.status}>
                          {({ getFieldValue }) =>
                            getFieldValue('status') === 2 ? (
                              <Form.Item name="password" style={{ marginTop: 8, marginBottom: 0 }}>
                                <Input.Password placeholder="请输入访问密码" />
                              </Form.Item>
                            ) : null
                          }
                        </Form.Item>
                      </div>
                      <div>
                        <div style={{ marginBottom: 6, fontWeight: 500 }}>权限控制</div>
                        <Form.Item name="allowComment" valuePropName="checked" initialValue={true} noStyle>
                          <Switch /> 允许评论
                        </Form.Item>
                      </div>
                    </div>
                  }
                >
                  <Button type="text" icon={<SettingOutlined />}>高级</Button>
                </Popover>
              </Space>
            </Form.Item>

            <Form.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" loading={loading} block onClick={handleSubmit}>
                  {id ? '更新文章' : '发布文章'}
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
