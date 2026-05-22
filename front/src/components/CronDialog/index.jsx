import React, { useState, useEffect, useMemo } from 'react'
import { Modal, Form, Select, Button, Input, Divider } from 'antd'

// 生成数字选项
const generateNumberOptions = (start, end, suffix = '') => {
  const options = []
  for (let i = start; i <= end; i++) {
    options.push({ value: String(i), label: `${i}${suffix}` })
  }
  return options
}

// 秒选项 (0-59)
const secondOptions = [
  { value: '*', label: '每秒 (*)' },
  { value: '0', label: '第0秒' },
  ...generateNumberOptions(1, 59, '秒').slice(0, 10),
  { value: 'custom', label: '自定义...' },
]

// 分钟选项 (0-59)
const minuteOptions = [
  { value: '*', label: '每分钟 (*)' },
  { value: '0', label: '第0分' },
  ...generateNumberOptions(1, 59, '分').slice(0, 10),
  { value: 'custom', label: '自定义...' },
]

// 小时选项 (0-23)
const hourOptions = [
  { value: '*', label: '每小时 (*)' },
  ...generateNumberOptions(0, 23, '点'),
  { value: 'custom', label: '自定义...' },
]

// 日选项 (1-31)
const dayOptions = [
  { value: '*', label: '每日 (*)' },
  { value: '?', label: '不指定 (?)' },
  ...generateNumberOptions(1, 31, '号'),
  { value: 'L', label: '最后一天 (L)' },
  { value: 'L-1', label: '倒数第1天 (L-1)' },
  { value: 'L-2', label: '倒数第2天 (L-2)' },
  { value: 'L-3', label: '倒数第3天 (L-3)' },
  { value: 'W', label: '最近工作日 (W)' },
  { value: 'LW', label: '最后一周工作日 (LW)' },
  { value: 'custom', label: '自定义...' },
]

// 月选项 (1-12)
const monthOptions = [
  { value: '*', label: '每月 (*)' },
  { value: '1', label: '1月 (JAN)' },
  { value: '2', label: '2月 (FEB)' },
  { value: '3', label: '3月 (MAR)' },
  { value: '4', label: '4月 (APR)' },
  { value: '5', label: '5月 (MAY)' },
  { value: '6', label: '6月 (JUN)' },
  { value: '7', label: '7月 (JUL)' },
  { value: '8', label: '8月 (AUG)' },
  { value: '9', label: '9月 (SEP)' },
  { value: '10', label: '10月 (OCT)' },
  { value: '11', label: '11月 (NOV)' },
  { value: '12', label: '12月 (DEC)' },
  { value: 'custom', label: '自定义...' },
]

// 周选项 (1-7 或 SUN-SAT)
const weekOptions = [
  { value: '?', label: '不指定 (?)' },
  { value: '*', label: '每周 (*)' },
  { value: '1', label: '周日 (SUN)' },
  { value: '2', label: '周一 (MON)' },
  { value: '3', label: '周二 (TUE)' },
  { value: '4', label: '周三 (WED)' },
  { value: '5', label: '周四 (THU)' },
  { value: '6', label: '周五 (FRI)' },
  { value: '7', label: '周六 (SAT)' },
  { value: '1#1', label: '每月第1个周日' },
  { value: '2#1', label: '每月第1个周一' },
  { value: '3#1', label: '每月第1个周二' },
  { value: '4#1', label: '每月第1个周三' },
  { value: '5#1', label: '每月第1个周四' },
  { value: '6#1', label: '每月第1个周五' },
  { value: '7#1', label: '每月第1个周六' },
  { value: '1#2', label: '每月第2个周日' },
  { value: '2#2', label: '每月第2个周一' },
  { value: '3#2', label: '每月第2个周二' },
  { value: '4#2', label: '每月第2个周三' },
  { value: '5#2', label: '每月第2个周四' },
  { value: '6#2', label: '每月第2个周五' },
  { value: '7#2', label: '每月第2个周六' },
  { value: '1#3', label: '每月第3个周日' },
  { value: '2#3', label: '每月第3个周一' },
  { value: '3#3', label: '每月第3个周二' },
  { value: '4#3', label: '每月第3个周三' },
  { value: '5#3', label: '每月第3个周四' },
  { value: '6#3', label: '每月第3个周五' },
  { value: '7#3', label: '每月第3个周六' },
  { value: '1#4', label: '每月第4个周日' },
  { value: '2#4', label: '每月第4个周一' },
  { value: '3#4', label: '每月第4个周二' },
  { value: '4#4', label: '每月第4个周三' },
  { value: '5#4', label: '每月第4个周四' },
  { value: '6#4', label: '每月第4个周五' },
  { value: '7#4', label: '每月第4个周六' },
  { value: '1#5', label: '每月第5个周日' },
  { value: '2#5', label: '每月第5个周一' },
  { value: '3#5', label: '每月第5个周二' },
  { value: '4#5', label: '每月第5个周三' },
  { value: '5#5', label: '每月第5个周四' },
  { value: '6#5', label: '每月第5个周五' },
  { value: '7#5', label: '每月第5个周六' },
  { value: '1L', label: '每月最后一个周日' },
  { value: '2L', label: '每月最后一个周一' },
  { value: '3L', label: '每月最后一个周二' },
  { value: '4L', label: '每月最后一个周三' },
  { value: '5L', label: '每月最后一个周四' },
  { value: '6L', label: '每月最后一个周五' },
  { value: '7L', label: '每月最后一个周六' },
  { value: 'custom', label: '自定义...' },
]

