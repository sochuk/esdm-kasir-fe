import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    notifications: [],
  },
  reducers: {
    addNotification: (state, action) => {
      // payload: { id, message, type: 'success' | 'error' | 'info', duration }
      const id = Date.now();
      state.notifications.push({
        id,
        message: action.payload.message || 'Informasi',
        type: action.payload.type || 'info',
        duration: action.payload.duration || 3000,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, removeNotification, clearNotifications } = uiSlice.actions;
export default uiSlice.reducer;
