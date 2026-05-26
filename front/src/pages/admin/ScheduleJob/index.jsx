import React, { useState, useEffect } from 'react'
import {
  Table, Button, Modal, Form, Input, Select, InputNumber, message,
  Tag, Space, Popconfirm, Drawer, DatePicker, Tooltip
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CaretRightOutlined,
  EyeOutlined, PauseOutlined, SettingOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getJobPage, createJob, updateJob, deleteJob, triggerJob, updateJobStatus, getJobLogs, getHandlers, getHandlerDetail } from '../../../api/schedule'
import CronDialog from '../../../components/CronDialog'

// 处理器名称映射
const handlerLabels = {
  // 'publishArticle': '定时发布文章',
  // 'generateSitemap': '生成sitemap',
  // 'refreshCache': '刷新首页缓存',
  // 'cleanTempFiles': '清理临时文件',
  // 'statistics': '统计文章浏览量',
  // 'backupDatabase': '备份数据库',
  // 'sendNotification': '发送通知邮件',
  // 'checkSpamComment': '检查垃圾评论',
  // 'syncSearchIndex': '同步搜索索引',
  // 'generateStaticPage': '生成静态页面',
}

const statusColors = { 1: 'success', 0: 'error' }
const statusLabels = { 1: '启用', 0: '禁用' }
const logStatusColors = { RUNNING: 'processing', SUCCESS: 'success', FAILED: 'error', TIMEOUT: 'warning' }

