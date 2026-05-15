import React, { useState, useEffect, useRef } from 'react'
import { Table, Button, Space, Tag, message, Popconfirm, Switch, Image, Tooltip, Input, Select, DatePicker, Row, Col, Card } from 'antd'
import { ExportOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { getArticleListAdmin, deleteArticle, updateTopStatus, updateRecommendStatus } from '../../../api/article'
import { dateWord } from '../../../utils/datetime'

const { RangePicker } = DatePicker

const statusOptions = [
  { value: 0, label: '草稿' },
  { value: 1, label: '已发布' },
  { value: 2, label: '回收站' },
  { value: 3, label: '隐藏' },
  { value: 4, label: '待审核' }
]

function ArticleList() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  // 筛选条件
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState(undefined)
  const [dateRange, setDateRange] = useState(null)
  const searchTimerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchList()
  }, [pagination.current, pagination.pageSize])

  // 标题搜索防抖
  const handleKeywordChange = (e) => {
    const value = e.target.value
    setKeyword(value)
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
    searchTimerRef.current = setTimeout(() => {
      setPagination(prev => ({ ...prev, current: 1 }))
      fetchListWithParams(1, pagination.pageSize, value, status, dateRange)
    }, 300)
  }

  // 状态筛选
  const handleStatusChange = (value) => {
    setStatus(value)
    setPagination(prev => ({ ...prev, current: 1 }))
    fetchListWithParams(1, pagination.pageSize, keyword, value, dateRange)
  }

  // 时间范围筛选
  const handleDateRangeChange = (dates) => {
    setDateRange(dates)
    setPagination(prev => ({ ...prev, current: 1 }))
    fetchListWithParams(1, pagination.pageSize, keyword, status, dates)
  }

  const fetchList = () => {
    fetchListWithParams(pagination.current, pagination.pageSize, keyword, status, dateRange)
  }

  const fetchListWithParams = async (current, size, kw, st, dr) => {
    setLoading(true)
    try {
      const params = { current, size }
      if (kw) params.keyword = kw
      if (st !== undefined && st !== null) params.status = st
      if (dr && dr[0] && dr[1]) {
        params.startTime = dr[0].format('YYYY-MM-DD')
        params.endTime = dr[1].format('YYYY-MM-DD')
      }
      const res = await getArticleListAdmin(params)
      setDataSource(res.data.records)
      setPagination(prev => ({ ...prev, current, total: res.data.total }))
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

  const handleTopChange = async (id, checked) => {
    try {
      await updateTopStatus(id, checked ? 1 : 0)
      message.success('更新成功')
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const handleRecommendChange = async (id, checked) => {
    try {
      await updateRecommendStatus(id, checked ? 1 : 0)
      message.success('更新成功')
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const columns = [
    {
      title: '序号',
      width: 60,
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1
    },
    {
      title: '封面',
      dataIndex: 'coverImage',
      width: 100,
      render: (url) => url ? (
        <Image
          src={url}
          alt="封面"
          width={60}
          height={40}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAADbSURBVHhe7doxTsNAEIXhJYWvQEEBBQfgBNYWoKeA2gtgewHoCFgLoHUB2AugvQDqBej1BTQNTMrZKJJYsmNvuT9nZt55nZ3JDCMAAAAAAAAA+1FPPWbf5eN5e9X3+2r5rP8qr+6jvrHhu6bfWH/dd/1R2yZ+b/+q7/qjNq2rqM8a+Lfsq76hXm9NP9Y2TX9Vf9R3vVEf1rb19LdaYX8Nf9Y3dX8tf6yvHj+qa5q+qj+qa5q+qj+qW/7Z2j5eP9V3P+ub5u+qj+qa5q+qj+qa5q+qj+qa5q+qj+qa5q+qj+qa5q+qj+qa5q+qj+qa5q+qj+qa5q+qj+qa5q+qj8AAAAAAAAAwAdfAOKnQXdL0by9AAAAAElFTkSuQmCC"
        />
      ) : null
    },
    { title: '标题', dataIndex: 'title', width: 200 },
    { title: '分类', dataIndex: 'categoryName', width: 100 },
    { title: '浏览量', dataIndex: 'viewCount', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 50,
      render: (status) => {
        const statusMap = { 0: '草稿', 1: '已发布', 2: '回收站', 3: '隐藏', 4: '待审核' }
        const colorMap = { 0: 'default', 1: 'success', 2: 'error', 3: 'warning', 4: 'processing' }
        return <Tag color={colorMap[status]}>{statusMap[status]}</Tag>
      }
    },
    {
      title: '置顶',
      dataIndex: 'isTop',
      width: 50,
      render: (isTop, record) => (
        <Switch
          checked={isTop === 1}
          onChange={(checked) => handleTopChange(record.id, checked)}
        />
      )
    },
    {
      title: '推荐',
      dataIndex: 'isRecommend',
      width: 70,
      render: (isRecommend, record) => (
        <Switch
          checked={isRecommend === 1}
          onChange={(checked) => handleRecommendChange(record.id, checked)}
        />
      )
    },
    { title: '创建时间', dataIndex: 'createTime', width: 100, render: (time) => dateWord(time) },
    {
      title: '操作',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="在新窗口查看文章">
            <Button
              type="primary"
              size="small"
              icon={<ExportOutlined />}
              onClick={() => window.open(`/${record.id}`, '_blank')}
            />
          </Tooltip>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => navigate(`/admin/article/edit/${record.id}`)}>
            编辑
          </Button>
          <Popconfirm title="确定要删除吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="primary" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="article-list">
      <style>{`
        .article-list .ant-table-tbody > tr > td {
          padding: 8px 16px;
        }
        .article-list .ant-table-thead > tr > th {
          padding: 8px 16px;
        }
        .filter-card {
          margin-bottom: 16px;
        }
        .filter-card .ant-input,
        .filter-card .ant-select {
          width: 100%;
        }
      `}</style>
      <Card className="filter-card" size="small">
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="搜索标题"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={handleKeywordChange}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态筛选"
              options={statusOptions}
              value={status}
              onChange={handleStatusChange}
              allowClear
            />
          </Col>
          <Col span={8}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={dateRange}
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
      </Card>
      <Table
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          ...pagination,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize })
        }}
      />
    </div>
  )
}

export default ArticleList
