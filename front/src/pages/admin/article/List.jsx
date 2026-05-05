import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, message, Popconfirm } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getArticleListAdmin, deleteArticle } from '../../../api/article'

function ArticleList() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchList()
  }, [pagination.current, pagination.pageSize])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await getArticleListAdmin({
        current: pagination.current,
        size: pagination.pageSize
      })
      setDataSource(res.data.records)
      setPagination({ ...pagination, total: res.data.total })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteArticle(id)
      message.success('删除成功')
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', width: 200 },
    { title: '分类', dataIndex: 'categoryName', width: 120 },
    { title: '浏览量', dataIndex: 'viewCount', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const statusMap = { 0: '草稿', 1: '已发布', 2: '回收站' }
        const colorMap = { 0: 'default', 1: 'success', 2: 'error' }
        return <Tag color={colorMap[status]}>{statusMap[status]}</Tag>
      }
    },
    { title: '创建时间', dataIndex: 'createTime', width: 180 },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/admin/article/edit/${record.id}`)}>
            编辑
          </Button>
          <Popconfirm title="确定要删除吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => navigate('/admin/article/add')}>
          新增文章
        </Button>
      </div>
      <Table
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        pagination={{
          ...pagination,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize })
        }}
      />
    </div>
  )
}

export default ArticleList