function ScheduleJob() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()
  const [selectedJobType, setSelectedJobType] = useState('CRON')
  const [cronDialogVisible, setCronDialogVisible] = useState(false)
  const [logsVisible, setLogsVisible] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [executingJobIds, setExecutingJobIds] = useState(new Set())
  const [handlers, setHandlers] = useState({})
  const [handlerParams, setHandlerParams] = useState([])

  // 筛选条件
  const [filterJobName, setFilterJobName] = useState('')
  const [filterJobType, setFilterJobType] = useState(undefined)
  const [filterEnabled, setFilterEnabled] = useState(undefined)

  useEffect(() => {
    fetchList()
    fetchHandlers()
  }, [filterJobName, filterJobType, filterEnabled])

  const fetchHandlers = async () => {
    try {
      const res = await getHandlers()
      if (res.data) {
        setHandlers(res.data)
      }
    } catch (error) {
      // 使用默认映射
    }
  }

  // 获取处理器参数定义
  const fetchHandlerParams = async (handlerName) => {
    if (!handlerName) {
      setHandlerParams([])
      return
    }
    try {
      const res = await getHandlerDetail(handlerName)
      if (res.data && res.data.params) {
        setHandlerParams(res.data.params)
      } else {
        setHandlerParams([])
      }
    } catch (error) {
      setHandlerParams([])
    }
  }

  const fetchList = async (page = 1, size = 10) => {
    setLoading(true)
    try {
      const res = await getJobPage({
        page, size,
        jobName: filterJobName || undefined,
        jobType: filterJobType,
        enabled: filterEnabled,
      })
      setDataSource(res.data?.records || [])
      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize: size,
        total: res.data?.total || 0
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleTableChange = (pag) => {
    fetchList(pag.current, pag.pageSize)
  }

  const handleAdd = () => {
    setEditingId(null)
    setSelectedJobType('CRON')
    setHandlerParams([])
    form.resetFields()
    form.setFieldsValue({ jobType: 'CRON', retryCount: 0, timeoutSeconds: 300, enabled: 1 })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    setSelectedJobType(record.jobType)
    // 解析已有参数
    if (record.handlerParams) {
      try {
        const params = JSON.parse(record.handlerParams)
        // 设置参数值到表单
        Object.keys(params).forEach(key => {
          form.setFieldsValue({ [`param_${key}`]: params[key] })
        })
      } catch (e) {}
    }
    fetchHandlerParams(record.handlerName)
    form.setFieldsValue({
      ...record,
      executeTime: record.executeTime ? dayjs(record.executeTime) : null
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteJob(id)
      message.success('删除成功')
      fetchList(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleTrigger = async (id) => {
    setExecutingJobIds(prev => new Set(prev).add(id))
    try {
      await triggerJob(id)
      message.success('触发成功，正在执行...')

      // 轮询检查执行状态（最多轮询30次，每次2秒，共60秒）
      let pollCount = 0
      const maxPollCount = 30
      const pollInterval = setInterval(async () => {
        pollCount++
        try {
          const res = await getJobLogs(id, { page: 1, size: 1 })
          const latestLog = res.data?.records?.[0]

          if (latestLog && latestLog.status !== 'RUNNING') {
            clearInterval(pollInterval)
            setExecutingJobIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(id)
              return newSet
            })
            fetchList(pagination.current, pagination.pageSize)

            if (latestLog.status === 'SUCCESS') {
              message.success('执行成功')
            } else if (latestLog.status === 'FAILED') {
              message.error('执行失败: ' + (latestLog.errorMessage || latestLog.resultMessage || '未知错误'))
            } else if (latestLog.status === 'TIMEOUT') {
              message.warning('执行超时')
            }
          } else if (pollCount >= maxPollCount) {
            clearInterval(pollInterval)
            setExecutingJobIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(id)
              return newSet
            })
            fetchList(pagination.current, pagination.pageSize)
            message.info('执行时间较长，请稍后查看日志')
          }
        } catch (error) {
          console.error('轮询失败:', error)
        }
      }, 2000)

    } catch (error) {
      message.error('触发失败')
      setExecutingJobIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleStatusChange = async (id, enabled) => {
    try {
      await updateJobStatus(id, enabled)
      message.success(enabled === 1 ? '已启用' : '已禁用')
      fetchList(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleViewLogs = async (job) => {
    setSelectedJob(job)
    setLogsVisible(true)
    setLogsLoading(true)
    try {
      const res = await getJobLogs(job.id, { page: 1, size: 20 })
      setLogs(res.data?.records || [])
    } catch (error) {
      message.error('获取日志失败')
    } finally {
      setLogsLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (values.executeTime) {
        values.executeTime = values.executeTime.format('YYYY-MM-DD HH:mm:ss')
      }
      // 构建处理器参数JSON
      if (handlerParams.length > 0) {
        const paramsObj = {}
        handlerParams.forEach(param => {
          const key = `param_${param.name}`
          if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
            paramsObj[param.name] = values[key]
          }
        })
        values.handlerParams = Object.keys(paramsObj).length > 0 ? JSON.stringify(paramsObj) : null
        // 清理临时字段
        handlerParams.forEach(param => {
          delete values[`param_${param.name}`]
        })
      }
      if (editingId) {
        await updateJob({ ...values, id: editingId })
        message.success('更新成功')
      } else {
        await createJob(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchList(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error(editingId ? '更新失败' : '创建失败')
    }
  }

  const getHandlerLabel = (name) => handlers[name] || handlerLabels[name] || name || '-'

  const columns = [
    { title: '任务ID', dataIndex: 'id', width: 80 },
    { title: '任务名称', dataIndex: 'jobName' },
    {
      title: '任务类型', dataIndex: 'jobType', width: 100,
      render: (type) => <Tag color={type === 'CRON' ? 'blue' : 'purple'}>{type === 'CRON' ? 'CRON' : '一次性'}</Tag>
    },
    {
      title: '处理器', dataIndex: 'handlerName', width: 140,
      render: (name) => <Tag color="cyan">{getHandlerLabel(name)}</Tag>
    },
    {
      title: '调度信息', width: 150,
      render: (_, record) => {
        if (record.jobType === 'CRON') {
          return <Tag color="blue">{record.cronExpression || '-'}</Tag>
        }
        return <Tag color="purple">{record.executeTime ? dayjs(record.executeTime).format('YYYY-MM-DD HH:mm') : '-'}</Tag>
      }
    },
    {
      title: '状态', dataIndex: 'enabled', width: 80,
      render: (enabled) => <Tag color={statusColors[enabled]}>{statusLabels[enabled]}</Tag>
    },
    {
      title: '最后执行', dataIndex: 'lastRunTime', width: 200,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '操作', width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<CaretRightOutlined />}
            onClick={() => handleTrigger(record.id)}
            loading={executingJobIds.has(record.id)}
            disabled={executingJobIds.has(record.id)}>触发</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewLogs(record)}>日志</Button>
          <Button type="link" size="small"
            icon={record.enabled === 1 ? <PauseOutlined /> : <CaretRightOutlined />}
            onClick={() => handleStatusChange(record.id, record.enabled === 1 ? 0 : 1)}>
            {record.enabled === 1 ? '禁用' : '启用'}
          </Button>
        </Space>
      )
    }
  ]

  const logColumns = [
    { title: '执行ID', dataIndex: 'executionId', width: 120 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (status) => <Tag color={logStatusColors[status]}>{status}</Tag>
    },
    {
      title: '开始时间', dataIndex: 'startTime', width: 130,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '结束时间', dataIndex: 'endTime', width: 130,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '耗时', dataIndex: 'duration', width: 100,
      render: (duration, record) => {
        let seconds = duration
        if (!seconds && record.startTime && record.endTime) {
          seconds = Math.floor(dayjs(record.endTime).diff(dayjs(record.startTime)) / 1000)
        }
        if (seconds == null) return '-'

        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
          return `${hours}小时${minutes}分${secs}秒`
        }
        if (minutes > 0) {
          return `${minutes}分${secs}秒`
        }
        return `${secs}秒`
      }
    },
    {
      title: '结果', dataIndex: 'resultMessage', width: 200, ellipsis: true,
      render: (text) => text ? (
        <Tooltip title={text} placement="topLeft">
          <span style={{ cursor: 'pointer' }}>{text}</span>
        </Tooltip>
      ) : '-'
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <Input placeholder="搜索任务名称" allowClear style={{ width: 200 }}
          value={filterJobName} onChange={e => setFilterJobName(e.target.value)} />
        <Select placeholder="任务类型" allowClear style={{ width: 140 }}
          value={filterJobType} onChange={setFilterJobType}
          options={[{ value: 'CRON', label: '定时任务' }, { value: 'DELAYED_ONCE', label: '一次性任务' }]} />
        <Select placeholder="是否启用" allowClear style={{ width: 120 }}
          value={filterEnabled} onChange={setFilterEnabled}
          options={[{ value: 1, label: '启用' }, { value: 0, label: '禁用' }]} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建任务</Button>
      </div>

      <Table
        loading={loading}
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        pagination={{ ...pagination, showTotal: (total) => `共 ${total} 条` }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingId ? '编辑任务' : '创建任务'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item label="任务名称" name="jobName" rules={[{ required: true }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item label="任务类型" name="jobType" rules={[{ required: true }]}>
            <Select onChange={setSelectedJobType}
              options={[{ value: 'CRON', label: '定时任务' }, { value: 'DELAYED_ONCE', label: '一次性任务' }]} />
          </Form.Item>
          {selectedJobType === 'CRON' && (
            <Form.Item label="Cron表达式" name="cronExpression" rules={[{ required: true }]}>
              <Input placeholder="如: 0 0 0 * * ?" onClick={() => setCronDialogVisible(true)} readOnly style={{ cursor: 'pointer' }} />
            </Form.Item>
          )}
          {selectedJobType === 'DELAYED_ONCE' && (
            <Form.Item label="执行时间" name="executeTime" rules={[{ required: true }]}>
              <DatePicker showTime placeholder="选择执行时间" style={{ width: '100%' }} />
            </Form.Item>
          )}
          <Form.Item label="处理器名称" name="handlerName" rules={[{ required: true }]}>
            <Select placeholder="请选择处理器" onChange={(val) => {
              setHandlerParams([])
              fetchHandlerParams(val)
            }}>
              {Object.keys({ ...handlers, ...handlerLabels }).map(key => (
                <Select.Option key={key} value={key}>{handlers[key] || handlerLabels[key] || key}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          {/* 动态渲染处理器参数 */}
          {handlerParams.length > 0 && handlerParams.map(param => (
            <Form.Item
              key={param.name}
              label={param.label}
              name={`param_${param.name}`}
              rules={[{ required: param.required, message: `请输入${param.label}` }]}
              tooltip={param.tooltip}
            >
              {param.type === 'password' ? (
                <Input.Password placeholder={param.placeholder} />
              ) : param.type === 'number' ? (
                <InputNumber min={param.min} max={param.max} style={{ width: '100%' }} placeholder={param.placeholder} />
              ) : param.type === 'textarea' ? (
                <Input.TextArea rows={3} placeholder={param.placeholder} />
              ) : param.type === 'select' ? (
                <Select placeholder={param.placeholder}>
                  {param.options && param.options.split(',').map(opt => {
                    const [value, label] = opt.split(':')
                    return <Select.Option key={value} value={value}>{label || value}</Select.Option>
                  })}
                </Select>
              ) : param.type === 'switch' ? (
                <Select placeholder={param.placeholder}>
                  <Select.Option value={true}>开启</Select.Option>
                  <Select.Option value={false}>关闭</Select.Option>
                </Select>
              ) : (
                <Input placeholder={param.placeholder} />
              )}
            </Form.Item>
          ))}
          {handlerParams.length === 0 && (
            <Form.Item label="处理器参数" name="handlerParams">
              <Input placeholder="JSON格式参数（可选）" />
            </Form.Item>
          )}
          <Form.Item label="重试次数" name="retryCount">
            <InputNumber min={0} max={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="超时时间(秒)" name="timeoutSeconds">
            <InputNumber min={10} max={3600} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="异常通知邮箱" name="alertEmail">
            <Input placeholder="任务执行异常时发送邮件通知" />
          </Form.Item>
          <Form.Item label="是否启用" name="enabled">
            <Select options={[{ value: 1, label: '启用' }, { value: 0, label: '禁用' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <CronDialog
        visible={cronDialogVisible}
        onClose={() => setCronDialogVisible(false)}
        onConfirm={(value) => {
          form.setFieldsValue({ cronExpression: value })
          setCronDialogVisible(false)
        }}
        initialValue={form.getFieldValue('cronExpression')}
      />

      <Drawer
        title={`执行日志 - ${selectedJob?.jobName}`}
        open={logsVisible}
        onClose={() => setLogsVisible(false)}
        width={1000}
      >
        <Table
          columns={logColumns}
          dataSource={logs}
          rowKey="id"
          loading={logsLoading}
          pagination={false}
          size="small"
        />
      </Drawer>
    </div>
  )
}

export default ScheduleJob