import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  data: null,
  loaded: false
}

const siteStatSlice = createSlice({
  name: 'siteStat',
  initialState,
  reducers: {
    setSiteStat: (state, action) => {
      state.data = action.payload
      state.loaded = true
    }
  }
})

export const { setSiteStat } = siteStatSlice.actions
export default siteStatSlice.reducer
