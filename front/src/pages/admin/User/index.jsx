import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, message, Popconfirm } from 'antd'
import { StopOutlined, PlayCircleOutlined, KeyOutlined } from '@ant-design/icons'
import { getUserList, updateUserStatus, resetPassword } from '../../../api/user'

function UserList() {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    fetchList()
  }, [pagination.current])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await getUserList({ current: pagination.current, size: pagination.pageSize })
      setDataSource(res.data.records || [])
      setPagination({ ...pagination, total: res.data.total })
    } finally {
      setLoading(false)
    }
  }

  const handleStatus = async (id, status) => {
    try {
      await updateUserStatus(id, status)
      message.success('更新成功')
      fetchList()
    } catch (error) {
      // error handled
    }
  }

  const handleResetPassword = async (id) => {
    try {
      await resetPassword(id)
      message.success('密码已重置为: 123456')
    } catch (error) {
      // error handled
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '昵称', dataIndex: 'nickname', width: 120 },
    { title: '邮箱', dataIndex: 'email', width: 200 },
    { title: '手机', dataIndex: 'phone', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '正常' : '禁用'}
        </Tag>
      )
    },
    { title: '注册时间', dataIndex: 'createTime', width: 180 },
    {
      title: '操作',
      width: 200,
      render: (_, record) => (
        <>
          <Button
            type="primary"
            size="small"
            icon={record.status === 1 ? <StopOutlined /> : <PlayCircleOutlined />}
            onClick={() => handleStatus(record.id, record.status === 1 ? 0 : 1)}
          >
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
          <Popconfirm title="确定要重置密码吗?" onConfirm={() => handleResetPassword(record.id)}>
            <Button type="primary" size="small" icon={<KeyOutlined />}>重置密码</Button>
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

export default UserList
