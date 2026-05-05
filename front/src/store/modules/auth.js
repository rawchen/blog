import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
  permissions: JSON.parse(localStorage.getItem('permissions') || '[]'),
  roles: JSON.parse(localStorage.getItem('roles') || '[]'),
  isAuthenticated: !!localStorage.getItem('token')
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.token = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.userInfo = action.payload.userInfo
      state.permissions = action.payload.permissions || []
      state.roles = action.payload.roles || []
      state.isAuthenticated = true
      
      localStorage.setItem('token', action.payload.accessToken)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
      localStorage.setItem('userInfo', JSON.stringify(action.payload.userInfo))
      localStorage.setItem('permissions', JSON.stringify(state.permissions))
      localStorage.setItem('roles', JSON.stringify(state.roles))
    },
    clearAuth: (state) => {
      state.token = null
      state.refreshToken = null
      state.userInfo = null
      state.permissions = []
      state.roles = []
      state.isAuthenticated = false
      
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('permissions')
      localStorage.removeItem('roles')
    }
  }
})

export const { setAuth, clearAuth } = authSlice.actions
export default authSlice.reducer
