import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import authReducer from '../features/auth/authSlice';
import inventoryReducer from '../features/inventory/inventorySlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    inventory: inventoryReducer,
    ui: uiReducer
  },
});
