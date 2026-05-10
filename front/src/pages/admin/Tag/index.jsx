import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Popconfirm, Tag } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getTagListAdmin, createTag, updateTag, deleteTag } from '../../../api/tag'

function TagList() {
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
      const res = await getTagListAdmin({ current: pagination.current, size: pagination.pageSize })
      setDataSource(res.data.records || [])
      setPagination({ ...pagination, total: res.data.total })
    } finally {
      setLoading(false)
    }
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
      await deleteTag(id)
      message.success('删除成功')
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await updateTag({ ...values, id: editingId })
        message.success('更新成功')
      } else {
        await createTag(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '标签名称', dataIndex: 'tagName' },
    { title: '别名', dataIndex: 'tagSlug' },
    { title: '描述', dataIndex: 'description' },
    { title: '文章数', dataIndex: 'articleCount', width: 100 },
    {
      title: '颜色',
      dataIndex: 'color',
      width: 100,
      render: (color) => color && <Tag color={color}>{color}</Tag>
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定要删除吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="primary" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>新增标签</Button>
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
        title={editingId ? '编辑标签' : '新增标签'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item label="标签名称" name="tagName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="别名" name="tagSlug">
            <Input />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="颜色" name="color">
            <Input type="color" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TagList
