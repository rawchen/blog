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
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut, PolarArea } from 'react-chartjs-2'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import chinaGeo from '../../../assets/geo/china_geo.json'
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
  getCityDistribution,
  getProvinceDistribution,
  getPageTypeCompare
} from '../../../api/stat'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

echarts.registerMap('china', chinaGeo)

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
  const [provinceData, setProvinceData] = useState([])
  const [pageTypeCompareData, setPageTypeCompareData] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, trendRes, articlesRes, browserRes, osRes, operationRes, categoryRes, tagRes, countryRes, cityRes, provinceRes, pageTypeCompareRes] = await Promise.all([
        getDashboardStats(),
        getAccessTrend(),
        getTopArticles({ limit: 10 }),
        getBrowserDistribution(),
        getOsDistribution(),
        getOperationDistribution(),
        getCategoryArticleCount(),
        getTagArticleCount(),
        getCountryDistribution(),
        getCityDistribution(),
        getProvinceDistribution(),
        getPageTypeCompare()
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
      if (provinceRes.data) setProvinceData(provinceRes.data)
      if (pageTypeCompareRes.data) setPageTypeCompareData(pageTypeCompareRes.data)
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
    labels: tagData.slice(0, 10).map(d => d.name),
    datasets: [{
      data: tagData.slice(0, 10).map(d => d.count),
      backgroundColor: tagData.slice(0, 10).map((_, i) => COLORS[i % COLORS.length] + '80')
    }]
  }

  const polarAreaOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        suggestedMax: 10,
        suggestedMin: 5,
        pointLabels: {
          display: true,
          centerPointLabels: true,
          font: { size: 12 }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed.r} 篇`
        }
      }
    }
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

  // 昨日今日页面类型对比
  const pageTypeCompareChartData = {
    labels: pageTypeCompareData.map(d => d.name),
    datasets: [
      {
        label: '昨日',
        data: pageTypeCompareData.map(d => d.yesterdayCount),
        backgroundColor: 'rgba(255,99,132,0.6)',
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 14
      },
      {
        label: '今日',
        data: pageTypeCompareData.map(d => d.todayCount),
        backgroundColor: 'rgba(54,162,235,0.6)',
        borderColor: 'rgba(54,162,235,1)',
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 14
      }
    ]
  }

  const pageTypeCompareOptions = {
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
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { font: { size: 11 } },
        beginAtZero: true
      }
    }
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

  const doughnutCenterLegend = {
    id: 'doughnutCenterLegend',
    afterDraw(chart) {
      const { ctx, chartArea } = chart
      if (!chartArea) return
      const centerX = (chartArea.left + chartArea.right) / 2
      const centerY = (chartArea.top + chartArea.bottom) / 2
      const data = chart.data
      const total = data.datasets[0].data.reduce((a, b) => a + b, 0)
      const labels = data.labels
      const colors = data.datasets[0].backgroundColor
      const lineHeight = 16
      const maxItems = Math.floor((chartArea.bottom - chartArea.top) * 0.6 / lineHeight)
      const items = labels.slice(0, maxItems).map((label, i) => ({
        label,
        value: data.datasets[0].data[i],
        pct: ((data.datasets[0].data[i] / total) * 100).toFixed(1),
        color: colors[i]
      }))
      const startY = centerY - (items.length * lineHeight) / 2
      ctx.save()
      ctx.textBaseline = 'middle'
      items.forEach((item, i) => {
        const y = startY + i * lineHeight + lineHeight / 2
        ctx.fillStyle = item.color
        ctx.fillRect(centerX - 50, y - 4, 8, 8)
        ctx.fillStyle = '#666'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`${item.label} ${item.pct}%`, centerX - 38, y)
      })
      ctx.restore()
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: { display: false },
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

  const chinaMapOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => `${params.name}<br/>${params.value || 0} 次`
    },
    visualMap: {
      min: 0,
      max: provinceData.length > 0 ? Math.max(...provinceData.map(d => d.count), 10) : 10,
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      calculable: true,
      inRange: {
        color: ['#e8f5e9', '#a5d6a7', '#66bb6a', '#43a047', '#2e7d32']
      }
    },
    series: [{
      type: 'map',
      map: 'china',
      roam: true,
      zoom: 1.7,
      center: [105, 36],
      itemStyle: {
        areaColor: '#e8f5e9'
      },
      label: {
        show: false,
        fontSize: 10
      },
      data: provinceData.map(d => ({
        name: d.name,
        value: d.count
      }))
    }]
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
        <Col xs={12} sm={8} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#28a745', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 60, opacity: 0.2 }}><FileTextOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>文章总数</span>} value={stats?.articleCount || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#17a2b8', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 60, opacity: 0.2 }}><CommentOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>评论总数</span>} value={stats?.commentCount || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#1f2d3d', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 60, opacity: 0.2 }}><FolderOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>分类总数</span>} value={stats?.categoryCount || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#dc3545', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 60, opacity: 0.2 }}><TagOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>标签总数</span>} value={stats?.tagCount || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#007bff', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 60, opacity: 0.2 }}><EyeOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>总浏览量</span>} value={stats?.totalViewCount || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#ffc107', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 60, opacity: 0.2 }}><LikeOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>总点赞量</span>} value={stats?.totalLikeCount || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#343a40', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 60, opacity: 0.2 }}><GlobalOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>30天PV</span>} value={stats?.totalAccess30Days || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#28a745', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 60, opacity: 0.2 }}><GlobalOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>30天UV</span>} value={stats?.uniqueVisitors30Days || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#17a2b8', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 50, opacity: 0.2 }}><RiseOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>今日PV</span>} value={stats?.todayPv || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#1f2d3d', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 50, opacity: 0.2 }}><RiseOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>今日UV</span>} value={stats?.todayUv || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#dc3545', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 50, opacity: 0.2 }}><RiseOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>昨日PV</span>} value={stats?.yesterdayPv || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={6} lg={2}>
          <Card size="small" bodyStyle={{ padding: '12px', background: '#007bff', color: '#fff', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 50, opacity: 0.2 }}><RiseOutlined /></span>
            <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>昨日UV</span>} value={stats?.yesterdayUv || 0} valueStyle={{ fontSize: 22, color: '#fff', fontWeight: 800 }} />
          </Card>
        </Col>
      </Row>

      {/* 30天访问趋势 / 昨日今日页面类型对比 */}
      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={12}>
          <Card title="30天访问趋势" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {accessTrend.length > 0 ? (
              <div style={{ height: 200 }}>
                <Line data={trendChartData} options={{
                  ...chartOptions,
                  interaction: {
                    mode: 'index',
                    intersect: false
                  },
                  scales: {
                    x: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { size: 11 }, maxRotation: 0 } },
                    y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { font: { size: 11 } }, beginAtZero: true }
                  }
                }} />
              </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="页面类型访问对比（昨日 vs 今日）" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {pageTypeCompareData.length > 0 ? (
                <div style={{ height: 200 }}>
                  <Bar data={pageTypeCompareChartData} options={pageTypeCompareOptions} />
                </div>
            ) : noData}
          </Card>
        </Col>
      </Row>
      {/* 中国地图访客分布 */}
      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={6}>
          <Card title="访客省份分布 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {provinceData.length > 0 ? (
              <div style={{ height: 260 }}>
                <ReactECharts echarts={echarts} option={chinaMapOption} style={{ height: '100%' }} />
              </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title="分类文章数" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {categoryData.length > 0 ? (
                <div style={{ height: 260 }}>
                  <Doughnut data={makeDoughnutData(categoryData)} options={doughnutOptions} plugins={[doughnutCenterLegend]} />
                </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title="访问类型分布 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {operationData.length > 0 ? (
                <div style={{ height: 260 }}>
                  <Doughnut data={makeDoughnutData(operationData)} options={doughnutOptions} plugins={[doughnutCenterLegend]} />
                </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title="标签文章数 (Top 10)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {tagData.length > 0 ? (
                <div style={{ height: 260 }}>
                  <PolarArea data={tagChartData} options={polarAreaOptions} />
                </div>
            ) : noData}
          </Card>
        </Col>
      </Row>

      {/* 图表行1: 热门文章 / 分类文章 / 标签文章 */}
      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
        <Col xs={24} lg={6}>
          <Card title="访客城市分布 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {cityData.length > 0 ? (
                <div style={{ height: 260 }}>
                  <Bar data={cityChartData} options={horizontalBarOptions} />
                </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title="热门文章排行 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {topArticles.length > 0 ? (
              <div style={{ height: 260 }}>
                <Bar data={articlesChartData} options={horizontalBarOptions} />
              </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title="操作系统分布 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {osData.length > 0 ? (
                <div style={{ height: 260 }}>
                  <Doughnut data={makeDoughnutData(osData)} options={doughnutOptions} plugins={[doughnutCenterLegend]} />
                </div>
            ) : noData}
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card title="访客国家分布 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {countryData.length > 0 ? (
                <div style={{ height: 260 }}>
                  <Doughnut data={makeDoughnutData(countryData)} options={doughnutOptions} plugins={[doughnutCenterLegend]} />
                </div>
            ) : noData}
          </Card>
        </Col>
      </Row>

      {/* 图表行2: 国家 / 城市 / 访问类型 */}
      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>


        <Col xs={24} lg={6}>
          <Card title="浏览器分布 (30天)" size="small" bodyStyle={{ padding: '12px 16px' }}>
            {browserData.length > 0 ? (
                <div style={{ height: 260 }}>
                  <Doughnut data={makeDoughnutData(browserData)} options={doughnutOptions} plugins={[doughnutCenterLegend]} />
                </div>
            ) : noData}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard