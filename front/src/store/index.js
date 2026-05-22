import { configureStore } from '@reduxjs/toolkit'
import authReducer from './modules/auth'
import siteConfigReducer from './modules/siteConfig'
import siteStatReducer from './modules/siteStat'

export default configureStore({
  reducer: {
    auth: authReducer,
    siteConfig: siteConfigReducer,
    siteStat: siteStatReducer
  }
})
