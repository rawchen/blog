import React from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import { FileTextOutlined, UserOutlined, CommentOutlined, EyeOutlined } from '@ant-design/icons'

function Dashboard() {
  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="文章总数" value={0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="用户总数" value={0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="评论总数" value={0} prefix={<CommentOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="浏览总量" value={0} prefix={<EyeOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
