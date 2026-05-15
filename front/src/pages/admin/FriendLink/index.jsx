import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Tag, Popconfirm, Space } from 'antd'
import { CheckOutlined, CloseOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getFriendLinkPage, createFriendLink, updateFriendLink, deleteFriendLink, auditFriendLink } from '../../../api/friendLink'

const statusMap = {
  0: { text: '待审核', color: 'orange' },
  1: { text: '正常', color: 'green' },
  2: { text: '失效', color: 'red' }
}

function FriendLinkList() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchList()
  }, [])

  const fetchList = async (page = 1, size = 10) => {
    setLoading(true)
    try {
      const res = await getFriendLinkPage({ page, size })
      setDataSource(res.data?.records || [])
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize: size,
        total: res.data?.total || 0
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleTableChange = (pagination) => {
    fetchList(pagination.current, pagination.pageSize)
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteFriendLink(id)
      message.success('删除成功')
      fetchList(pagination.current, pagination.pageSize)
    } catch (error) {
      // error handled
    }
  }

  const handleAudit = async (id, status) => {
    try {
      await auditFriendLink(id, status)
      message.success(status === 1 ? '已通过' : '已拒绝')
      fetchList(pagination.current, pagination.pageSize)
    } catch (error) {
      // error handled
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await updateFriendLink({ ...values, id: editingId })
        message.success('更新成功')
      } else {
        await createFriendLink(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchList(pagination.current, pagination.pageSize)
    } catch (error) {
      // error handled
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '网站名称',
      dataIndex: 'siteName',
      render: (text, record) => (
        <a href={record.siteUrl} target="_blank" rel="noopener noreferrer">{text}</a>
      )
    },
    {
      title: 'Logo',
      dataIndex: 'logo',
      width: 60,
      render: (url) => url ? <img src={url} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} /> : null
    },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '站长', dataIndex: 'ownerName', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status) => {
        const item = statusMap[status] || { text: '未知', color: 'default' }
        return <Tag color={item.color}>{item.text}</Tag>
      }
    },
    { title: '排序', dataIndex: 'sortOrder', width: 60 },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      width: 160,
      render: (time) => time ? new Date(time).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          {record.status === 0 && (
            <>
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleAudit(record.id, 1)}>通过</Button>
              <Button type="primary" size="small" danger icon={<CloseOutlined />} onClick={() => handleAudit(record.id, 2)}>拒绝</Button>
            </>
          )}
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
        <Button type="primary" onClick={handleAdd}>新增友链</Button>
      </div>

      <Table
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        pagination={{ ...pagination, showTotal: (total) => `共 ${total} 条` }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingId ? '编辑友链' : '新增友链'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item label="网站名称" name="siteName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="网站地址" name="siteUrl" rules={[{ required: true }, { pattern: /^https?:\/\/.*/, message: '请输入有效的网址' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="图标链接" name="logo" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="网站描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="站长名称" name="ownerName">
            <Input />
          </Form.Item>
          <Form.Item label="站长邮箱" name="ownerEmail">
            <Input />
          </Form.Item>
          <Form.Item label="状态" name="status" initialValue={1}>
            <Select>
              <Select.Option value={0}>待审核</Select.Option>
              <Select.Option value={1}>正常</Select.Option>
              <Select.Option value={2}>失效</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="排序" name="sortOrder" initialValue={0}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FriendLinkList
