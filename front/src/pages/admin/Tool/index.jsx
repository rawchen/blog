import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Modal, Form, Input, InputNumber, Select, message, Progress, Spin, Statistic, Switch, Tabs } from 'antd'
import { CloudSyncOutlined, GlobalOutlined, EyeOutlined, SaveOutlined } from '@ant-design/icons'
import { getDatabases, testConnection, getMigrationStats, startMigration, getMigrationProgress } from '../../../api/migration'
import { getScraperArticleCount, fetchArticle, saveScraperArticle } from '../../../api/scraper'

function Tool() {
  // Typecho迁移相关状态
  const [stats, setStats] = useState({ articleCount: 0, commentCount: 0, tagCount: 0, categoryCount: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [mysqlLoading, setMysqlLoading] = useState(false)
  const [databases, setDatabases] = useState([])
  const [connected, setConnected] = useState(false)
  const [pendingStats, setPendingStats] = useState(null)
  const [migrating, setMigrating] = useState(false)
  const [progress, setProgress] = useState({ currentStep: '', progress: 0, processed: 0, total: 0 })
  const [form] = Form.useForm()

  // 网页采集相关状态
  const [scraperCount, setScraperCount] = useState(0)
  const [scraperModalVisible, setScraperModalVisible] = useState(false)
  const [scraperLoading, setScraperLoading] = useState(false)
  const [scraperResult, setScraperResult] = useState(null)
  const [scraperForm] = Form.useForm()
  const [createTags, setCreateTags] = useState(true)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [savingArticle, setSavingArticle] = useState(false)

  useEffect(() => {
    loadStats()
    loadScraperCount()
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

  const loadScraperCount = async () => {
    try {
      const res = await getScraperArticleCount()
      if (res.data !== undefined) {
        setScraperCount(res.data)
      }
    } catch (e) {
      console.error('加载采集数量失败', e)
    }
  }

  // Typecho迁移相关函数
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

  // 网页采集相关函数
  const openScraperModal = () => {
    scraperForm.resetFields()
    setScraperResult(null)
    setCreateTags(true)
    setScraperModalVisible(true)
  }

  const handleFetchArticle = async () => {
    try {
      const values = await scraperForm.validateFields(['url'])
      setScraperLoading(true)
      setScraperResult(null)

      const res = await fetchArticle(values.url)
      if (res.code === 200 && res.data) {
        setScraperResult(res.data)
        message.success('采集成功')
      } else {
        message.error(res.message || '采集失败')
      }
    } catch (e) {
      message.error(e.response?.data?.message || '采集失败')
    } finally {
      setScraperLoading(false)
    }
  }

  const handleSaveArticle = async () => {
    if (!scraperResult) {
      message.error('请先采集文章')
      return
    }

    setSavingArticle(true)
    try {
      // 随机选择封面图
      const randomThumb = Math.floor(Math.random() * 9) + 1
      const articleData = {
        title: scraperResult.title,
        content: scraperResult.content,
        summary: scraperResult.summary,
        coverImage: `/thumbs/${randomThumb}.jpg`,
        status: 1, // 发布状态
        source: 2, // 来源：抓取
        createTags: createTags,
        newTags: createTags ? scraperResult.tags : []
      }

      const res = await saveScraperArticle(articleData)
      if (res.code === 200) {
        message.success('文章保存成功')
        setScraperModalVisible(false)
        loadScraperCount()
      } else {
        message.error(res.message || '保存失败')
      }
    } catch (e) {
      message.error(e.response?.data?.message || '保存失败')
    } finally {
      setSavingArticle(false)
    }
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

        <Col span={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <GlobalOutlined style={{ marginRight: 8 }} />
                AI 网页文章采集
              </div>
            }
            extra={<Button type="primary" onClick={openScraperModal}>开始采集</Button>}
          >
            <p style={{ marginBottom: 16, color: '#666' }}>
              输入网页链接，AI自动提取文章内容并转换为Markdown格式，AI智能生成标签
            </p>
            <Row gutter={16}>
              <Col span={24}>
                <Statistic title="采集数量" value={scraperCount} suffix="篇" />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Typecho迁移弹窗 */}
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
                icon={<CloudSyncOutlined spin={mysqlLoading} />}
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

      {/* 网页文章采集弹窗 */}
      <Modal
        title="网页文章采集"
        open={scraperModalVisible}
        onCancel={() => {
          if (!scraperLoading && !savingArticle) setScraperModalVisible(false)
        }}
        footer={null}
        width={800}
        maskClosable={false}
      >
        <Form form={scraperForm} labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
          <Form.Item
            name="url"
            label="网页链接"
            rules={[
              { required: true, message: '请输入网页链接' },
              { type: 'url', message: '请输入有效的URL' }
            ]}
          >
            <Input.Search
              placeholder="请输入要采集的网页链接"
              enterButton="采集"
              loading={scraperLoading}
              onSearch={handleFetchArticle}
            />
          </Form.Item>
        </Form>

        {/* 采集结果 */}
        {scraperResult && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
              <h4 style={{ marginBottom: 12 }}>采集结果</h4>
              <p><strong>标题：</strong>{scraperResult.title}</p>
              <p><strong>来源：</strong>
                <a href={scraperResult.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {scraperResult.sourceUrl}
                </a>
              </p>
              {scraperResult.tags && scraperResult.tags.length > 0 && (
                <p><strong>标签：</strong>{scraperResult.tags.join(', ')}</p>
              )}
              {scraperResult.summary && (
                <p><strong>摘要：</strong>{scraperResult.summary}</p>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(true)} style={{ marginRight: 8 }}>
                预览内容
              </Button>
              <span style={{ marginLeft: 16 }}>
                生成标签：
                <Switch
                  checked={createTags}
                  onChange={setCreateTags}
                  checkedChildren="是"
                  unCheckedChildren="否"
                  style={{ marginLeft: 8 }}
                />
              </span>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button onClick={() => setScraperModalVisible(false)} disabled={scraperLoading || savingArticle}>
            取消
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveArticle}
            disabled={!scraperResult}
            loading={savingArticle}
            style={{ marginLeft: 8 }}
          >
            保存文章
          </Button>
        </div>
      </Modal>

      {/* 内容预览弹窗 */}
      <Modal
        title="文章内容预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13 }}>
            {scraperResult?.content}
          </pre>
        </div>
      </Modal>
    </div>
  )
}

export default Tool