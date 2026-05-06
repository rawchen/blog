import { createSlice } from '@reduxjs/toolkit'

const SITE_CONFIG_KEY = 'site_config'

const getCachedConfig = () => {
  try {
    const cached = localStorage.getItem(SITE_CONFIG_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

const initialState = {
  data: getCachedConfig(),
  loaded: false
}

const siteConfigSlice = createSlice({
  name: 'siteConfig',
  initialState,
  reducers: {
    setSiteConfig: (state, action) => {
      state.data = action.payload
      state.loaded = true
      localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(action.payload))
    }
  }
})

export const { setSiteConfig } = siteConfigSlice.actions
export default siteConfigSlice.reducer
