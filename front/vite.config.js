import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:9999',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    modulePreload: false, // 禁用预加载，按需加载
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd': ['antd', '@ant-design/icons'],
          'echarts': ['echarts'],
          'chartjs': ['chart.js', 'react-chartjs-2'],
          'markdown': ['react-markdown', 'remark-gfm', 'rehype-raw']
        }
      }
    }
  }
})
