import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, message, Popconfirm } from 'antd'
import { getCommentListAdmin, auditComment, deleteComment } from '../../../api/comment'

function CommentList() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    fetchList()
  }, [pagination.current])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await getCommentListAdmin({ current: pagination.current, size: pagination.pageSize })
      setDataSource(res.data.records || [])
      setPagination({ ...pagination, total: res.data.total })
    } finally {
      setLoading(false)
    }
  }

  const handleAudit = async (id, status) => {
    try {
      await auditComment(id, status)
      message.success('审核成功')
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteComment(id)
      message.success('删除成功')
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '昵称', dataIndex: 'nickname', width: 120 },
    { title: '邮箱', dataIndex: 'email', width: 180 },
    { title: '内容', dataIndex: 'content', ellipsis: true },
    { title: 'IP', dataIndex: 'ipAddress', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const statusMap = { 0: '待审核', 1: '已发布', 2: '垃圾评论' }
        const colorMap = { 0: 'warning', 1: 'success', 2: 'error' }
        return <Tag color={colorMap[status]}>{statusMap[status]}</Tag>
      }
    },
    { title: '时间', dataIndex: 'createTime', width: 180 },
    {
      title: '操作',
      width: 200,
      render: (_, record) => (
        <>
          {record.status === 0 && (
            <>
              <Button type="link" onClick={() => handleAudit(record.id, 1)}>通过</Button>
              <Button type="link" danger onClick={() => handleAudit(record.id, 2)}>拒绝</Button>
            </>
          )}
          <Popconfirm title="确定要删除吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </>
      )
    }
  ]

  return (
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
  )
}

export default CommentList
