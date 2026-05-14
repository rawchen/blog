import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space, Select, InputNumber, Switch } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { getPageListAdmin, createPage, updatePage, deletePage } from '../../../api/article'

// 模板选项
const templateOptions = [
  { value: '', label: '默认模板（Markdown内容）' },
  { value: 'search', label: '搜索模板' },
  { value: 'archive', label: '分类模板' },
  { value: 'friends', label: '友链模板' },
  { value: 'moments', label: '朋友圈模板' }
]

function PageList() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchList()
  }, [pagination.current])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await getPageListAdmin({ current: pagination.current, size: pagination.pageSize })
      setDataSource(res.data.records || [])
      setPagination({ ...pagination, total: res.data.total })
    } catch (error) {
      console.error('加载页面列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ status: 1, allowComment: true, sortOrder: 0, template: '' })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue({
      title: record.title,
      slug: record.slug,
      summary: record.summary,
      content: record.content,
      template: record.template || '',
      sortOrder: record.sortOrder || 0,
      status: record.status,
      allowComment: record.allowComment === 1
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deletePage(id)
      message.success('删除成功')
      fetchList()
    } catch (error) {
      console.error('删除失败', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        allowComment: values.allowComment ? 1 : 0
      }

      if (editingId) {
        await updatePage({ ...data, id: editingId })
        message.success('更新成功')
      } else {
        await createPage(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchList()
    } catch (error) {
      console.error('保存失败', error)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', width: 150 },
    { title: '别名', dataIndex: 'slug', width: 120 },
    {
      title: '模板',
      dataIndex: 'template',
      width: 120,
      render: (template) => {
        const option = templateOptions.find(opt => opt.value === template)
        return option ? option.label.split('（')[0] : '默认'
      }
    },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status) => (
        <span style={{ color: status === 1 ? '#52c41a' : '#999' }}>
          {status === 1 ? '已发布' : '草稿'}
        </span>
      )
    },
    { title: '浏览量', dataIndex: 'viewCount', width: 80 },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定要删除吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="primary" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增页面</Button>
      </div>

      <Table
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        pagination={{
          ...pagination,
          onChange: (page) => setPagination({ ...pagination, current: page })
        }}
      />

      <Modal
        title={editingId ? '编辑页面' : '新增页面'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="页面标题" maxLength={100} />
          </Form.Item>
          <Form.Item
            label="别名"
            name="slug"
            rules={[
              { required: true, message: '请输入别名' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '别名只能包含字母、数字、下划线和中划线' }
            ]}
          >
            <Input placeholder="用于URL访问，如: about, friends" maxLength={50} />
          </Form.Item>
          <Form.Item label="摘要" name="summary">
            <Input.TextArea rows={2} placeholder="页面摘要（选填）" maxLength={200} />
          </Form.Item>
          <Form.Item label="模板" name="template">
            <Select options={templateOptions} placeholder="选择页面模板" />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder">
            <InputNumber min={0} placeholder="数字越小越靠前" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="内容" name="content">
            <Input.TextArea rows={6} placeholder="Markdown内容（使用默认模板时显示）" />
          </Form.Item>
          <Form.Item label="允许评论" name="allowComment" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select>
              <Select.Option value={0}>草稿</Select.Option>
              <Select.Option value={1}>发布</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PageList
