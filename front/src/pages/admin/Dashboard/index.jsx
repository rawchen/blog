import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Spin } from 'antd'
import {
  FileTextOutlined,
  UserOutlined,
  CommentOutlined,
  EyeOutlined,
  LikeOutlined,
  TagOutlined,
  FolderOutlined,
  GlobalOutlined,
  RiseOutlined
} from '@ant-design/icons'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  getDashboardStats,
  getAccessTrend,
  getTopArticles,
  getBrowserDistribution,
  getOsDistribution,
  getOperationDistribution,
  getCategoryArticleCount,
  getTagArticleCount,
  getCountryDistribution,
  getCityDistribution
} from '../../../api/stat'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const COLORS = [
  '#5B8FF9', '#5AD8A6', '#F6BD16', '#E86452',
  '#6DC8EC', '#945FB9', '#FF9845', '#1E9493',
  '#FF99C3', '#269A99'
]

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 12,
        font: { size: 11 }
      }
    }
  }
}

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [accessTrend, setAccessTrend] = useState([])
  const [topArticles, setTopArticles] = useState([])
  const [browserData, setBrowserData] = useState([])
  const [osData, setOsData] = useState([])
  const [operationData, setOperationData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [tagData, setTagData] = useState([])
  const [countryData, setCountryData] = useState([])
  const [cityData, setCityData] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, trendRes, articlesRes, browserRes, osRes, operationRes, categoryRes, tagRes, countryRes, cityRes] = await Promise.all([
        getDashboardStats(),
        getAccessTrend(),
        getTopArticles({ limit: 10 }),
        getBrowserDistribution(),
        getOsDistribution(),
        getOperationDistribution(),
        getCategoryArticleCount(),
        getTagArticleCount(),
        getCountryDistribution(),
        getCityDistribution()
      ])

      if (statsRes.data) setStats(statsRes.data)
      if (trendRes.data) setAccessTrend(trendRes.data)
      if (articlesRes.data) setTopArticles(articlesRes.data)
      if (browserRes.data) setBrowserData(browserRes.data)
      if (osRes.data) setOsData(osRes.data)
      if (operationRes.data) setOperationData(operationRes.data)
      if (categoryRes.data) setCategoryData(categoryRes.data)
      if (tagRes.data) setTagData(tagRes.data)
      if (countryRes.data) setCountryData(countryRes.data)
      if (cityRes.data) setCityData(cityRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 30天访问趋势
  const trendChartData = {
    labels: accessTrend.map(d => d.date),
    datasets: [
      {
        label: 'PV 页面浏览',
        data: accessTrend.map(d => d.pv),
        borderColor: '#5B8FF9',
        backgroundColor: 'rgba(91,143,249,0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4
      },
      {
        label: 'UV 独立访客',
        data: accessTrend.map(d => d.uv),
        borderColor: '#5AD8A6',
        backgroundColor: 'rgba(90,216,166,0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4
      }
    ]
  }

  // 热门文章排行
  const articlesChartData = {
    labels: topArticles.map(d => d.name),
    datasets: [{
      label: '访问量',
      data: topArticles.map(d => d.count),
      backgroundColor: '#5B8FF9',
      borderRadius: 4,
      barThickness: 16
    }]
  }

  // 标签文章数
  const tagChartData = {
    labels: tagData.map(d => d.name),
    datasets: [{
      label: '文章数',
      data: tagData.map(d => d.count),
      backgroundColor: '#945FB9',
      borderRadius: 4,
      barThickness: 14
    }]
  }

  // 访客城市分布
  const cityChartData = {
    labels: cityData.map(d => d.name),
    datasets: [{
      label: '访问量',
      data: cityData.map(d => d.count),
      backgroundColor: '#1E9493',
      borderRadius: 4,
      barThickness: 14
    }]
  }

  // 通用 Doughnut 数据生成
  const makeDoughnutData = (data) => ({
    labels: data.map(d => d.name),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: COLORS.slice(0, data.length),
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 6
    }]
  })

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 10,
          padding: 8,
          font: { size: 11 },
          generateLabels: (chart) => {
            const data = chart.data
            const total = data.datasets[0].data.reduce((a, b) => a + b, 0)
            return data.labels.map((label, i) => ({
              text: `${label}  ${((data.datasets[0].data[i] / total) * 100).toFixed(1)}%`,
              fillStyle: data.datasets[0].backgroundColor[i],
              hidden: false,
              index: i
            }))
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
            const pct = ((ctx.parsed / total) * 100).toFixed(1)
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`
          }
        }
      }
    }
  }

  const horizontalBarOptions = {
    ...chartOptions,
    indexAxis: 'y',
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { font: { size: 11 } }
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      }
    }
  }

  const noData = (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>暂无数据</div>
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[8, 8]}>
        <Col xs={12} sm={8} md={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="文章总数" value={stats?.articleCount || 0} prefix={<FileTextOutlined />} valueStyle={{ fontSize: 18 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="评论总数" value={stats?.commentCount || 0} prefix={<CommentOutlined />} valueStyle={{ fontSize: 18 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="分类总数" value={stats?.categoryCount || 0} prefix={<FolderOutlined />} valueStyle={{ fontSize: 18 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="标签总数" value={stats?.tagCount || 0} prefix={<TagOutlined />} valueStyle={{ fontSize: 18 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="用户总数" value={stats?.userCount || 0} prefix={<UserOutlined />} valueStyle={{ fontSize: 18 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="总浏览量" value={stats?.totalViewCount || 0} prefix={<EyeOutlined />} valueStyle={{ fontSize: 18 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="总点赞量" value={stats?.totalLikeCount || 0} prefix={<LikeOutlined />} valueStyle={{ fontSize: 18, color: '#E86452' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="30天独立访客" value={stats?.uniqueVisitors30Days || 0} prefix={<GlobalOutlined />} valueStyle={{ fontSize: 18, color: '#945FB9' }} />
          </Card>
        </Col>
      </Row>

      {/* 今日/昨日统计 */}
      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="今日PV" value={stats?.todayPv || 0} valueStyle={{ fontSize: 16, color: '#5B8FF9' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="今日UV" value={stats?.todayUv || 0} valueStyle={{ fontSize: 16, color: '#5AD8A6' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="昨日PV" value={stats?.yesterdayPv || 0} prefix={<RiseOutlined />} valueStyle={{ fontSize: 16, color: '#F6BD16' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="昨日UV" value={stats?.yesterdayUv || 0} prefix={<RiseOutlined />} valueStyle={{ fontSize: 16, color: '#1E9493' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small" bodyStyle={{ padding: '12px' }}>
            <Statistic title="30天总访问" value={stats?.totalAccess30Days || 0} valueStyle={{ fontSize: 16, color: '#FF9845' }} />
          </Card>
        </Col>
      </Row>

      {/* 30天访问趋势 */}
      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
        <Col xs={24}>
          <Card title="30天访问趋势" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {accessTrend.length > 0 ? (
              <div style={{ height: 280 }}>
                <Line data={trendChartData} options={{
                  ...chartOptions,
                  scales: {
                    x: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { size: 11 }, maxRotation: 0 } },
                    y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { size: 11 } }, beginAtZero: true }
                  }
                }} />
              </div>
            ) : noData}
          </Card>
        </Col>
      </Row>

      {/* 图表行1: 热门文章 / 分类文章 / 标签文章 */}
      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={8}>
          <Card title="热门文章排行 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {topArticles.length > 0 ? (
              <div style={{ height: 260 }}>
                <Bar data={articlesChartData} options={horizontalBarOptions} />
              </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="分类文章数" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {categoryData.length > 0 ? (
              <div style={{ height: 260 }}>
                <Doughnut data={makeDoughnutData(categoryData)} options={doughnutOptions} />
              </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="标签文章数 (Top 20)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {tagData.length > 0 ? (
              <div style={{ height: 260 }}>
                <Bar data={tagChartData} options={horizontalBarOptions} />
              </div>
            ) : noData}
          </Card>
        </Col>
      </Row>

      {/* 图表行2: 国家 / 城市 / 访问类型 */}
      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={8}>
          <Card title="访客国家分布 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {countryData.length > 0 ? (
              <div style={{ height: 260 }}>
                <Doughnut data={makeDoughnutData(countryData)} options={doughnutOptions} />
              </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="访客城市分布 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {cityData.length > 0 ? (
              <div style={{ height: 260 }}>
                <Bar data={cityChartData} options={horizontalBarOptions} />
              </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="访问类型分布 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {operationData.length > 0 ? (
              <div style={{ height: 260 }}>
                <Doughnut data={makeDoughnutData(operationData)} options={doughnutOptions} />
              </div>
            ) : noData}
          </Card>
        </Col>
      </Row>

      {/* 图表行3: 浏览器 / 操作系统 */}
      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <Card title="浏览器分布 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {browserData.length > 0 ? (
              <div style={{ height: 240 }}>
                <Doughnut data={makeDoughnutData(browserData)} options={doughnutOptions} />
              </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="操作系统分布 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {osData.length > 0 ? (
              <div style={{ height: 240 }}>
                <Doughnut data={makeDoughnutData(osData)} options={doughnutOptions} />
              </div>
            ) : noData}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard