import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getCategoryList, createCategory, updateCategory, deleteCategory } from '../../../api/category'

function CategoryList() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchList()
  }, [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await getCategoryList()
      setDataSource(res.data || [])
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
      await deleteCategory(id)
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
        await updateCategory({ ...values, id: editingId })
        message.success('更新成功')
      } else {
        await createCategory(values)
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
    { title: '分类名称', dataIndex: 'categoryName' },
    { title: '别名', dataIndex: 'categorySlug' },
    { title: '描述', dataIndex: 'description' },
    { title: '文章数', dataIndex: 'articleCount', width: 100 },
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
        <Button type="primary" onClick={handleAdd}>新增分类</Button>
      </div>

      <Table
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title={editingId ? '编辑分类' : '新增分类'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item label="分类名称" name="categoryName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="别名" name="categorySlug">
            <Input />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="排序" name="sortOrder" initialValue={0}>
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CategoryList
