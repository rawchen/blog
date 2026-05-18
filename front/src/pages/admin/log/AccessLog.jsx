import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Descriptions, message, Popconfirm, Space, Tag, DatePicker, Input, Select } from 'antd'
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { getAccessLogList, getAccessLogById, deleteAccessLog, batchDeleteAccessLog, clearAccessLog } from '../../../api/log'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const operationMap = {
  HOME: { color: 'blue', text: '首页' },
  ARTICLE: { color: 'green', text: '文章' },
  PAGE: { color: 'geekblue', text: '独立页面' },
  CATEGORY: { color: 'orange', text: '分类' },
  TAG: { color: 'cyan', text: '标签' },
  MOMENTS: { color: 'magenta', text: '动态' },
  FRIENDS: { color: 'purple', text: '友链' },
  ARCHIVE: { color: 'gold', text: '归档' },
  SEARCH: { color: 'volcano', text: '搜索' }
}

function AccessLog() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentLog, setCurrentLog] = useState(null)
  const [filters, setFilters] = useState({ operation: '', ipAddress: '', startTime: '', endTime: '' })

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
      const res = await getAccessLogList(params)
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
      await deleteAccessLog(id)
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
      await batchDeleteAccessLog(selectedRowKeys)
      message.success('批量删除成功')
      setSelectedRowKeys([])
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const handleClear = async () => {
    try {
      await clearAccessLog(30)
      message.success('清理完成')
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const handleViewDetail = async (record) => {
    const res = await getAccessLogById(record.id)
    setCurrentLog(res.data)
    setDetailVisible(true)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '操作',
      dataIndex: 'operation',
      width: 90,
      render: (op) => {
        const config = operationMap[op] || { color: 'default', text: op }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    { title: '文章ID', dataIndex: 'articleId', width: 80 },
    { title: 'IP地址', dataIndex: 'ipAddress', width: 130 },
    { title: '归属地', dataIndex: 'location', width: 180, ellipsis: true },
    { title: '浏览器', dataIndex: 'browser', width: 100 },
    { title: '操作系统', dataIndex: 'os', width: 100 },
    {
      title: '机器人',
      dataIndex: 'isRobot',
      width: 80,
      render: (isRobot, record) => isRobot === 1 ? <Tag color="orange">{record.robot}</Tag> : '否'
    },
    {
      title: '访问时间',
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
          placeholder="IP地址"
          value={filters.ipAddress}
          onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
          style={{ width: 130 }}
          allowClear
        />
        <Select
          placeholder="操作类型"
          value={filters.operation || undefined}
          onChange={(value) => setFilters({ ...filters, operation: value || '' })}
          style={{ width: 110 }}
          allowClear
          options={Object.entries(operationMap).map(([key, val]) => ({ value: key, label: val.text }))}
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
        scroll={{ x: 1200 }}
      />

      <Modal
        title="访问日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentLog && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="ID">{currentLog.id}</Descriptions.Item>
            <Descriptions.Item label="操作">
              <Tag color={operationMap[currentLog.operation]?.color || 'default'}>
                {operationMap[currentLog.operation]?.text || currentLog.operation}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="文章ID">{currentLog.articleId}</Descriptions.Item>
            <Descriptions.Item label="状态">{currentLog.status === 1 ? '成功' : '失败'}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{currentLog.ipAddress}</Descriptions.Item>
            <Descriptions.Item label="归属地">{currentLog.location}</Descriptions.Item>
            <Descriptions.Item label="国家">{currentLog.country}</Descriptions.Item>
            <Descriptions.Item label="省份">{currentLog.province}</Descriptions.Item>
            <Descriptions.Item label="城市">{currentLog.city}</Descriptions.Item>
            <Descriptions.Item label="运营商">{currentLog.isp}</Descriptions.Item>
            <Descriptions.Item label="浏览器">{currentLog.browser} {currentLog.browserVersion}</Descriptions.Item>
            <Descriptions.Item label="操作系统">{currentLog.os} {currentLog.osVersion}</Descriptions.Item>
            <Descriptions.Item label="是否机器人">{currentLog.isRobot === 1 ? <Tag color="orange">{currentLog.robot}</Tag> : '否'}</Descriptions.Item>
            <Descriptions.Item label="机器人版本">{currentLog.robotVersion}</Descriptions.Item>
            <Descriptions.Item label="相对链接">{currentLog.relativeUrl}</Descriptions.Item>
            <Descriptions.Item label="查询参数">{currentLog.queryString}</Descriptions.Item>
            <Descriptions.Item label="来源">{currentLog.referer}</Descriptions.Item>
            <Descriptions.Item label="来源域名">{currentLog.refererDomain}</Descriptions.Item>
            <Descriptions.Item label="错误消息" span={2}>{currentLog.errorMsg}</Descriptions.Item>
            <Descriptions.Item label="访问时间" span={2}>
              {currentLog.createTime ? dayjs(currentLog.createTime).format('YYYY-MM-DD HH:mm:ss') : ''}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default AccessLog