import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  token: localStorage.getItem('token') || null,
  userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
  isAuthenticated: !!localStorage.getItem('token')
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.token = action.payload.token
      state.userInfo = action.payload.userInfo
      state.isAuthenticated = true

      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('userInfo', JSON.stringify(action.payload.userInfo))
    },
    clearAuth: (state) => {
      state.token = null
      state.userInfo = null
      state.isAuthenticated = false

      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})

export const { setAuth, clearAuth } = authSlice.actions
export default authSlice.reducer
