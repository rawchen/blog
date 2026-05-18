import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Descriptions, message, Popconfirm, Space, Tag, DatePicker, Input, Select } from 'antd'
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { getOperationLogList, getOperationLogById, deleteOperationLog, batchDeleteOperationLog, clearOperationLog } from '../../../api/log'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const operationTypeMap = {
  CREATE: { color: 'green', text: '创建' },
  UPDATE: { color: 'blue', text: '更新' },
  DELETE: { color: 'red', text: '删除' },
  AUDIT: { color: 'orange', text: '审核' },
  RESET: { color: 'purple', text: '重置' },
  OTHER: { color: 'default', text: '其他' }
}

const targetTypeMap = {
  ARTICLE: { color: 'cyan', text: '文章' },
  PAGE: { color: 'geekblue', text: '独立页面' },
  CATEGORY: { color: 'orange', text: '分类' },
  TAG: { color: 'blue', text: '标签' },
  COMMENT: { color: 'volcano', text: '评论' },
  FRIEND: { color: 'green', text: '友链' },
  USER: { color: 'purple', text: '用户' },
  MOMENT: { color: 'magenta', text: '动态' },
  CONFIG: { color: 'gold', text: '配置' },
  OTHER: { color: 'default', text: '其他' }
}

function OperationLog() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentLog, setCurrentLog] = useState(null)
  const [filters, setFilters] = useState({ operationType: '', targetType: '', username: '', startTime: '', endTime: '' })

  useEffect(() => {
    fetchList()
  }, [pagination.current])

  const fetchList = async () => {
    setLoading(true)
    try {
      const params = {
        current: pagination.current,
        size: pagination.pageSize,
        ...filters
      }
      const res = await getOperationLogList(params)
      setDataSource(res.data.records || [])
      setPagination({ ...pagination, total: res.data.total })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchList()
  }

  const handleDelete = async (id) => {
    try {
      await deleteOperationLog(id)
      message.success('删除成功')
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的日志')
      return
    }
    try {
      await batchDeleteOperationLog(selectedRowKeys)
      message.success('批量删除成功')
      setSelectedRowKeys([])
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const handleClear = async () => {
    try {
      await clearOperationLog(30)
      message.success('清理完成')
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const handleViewDetail = async (record) => {
    const res = await getOperationLogById(record.id)
    setCurrentLog(res.data)
    setDetailVisible(true)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username', width: 100 },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      width: 80,
      render: (type) => {
        const config = operationTypeMap[type] || { color: 'default', text: type }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      width: 90,
      render: (type) => {
        const config = targetTypeMap[type] || { color: 'default', text: type }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    { title: '目标ID', dataIndex: 'targetId', width: 80 },
    { title: 'IP地址', dataIndex: 'ipAddress', width: 130 },
    { title: '归属地', dataIndex: 'location', width: 180, ellipsis: true },
    {
      title: '操作时间',
      dataIndex: 'createTime',
      width: 160,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : ''
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Popconfirm title="确定要删除吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="primary" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Input
          placeholder="用户名"
          value={filters.username}
          onChange={(e) => setFilters({ ...filters, username: e.target.value })}
          style={{ width: 120 }}
          allowClear
        />
        <Select
          placeholder="操作类型"
          value={filters.operationType || undefined}
          onChange={(value) => setFilters({ ...filters, operationType: value || '' })}
          style={{ width: 100 }}
          allowClear
          options={Object.entries(operationTypeMap).map(([key, val]) => ({ value: key, label: val.text }))}
        />
        <Select
          placeholder="目标类型"
          value={filters.targetType || undefined}
          onChange={(value) => setFilters({ ...filters, targetType: value || '' })}
          style={{ width: 110 }}
          allowClear
          options={Object.entries(targetTypeMap).map(([key, val]) => ({ value: key, label: val.text }))}
        />
        <RangePicker
          placeholder={['开始时间', '结束时间']}
          format="YYYY-MM-DD HH:mm:ss"
          showTime
          onChange={(dates) => {
            if (dates) {
              setFilters({
                ...filters,
                startTime: dates[0].format('YYYY-MM-DD HH:mm:ss'),
                endTime: dates[1].format('YYYY-MM-DD HH:mm:ss')
              })
            } else {
              setFilters({ ...filters, startTime: '', endTime: '' })
            }
          }}
        />
        <Button type="primary" onClick={handleSearch}>搜索</Button>
        <Popconfirm title="确定要批量删除选中的日志吗?" onConfirm={handleBatchDelete}>
          <Button type="primary" danger disabled={selectedRowKeys.length === 0}>批量删除</Button>
        </Popconfirm>
        <Popconfirm title="确定要清理30天前的日志吗?" onConfirm={handleClear}>
          <Button danger>清理日志</Button>
        </Popconfirm>
      </div>

      <Table
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys
        }}
        pagination={{
          ...pagination,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page) => setPagination({ ...pagination, current: page })
        }}
      />

      <Modal
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentLog && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="ID">{currentLog.id}</Descriptions.Item>
            <Descriptions.Item label="用户名">{currentLog.username}</Descriptions.Item>
            <Descriptions.Item label="用户ID">{currentLog.userId}</Descriptions.Item>
            <Descriptions.Item label="操作类型">
              <Tag color={operationTypeMap[currentLog.operationType]?.color || 'default'}>
                {operationTypeMap[currentLog.operationType]?.text || currentLog.operationType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="目标类型">
              <Tag color={targetTypeMap[currentLog.targetType]?.color || 'default'}>
                {targetTypeMap[currentLog.targetType]?.text || currentLog.targetType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="目标ID">{currentLog.targetId}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{currentLog.ipAddress}</Descriptions.Item>
            <Descriptions.Item label="归属地">{currentLog.location}</Descriptions.Item>
            <Descriptions.Item label="国家">{currentLog.country}</Descriptions.Item>
            <Descriptions.Item label="省份">{currentLog.province}</Descriptions.Item>
            <Descriptions.Item label="城市">{currentLog.city}</Descriptions.Item>
            <Descriptions.Item label="运营商">{currentLog.isp}</Descriptions.Item>
            <Descriptions.Item label="操作详情" span={2}>{currentLog.detail}</Descriptions.Item>
            <Descriptions.Item label="UserAgent" span={2}>{currentLog.userAgent}</Descriptions.Item>
            <Descriptions.Item label="操作时间" span={2}>
              {currentLog.createTime ? dayjs(currentLog.createTime).format('YYYY-MM-DD HH:mm:ss') : ''}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default OperationLog