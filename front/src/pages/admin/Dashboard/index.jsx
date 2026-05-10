import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import { FileTextOutlined, UserOutlined, CommentOutlined, EyeOutlined } from '@ant-design/icons'
import { getSiteStat } from '../../../api/stat'

function Dashboard() {
  const [stat, setStat] = useState({
    articleCount: 0,
    userCount: 0,
    commentCount: 0,
    totalViewCount: 0
  })

  useEffect(() => {
    getSiteStat().then(res => {
      if (res.data) {
        setStat({
          articleCount: res.data.articleCount || 0,
          userCount: res.data.userCount || 0,
          commentCount: res.data.commentCount || 0,
          totalViewCount: res.data.totalViewCount || 0
        })
      }
    })
  }, [])

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="文章总数" value={stat.articleCount} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="用户总数" value={stat.userCount} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="评论总数" value={stat.commentCount} prefix={<CommentOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="浏览总量" value={stat.totalViewCount} prefix={<EyeOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