// 解析 cron 表达式
const parseCronExpression = (expr) => {
  const parts = expr.trim().split(/\s+/)
  return {
    second: parts[0] || '0',
    minute: parts[1] || '*',
    hour: parts[2] || '*',
    day: parts[3] || '*',
    month: parts[4] || '*',
    week: parts[5] || '?'
  }
}

// 生成 cron 表达式描述
const generateCronDescription = (expr) => {
  if (!expr || !expr.trim()) return '请设置 Cron 表达式'

  const parts = expr.trim().split(/\s+/)
  if (parts.length < 6) return '表达式格式不正确'

  const [second, minute, hour, day, month, week] = parts
  const descriptions = []

  // 解析秒
  if (second === '*') {
    descriptions.push('每秒')
  } else if (second.includes('/')) {
    const [, step] = second.split('/')
    descriptions.push(`每${step}秒`)
  } else if (second.includes('-')) {
    descriptions.push(`秒${second.replace('-', '到')}`)
  } else if (second !== '0') {
    descriptions.push(`第${second}秒`)
  }

  // 解析分钟
  if (minute === '*') {
    descriptions.push('每分钟')
  } else if (minute.includes('/')) {
    const [, step] = minute.split('/')
    descriptions.push(`每${step}分钟`)
  } else if (minute.includes('-')) {
    descriptions.push(`分钟${minute.replace('-', '到')}`)
  } else if (minute !== '0' || second === '0') {
    descriptions.push(`第${minute}分钟`)
  }

  // 解析小时
  if (hour === '*') {
    descriptions.push('每小时')
  } else if (hour.includes('/')) {
    const [, step] = hour.split('/')
    descriptions.push(`每${step}小时`)
  } else if (hour.includes('-')) {
    descriptions.push(`小时${hour.replace('-', '到')}`)
  } else {
    descriptions.push(`${hour}点`)
  }

  // 解析日
  if (day === '*') {
    descriptions.push('每天')
  } else if (day === '?') {
    // 不指定，由周决定
  } else if (day === 'L') {
    descriptions.push('每月最后一天')
  } else if (day.startsWith('L-')) {
    const offset = day.substring(2)
    descriptions.push(`每月倒数第${offset}天`)
  } else if (day === 'W') {
    descriptions.push('最近工作日')
  } else if (day === 'LW') {
    descriptions.push('每月最后一周工作日')
  } else if (day.includes('W')) {
    const dayNum = day.replace('W', '')
    descriptions.push(`${dayNum}号最近的工作日`)
  } else if (day.includes('/')) {
    const [, step] = day.split('/')
    descriptions.push(`每${step}天`)
  } else if (day.includes('-')) {
    descriptions.push(`${day.replace('-', '号到')}号`)
  } else {
    descriptions.push(`每月${day}号`)
  }

  // 解析月
  if (month === '*') {
    descriptions.push('每月')
  } else if (month.includes('/')) {
    const [, step] = month.split('/')
    descriptions.push(`每${step}个月`)
  } else if (month.includes('-')) {
    const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const [start, end] = month.split('-')
    descriptions.push(`${monthNames[parseInt(start)]}到${monthNames[parseInt(end)]}`)
  } else {
    const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    descriptions.push(`${monthNames[parseInt(month)] || month}`)
  }

  // 解析周
  if (week === '?') {
    // 不指定，由日决定
  } else if (week === '*') {
    descriptions.push('每周')
  } else if (week.includes('#')) {
    const [dayOfWeek, nth] = week.split('#')
    const weekNames = ['', '周日', '周一', '周二', '周三', '周四', '周五', '周六']
    descriptions.push(`每月第${nth}个${weekNames[parseInt(dayOfWeek)]}`)
  } else if (week.endsWith('L')) {
    const dayOfWeek = week.replace('L', '')
    const weekNames = ['', '周日', '周一', '周二', '周三', '周四', '周五', '周六']
    descriptions.push(`每月最后一个${weekNames[parseInt(dayOfWeek)]}`)
  } else if (week.includes('-')) {
    const weekNames = ['', '周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const [start, end] = week.split('-')
    descriptions.push(`${weekNames[parseInt(start)]}到${weekNames[parseInt(end)]}`)
  } else {
    const weekNames = ['', '周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekMap = {
      'SUN': '周日', 'MON': '周一', 'TUE': '周二', 'WED': '周三',
      'THU': '周四', 'FRI': '周五', 'SAT': '周六'
    }
    descriptions.push(`每${weekMap[week] || weekNames[parseInt(week)] || week}`)
  }

  // 过滤空描述并组合
  const filtered = descriptions.filter(d => d)

  // 特殊情况处理
  if (expr === '* * * * * ?') return '每秒执行一次'
  if (expr === '0 * * * * ?') return '每分钟执行一次'
  if (expr === '0 0 * * * ?') return '每小时执行一次'
  if (expr === '0 0 0 * * ?') return '每天0点执行一次'

  return filtered.join('') + '执行一次'
}

// 预设表达式
const commonPresets = [
  { label: '每秒执行', value: '* * * * * ?' },
  { label: '每5秒执行', value: '0/5 * * * * ?' },
  { label: '每分钟执行', value: '0 * * * * ?' },
  { label: '每5分钟执行', value: '0 0/5 * * * ?' },
  { label: '每小时执行', value: '0 0 * * * ?' },
  { label: '每天8点执行', value: '0 0 8 * * ?' },
  { label: '每周一0点执行', value: '0 0 0 ? * MON' },
  { label: '每周一至周五9点执行', value: '0 0 9 ? * MON-FRI' },
  { label: '每月1号0点执行', value: '0 0 0 1 * ?' },
  { label: '每月15号0点执行', value: '0 0 0 15 * ?' },
  { label: '每月最后一天0点执行', value: '0 0 0 L * ?' },
  { label: '每月最后一个周五0点执行', value: '0 0 0 ? * 6L' },
  { label: '每月第二个周三12点执行', value: '0 0 12 ? * 4#2' },
]

function CronDialog({ visible, onClose, onConfirm, initialValue }) {
  const [form] = Form.useForm()
  const [cronExpression, setCronExpression] = useState('')
  const [customValues, setCustomValues] = useState({})

  // 解析并更新表单值
  const parseAndUpdateForm = (expr) => {
    if (!expr) return
    const values = parseCronExpression(expr)
    const newCustomValues = {}

    // 检查是否需要使用自定义值
    const optionsMap = {
      second: secondOptions,
      minute: minuteOptions,
      hour: hourOptions,
      day: dayOptions,
      month: monthOptions,
      week: weekOptions
    }

    Object.entries(values).forEach(([key, value]) => {
      const options = optionsMap[key] || []
      const exists = options.some(opt => opt.value === value)
      if (!exists && value !== 'custom') {
        newCustomValues[key] = value
      }
    })

    setCustomValues(newCustomValues)

    // 设置表单值
    const formValues = {}
    Object.entries(values).forEach(([key, value]) => {
      const options = optionsMap[key] || []
      const exists = options.some(opt => opt.value === value)
      formValues[key] = exists ? value : 'custom'
    })

    form.setFieldsValue(formValues)
  }

  useEffect(() => {
    if (visible) {
      form.resetFields()
      setCustomValues({})
      if (initialValue) {
        setCronExpression(initialValue)
        parseAndUpdateForm(initialValue)
      } else {
        setCronExpression('0 * * * * ?')
        form.setFieldsValue({
          second: '0',
          minute: '*',
          hour: '*',
          day: '*',
          month: '*',
          week: '?'
        })
      }
    }
  }, [visible, initialValue, form])

  // 生成 cron 表达式
  const buildCronExpression = () => {
    const values = form.getFieldsValue()
    const parts = [
      values.second === 'custom' ? (customValues.second || '0') : (values.second || '0'),
      values.minute === 'custom' ? (customValues.minute || '*') : (values.minute || '*'),
      values.hour === 'custom' ? (customValues.hour || '*') : (values.hour || '*'),
      values.day === 'custom' ? (customValues.day || '*') : (values.day || '*'),
      values.month === 'custom' ? (customValues.month || '*') : (values.month || '*'),
      values.week === 'custom' ? (customValues.week || '?') : (values.week || '?')
    ]
    return parts.join(' ')
  }

  const handleFieldChange = () => {
    const expr = buildCronExpression()
    setCronExpression(expr)
  }

  const handleCustomValueChange = (field, value) => {
    setCustomValues(prev => ({
      ...prev,
      [field]: value
    }))
    setTimeout(() => {
      const expr = buildCronExpression()
      setCronExpression(expr)
    }, 0)
  }

  // 手动编辑表达式
  const handleExpressionChange = (e) => {
    const expr = e.target.value
    setCronExpression(expr)
    // 尝试解析并更新表单
    if (expr.split(/\s+/).length === 6) {
      parseAndUpdateForm(expr)
    }
  }

  const handleConfirm = () => {
    const expr = buildCronExpression()
    onConfirm(expr)
    onClose()
  }

  // 生成描述
  const cronDescription = useMemo(() => {
    return generateCronDescription(cronExpression)
  }, [cronExpression])

  // 渲染带自定义输入的选择器
  const renderSelectWithCustom = (field, label, options) => (
    <Form.Item name={field} label={label}>
      <Select
        onChange={handleFieldChange}
        showSearch
        optionFilterProp="label"
        options={options}
        dropdownRender={(menu) => (
          <>
            {menu}
            {form.getFieldValue(field) === 'custom' && (
              <div style={{ padding: '8px' }}>
                <Input
                  placeholder="输入自定义值，如: 0/5, 1-5, 1,3,5"
                  value={customValues[field] || ''}
                  onChange={(e) => handleCustomValueChange(field, e.target.value)}
                  size="small"
                />
              </div>
            )}
          </>
        )}
      />
    </Form.Item>
  )

  return (
    <Modal
      title="Quartz Cron 表达式生成器"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          确定
        </Button>
      ]}
      width={900}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="快速预设">
          <Select
            placeholder="选择预设表达式"
            options={commonPresets}
            onChange={(value) => {
              setCronExpression(value)
              parseAndUpdateForm(value)
            }}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item label="当前表达式（可直接编辑）">
          <Input
            value={cronExpression}
            onChange={handleExpressionChange}
            style={{ fontFamily: 'monospace', fontSize: '14px' }}
            placeholder="秒 分 时 日 月 周"
          />
        </Form.Item>

        <Form.Item label="表达式含义">
          <div style={{
            padding: '8px 12px',
            background: '#e6f7ff',
            borderRadius: '4px',
            border: '1px solid #91d5ff',
            color: '#1890ff',
            fontWeight: 500
          }}>
            {cronDescription}
          </div>
        </Form.Item>

        <Divider>详细配置</Divider>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {renderSelectWithCustom('second', '秒 (0-59)', secondOptions)}
          {renderSelectWithCustom('minute', '分钟 (0-59)', minuteOptions)}
          {renderSelectWithCustom('hour', '小时 (0-23)', hourOptions)}
          {renderSelectWithCustom('day', '日 (1-31)', dayOptions)}
          {renderSelectWithCustom('month', '月 (1-12)', monthOptions)}
          {renderSelectWithCustom('week', '周 (1-7)', weekOptions)}
        </div>

        <div style={{ marginTop: '16px', padding: '12px', background: '#fafafa', borderRadius: '4px', border: '1px solid #e8e8e8' }}>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <strong>Quartz Cron 表达式语法说明：</strong>
            <div style={{ marginTop: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8', fontWeight: 'bold' }}>字段</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8', fontWeight: 'bold' }}>允许值</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8', fontWeight: 'bold' }}>允许特殊字符</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>秒</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>0-59</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>, - * /</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>分钟</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>0-59</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>, - * /</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>小时</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>0-23</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>, - * /</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>日</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>1-31</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>, - * ? / L W</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>月</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>1-12 或 JAN-DEC</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #e8e8e8' }}>, - * /</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px' }}>周</td>
                    <td style={{ padding: '4px 8px' }}>1-7 或 SUN-SAT</td>
                    <td style={{ padding: '4px 8px' }}>, - * ? / L #</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ul style={{ margin: '12px 0 0 0', paddingLeft: '20px', lineHeight: '1.8' }}>
              <li><code>*</code> 表示所有值</li>
              <li><code>?</code> 表示不指定值（仅用于日和周字段，两者必须有一个使用 ?）</li>
              <li><code>-</code> 表示范围，如 <code>10-12</code> 表示10到12</li>
              <li><code>,</code> 表示列举，如 <code>1,3,5</code> 表示1、3、5</li>
              <li><code>/</code> 表示增量，如 <code>0/5</code> 表示从0开始每5单位</li>
              <li><code>L</code> 表示最后，日字段表示最后一天，周字段表示最后一个周几（如 <code>6L</code> 表示最后一个周五）</li>
              <li><code>W</code> 表示有效工作日（周一到周五），如 <code>15W</code> 表示15号最近的工作日</li>
              <li><code>LW</code> 表示最后一个工作日</li>
              <li><code>#</code> 表示第几个周几，如 <code>6#3</code> 表示第3个周五</li>
            </ul>
          </div>
        </div>
      </Form>
    </Modal>
  )
}

export default CronDialog
