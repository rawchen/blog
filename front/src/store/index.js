import { configureStore } from '@reduxjs/toolkit'
import authReducer from './modules/auth'

export default configureStore({
  reducer: {
    auth: authReducer
  }
})
