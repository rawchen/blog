import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { MapChart } from 'echarts/charts'
import { VisualMapComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([MapChart, VisualMapComponent, TooltipComponent, CanvasRenderer])

function EChartsWrapper({ option, style }) {
  const chartRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(chartRef.current)
    }

    instanceRef.current.setOption(option)

    const handleResize = () => {
      instanceRef.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      instanceRef.current?.dispose()
      instanceRef.current = null
    }
  }, [option])

  return <div ref={chartRef} style={style} />
}

export default EChartsWrapper