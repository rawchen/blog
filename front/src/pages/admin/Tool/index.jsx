import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Modal, Form, Input, InputNumber, Select, message, Progress, Spin, Statistic } from 'antd'
import { ToolOutlined, ReloadOutlined, CloudSyncOutlined } from '@ant-design/icons'
import { getDatabases, testConnection, getMigrationStats, startMigration, getMigrationProgress } from '../../../api/migration'

function Tool() {
  const [stats, setStats] = useState({ articleCount: 0, commentCount: 0, tagCount: 0, categoryCount: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [mysqlLoading, setMysqlLoading] = useState(false)
  const [databases, setDatabases] = useState([])
  const [connected, setConnected] = useState(false)
  const [pendingStats, setPendingStats] = useState(null)
  const [migrating, setMigrating] = useState(false)
  const [progress, setProgress] = useState({ currentStep: '', progress: 0, processed: 0, total: 0 })
  const [form] = Form.useForm()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await getMigrationStats()
      if (res.data) {
        setStats(res.data)
      }
    } catch (e) {
      console.error('加载统计失败', e)
    }
  }

  const handleConnect = async () => {
    try {
      const values = await form.validateFields(['mysqlHost', 'mysqlPort', 'mysqlUsername', 'mysqlPassword'])
      setMysqlLoading(true)
      const res = await getDatabases({
        host: values.mysqlHost,
        port: values.mysqlPort,
        username: values.mysqlUsername,
        password: values.mysqlPassword
      })
      if (res.data) {
        setDatabases(res.data)
        message.success('连接成功，请选择数据库')
        setConnected(false)
      }
    } catch (e) {
      message.error(e.response?.data?.message || '连接失败')
      setDatabases([])
      setConnected(false)
    } finally {
      setMysqlLoading(false)
    }
  }

  const handleDatabaseChange = async (value) => {
    form.setFieldsValue({ databaseName: value })
    setConnected(false)
    setPendingStats(null)

    // 选择数据库后自动测试连接并获取待迁移数据
    try {
      const values = await form.validateFields(['mysqlHost', 'mysqlPort', 'mysqlUsername', 'mysqlPassword', 'databaseName'])
      setMysqlLoading(true)
      const res = await testConnection({
        host: values.mysqlHost,
        port: values.mysqlPort,
        username: values.mysqlUsername,
        password: values.mysqlPassword,
        database: values.databaseName
      })
      if (res.data && res.data.connected) {
        message.success('连接成功')
        setConnected(true)
        setPendingStats({
          articleCount: res.data.pendingArticleCount,
          commentCount: res.data.pendingCommentCount,
          tagCount: res.data.pendingTagCount,
          categoryCount: res.data.pendingCategoryCount
        })
      } else {
        message.error(res.data?.message || '连接失败')
        setConnected(false)
      }
    } catch (e) {
      message.error('连接失败')
      setConnected(false)
    } finally {
      setMysqlLoading(false)
    }
  }

  const handleStartMigration = async () => {
    try {
      const values = await form.validateFields()
      setMigrating(true)
      setProgress({ currentStep: '开始迁移...', progress: 0, processed: 0, total: 0 })

      await startMigration({
        host: values.mysqlHost,
        port: values.mysqlPort,
        username: values.mysqlUsername,
        password: values.mysqlPassword,
        database: values.databaseName
      })

      // 开始轮询进度
      pollProgress()
    } catch (e) {
      message.error('启动迁移失败')
      setMigrating(false)
    }
  }

  const pollProgress = () => {
    const timer = setInterval(async () => {
      try {
        const res = await getMigrationProgress()
        if (res.data) {
          setProgress(res.data)
          if (!res.data.migrating && res.data.completed) {
            clearInterval(timer)
            message.success('迁移完成')
            setMigrating(false)
            loadStats()
          } else if (res.data.errorMessage) {
            clearInterval(timer)
            message.error(res.data.errorMessage)
            setMigrating(false)
          }
        }
      } catch (e) {
        clearInterval(timer)
        setMigrating(false)
      }
    }, 1000)
  }

  const openMigrationModal = () => {
    form.resetFields()
    form.setFieldsValue({ mysqlPort: 3306 })
    setDatabases([])
    setConnected(false)
    setPendingStats(null)
    setModalVisible(true)
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CloudSyncOutlined style={{ marginRight: 8 }} />
                Typecho迁移
              </div>
            }
            extra={<Button type="primary" onClick={openMigrationModal}>开始迁移</Button>}
          >
            <p style={{ marginBottom: 16, color: '#666' }}>
              迁移文章（及单模版页），关联的标签、分类、评论、封面图等相关数据
            </p>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="同步文章数" value={stats.articleCount} />
              </Col>
              <Col span={6}>
                <Statistic title="同步评论数" value={stats.commentCount} />
              </Col>
              <Col span={6}>
                <Statistic title="同步标签数" value={stats.tagCount} />
              </Col>
              <Col span={6}>
                <Statistic title="同步类目数" value={stats.categoryCount} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Typecho数据迁移"
        open={modalVisible}
        onCancel={() => {
          if (!migrating) setModalVisible(false)
        }}
        footer={null}
        width={600}
        maskClosable={false}
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
          {/* MySQL连接器配置 */}
          <Form.Item label="MySQL连接器配置">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Input.Group compact style={{ width: 260 }}>
                <Form.Item name="mysqlHost" noStyle rules={[{ required: true, message: '请输入主机地址' }]}>
                  <Input style={{ width: 180 }} placeholder="MySQL主机地址" />
                </Form.Item>
                <Form.Item name="mysqlPort" noStyle initialValue={3306} rules={[{ required: true }]}>
                  <InputNumber style={{ width: 80 }} min={1} max={65535} />
                </Form.Item>
              </Input.Group>
              <Form.Item name="mysqlUsername" noStyle rules={[{ required: true, message: '请输入用户名' }]}>
                <Input style={{ width: 193 }} placeholder="用户名" />
              </Form.Item>
              <Form.Item name="mysqlPassword" noStyle rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password style={{ width: 193 }} placeholder="密码" />
              </Form.Item>
              <Button
                type="primary"
                icon={<ReloadOutlined spin={mysqlLoading} />}
                onClick={handleConnect}
                loading={mysqlLoading}
              >
                连接
              </Button>
            </div>
          </Form.Item>

          <Form.Item name="databaseName" label="数据库名称" rules={[{ required: true, message: '请选择数据库' }]}>
            <Select
              placeholder={databases.length === 0 ? "请先点击连接" : "请选择数据库"}
              showSearch
              allowClear
              disabled={databases.length === 0 || migrating}
              onChange={handleDatabaseChange}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={databases.map(db => ({ label: db, value: db }))}
            />
          </Form.Item>
        </Form>

        {/* 连接成功后显示待迁移数据 */}
        {connected && pendingStats && (
          <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
            <h4 style={{ marginBottom: 12 }}>待迁移数据统计</h4>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="待同步文章数" value={pendingStats.articleCount} />
              </Col>
              <Col span={6}>
                <Statistic title="待同步评论数" value={pendingStats.commentCount} />
              </Col>
              <Col span={6}>
                <Statistic title="待同步标签数" value={pendingStats.tagCount} />
              </Col>
              <Col span={6}>
                <Statistic title="待同步类目数" value={pendingStats.categoryCount} />
              </Col>
            </Row>
          </div>
        )}

        {/* 迁移进度 */}
        {migrating && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 12 }}>迁移进度</h4>
            <Progress percent={progress.progress} status="active" />
            <p style={{ marginTop: 8 }}>
              {progress.currentStep}
              {progress.total > 0 && ` (${progress.processed}/${progress.total})`}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button onClick={() => setModalVisible(false)} disabled={migrating}>
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleStartMigration}
            disabled={!connected || migrating}
            loading={migrating}
            style={{ marginLeft: 8 }}
          >
            开始迁移
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default Tool