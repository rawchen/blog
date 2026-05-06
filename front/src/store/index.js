import { configureStore } from '@reduxjs/toolkit'
import authReducer from './modules/auth'
import siteConfigReducer from './modules/siteConfig'

export default configureStore({
  reducer: {
    auth: authReducer,
    siteConfig: siteConfigReducer
  }
})
