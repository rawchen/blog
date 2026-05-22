import React, { useState, useEffect } from 'react'
import {Table, Button, Tag, message, Popconfirm, Space, Popover, Tooltip} from 'antd'
import {CheckOutlined, CloseOutlined, DeleteOutlined, ExportOutlined} from '@ant-design/icons'
import { getCommentListAdmin, auditComment, deleteComment, getIpRegion } from '../../../api/comment'
import { renderSmilies } from '../../../utils/smilies'

function CommentList() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [ipRegionMap, setIpRegionMap] = useState({})

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

  const handleIpClick = async (ip) => {
    if (ipRegionMap[ip]) return
    try {
      const res = await getIpRegion(ip)
      setIpRegionMap(prev => ({ ...prev, [ip]: res.data }))
    } catch {
      setIpRegionMap(prev => ({ ...prev, [ip]: '查询失败' }))
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '昵称', dataIndex: 'nickname', width: 120 },
    { title: '邮箱', dataIndex: 'email', width: 180 },
    { title: '内容', dataIndex: 'content', ellipsis: true, render: (text) => <span dangerouslySetInnerHTML={{ __html: renderSmilies(text) }} /> },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      width: 150,
      render: (ip) => (
        <Popover content={ipRegionMap[ip] || '点击查询...'} trigger="click" onOpenChange={(open) => open && handleIpClick(ip)}>
          <a style={{ cursor: 'pointer' }}>{ip}</a>
        </Popover>
      )
    },
    {
      title: '链接',
      width: 200,
      render: (_, record) => {
        const path = record.articleSlug || record.articleId
        return (
          <a href={`/${path}#comment-${record.id}`} target="_blank" rel="noopener noreferrer">
            /{path}#comment-{record.id}
          </a>
        )
      }
    },
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
    { title: '创建时间', dataIndex: 'createTime', width: 180 },
    {
      title: '操作',
      width: 220,
      render: (_, record) => {
        const path = record.articleSlug || record.articleId
        return (
          <Space>
            <Tooltip title="查看评论">
              <Button type="primary" size="small" icon={<ExportOutlined />} onClick={() => window.open(`/${path}#comment-${record.id}`, '_blank')} />
            </Tooltip>
            {record.status === 0 && (
            <>
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleAudit(record.id, 1)}>通过</Button>
              <Button type="primary" size="small" danger icon={<CloseOutlined />} onClick={() => handleAudit(record.id, 2)}>拒绝</Button>
            </>
          )}
          <Popconfirm title="确定要删除吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="primary" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
        )
      }
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
        showTotal: (total) => `共 ${total} 条`,
        onChange: (page) => setPagination({ ...pagination, current: page })
      }}
    />
  )
}

export default CommentList
