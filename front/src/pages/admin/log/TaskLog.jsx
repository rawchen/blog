import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Descriptions, message, Tag, DatePicker, Input, Select } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { getTaskLogPage } from '../../../api/schedule'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const statusMap = {
  RUNNING: { color: 'processing', text: '运行中' },
  SUCCESS: { color: 'success', text: '成功' },
  FAILED: { color: 'error', text: '失败' },
  TIMEOUT: { color: 'warning', text: '超时' }
}

function TaskLog() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentLog, setCurrentLog] = useState(null)
  const [filters, setFilters] = useState({ jobId: '', jobName: '', status: '', startTime: '', endTime: '' })

  useEffect(() => {
    fetchList()
  }, [pagination.current])

  const fetchList = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        size: pagination.pageSize,
        ...filters
      }
      const res = await getTaskLogPage(params)
      setDataSource(res.data?.records || [])
      setPagination({ ...pagination, total: res.data?.total || 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    fetchList()
  }

  const handleViewDetail = (record) => {
    setCurrentLog(record)
    setDetailVisible(true)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '任务ID', dataIndex: 'jobId', width: 80 },
    { title: '任务名称', dataIndex: 'jobName', width: 150 },
    { title: '执行ID', dataIndex: 'executionId', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status) => {
        const config = statusMap[status] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '耗时',
      width: 100,
      render: (_, record) => {
        if (!record.startTime || !record.endTime) return '-'
        const start = dayjs(record.startTime)
        const end = dayjs(record.endTime)
        const diff = end.diff(start, 'second')
        if (diff < 60) return `${diff}秒`
        const minutes = Math.floor(diff / 60)
        const seconds = diff % 60
        return `${minutes}分${seconds}秒`
      }
    },
    {
      title: '结果',
      width: 300,
      dataIndex: 'resultMessage',
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Input
          placeholder="任务名称"
          value={filters.jobName}
          onChange={(e) => setFilters({ ...filters, jobName: e.target.value })}
          style={{ width: 150 }}
          allowClear
        />
        <Select
          placeholder="执行状态"
          value={filters.status || undefined}
          onChange={(value) => setFilters({ ...filters, status: value || '' })}
          style={{ width: 100 }}
          allowClear
          options={Object.entries(statusMap).map(([key, val]) => ({ value: key, label: val.text }))}
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
      </div>

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

      <Modal
        title="任务日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentLog && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="ID">{currentLog.id}</Descriptions.Item>
            <Descriptions.Item label="任务ID">{currentLog.jobId}</Descriptions.Item>
            <Descriptions.Item label="任务名称">{currentLog.jobName}</Descriptions.Item>
            <Descriptions.Item label="执行ID">{currentLog.executionId}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[currentLog.status]?.color || 'default'}>
                {statusMap[currentLog.status]?.text || currentLog.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="重试次数">{currentLog.retryCount || 0}</Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {currentLog.startTime ? dayjs(currentLog.startTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="结束时间">
              {currentLog.endTime ? dayjs(currentLog.endTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="结果信息" span={2}>{currentLog.resultMessage || '-'}</Descriptions.Item>
            <Descriptions.Item label="错误信息" span={2}>
              {currentLog.errorMessage ? <span style={{ color: '#ff4d4f' }}>{currentLog.errorMessage}</span> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {currentLog.createTime ? dayjs(currentLog.createTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default TaskLog