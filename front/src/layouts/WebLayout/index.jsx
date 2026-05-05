import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BackTop from '../../components/BackTop'
import './index.css'

function WebLayout() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location])

  return (
    <div className="web-layout">
      <Header />

      {/* Main Content */}
      <main className="web-main">
        <div className="main-content">
          <div className="content">
            <Outlet />
          </div>
        </div>
      </main>

      <Footer />

      {/* Back to Top */}
      <BackTop visibilityHeight={300} />
    </div>
  )
}

export default WebLayout