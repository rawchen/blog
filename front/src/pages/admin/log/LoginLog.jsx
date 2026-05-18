import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Descriptions, message, Popconfirm, Space, Tag, DatePicker, Input } from 'antd'
import { DeleteOutlined, EyeOutlined, ClearOutlined } from '@ant-design/icons'
import { getLoginLogList, deleteLoginLog, batchDeleteLoginLog } from '../../../api/log'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const operationTypeMap = {
  LOGIN: { color: 'green', text: '登录' },
  LOGOUT: { color: 'orange', text: '登出' }
}

function LoginLog() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentLog, setCurrentLog] = useState(null)
  const [filters, setFilters] = useState({ username: '', startTime: '', endTime: '' })

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
      const res = await getLoginLogList(params)
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
      await deleteLoginLog(id)
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
      await batchDeleteLoginLog(selectedRowKeys)
      message.success('批量删除成功')
      setSelectedRowKeys([])
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const handleViewDetail = (record) => {
    setCurrentLog(record)
    setDetailVisible(true)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    {
      title: '操作类型',
      dataIndex: 'operationType',
      width: 100,
      render: (type) => {
        const config = operationTypeMap[type] || { color: 'default', text: type }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    { title: 'IP地址', dataIndex: 'ipAddress', width: 140 },
    { title: '归属地', dataIndex: 'location', width: 200, ellipsis: true },
    {
      title: '操作时间',
      dataIndex: 'createTime',
      width: 180,
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
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <Input
          placeholder="用户名"
          value={filters.username}
          onChange={(e) => setFilters({ ...filters, username: e.target.value })}
          style={{ width: 150 }}
          allowClear
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
        width={600}
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
            <Descriptions.Item label="IP地址">{currentLog.ipAddress}</Descriptions.Item>
            <Descriptions.Item label="归属地">{currentLog.location}</Descriptions.Item>
            <Descriptions.Item label="国家">{currentLog.country}</Descriptions.Item>
            <Descriptions.Item label="省份">{currentLog.province}</Descriptions.Item>
            <Descriptions.Item label="城市">{currentLog.city}</Descriptions.Item>
            <Descriptions.Item label="运营商">{currentLog.isp}</Descriptions.Item>
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

export default LoginLog