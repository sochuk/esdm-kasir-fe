import { createSlice } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

const token = localStorage.getItem('token');

const initialState = {
  isAuthenticated: false,
  user: null,
  status: token ? 'loading' : 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.status = 'loading';
      state.error = null;
    },
    checkAuthStart(state) {
      state.status = 'loading';
      state.isAuthenticated = false;
    },
    loginSuccess(state, action) {
      state.status = 'succeeded';
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    loginFailure(state, action) {
      state.status = 'failed';
      state.error = action.payload;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('token');
    },
    updateUser(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  },
});

export const { loginStart, checkAuthStart, loginSuccess, loginFailure, logout, updateUser } = authSlice.actions;

export const fetchMe = () => async (dispatch) => {
  try {
    const res = await axiosInstance.get('/api/auth/me');
    dispatch(updateUser(res.data));
  } catch(e) {
    console.error('Failed to fetch me', e);
  }
};

// Async login action connecting to the real Express backend
export const loginUser = (credentials) => async (dispatch) => {
  dispatch(loginStart());
  try {
    const response = await axiosInstance.post('/api/auth/login', credentials);
    
    // Server expected return format: { token, user: { id, username, name, role } }
    const { token, user } = response.data;
    
    // Temporarily save token if needed (localStorage)
    localStorage.setItem('token', token);
    
    dispatch(loginSuccess(user));
  } catch (err) {
    const errorMessage = err.response?.data?.error || err.message || 'Login failed';
    dispatch(loginFailure(errorMessage));
  }
};

export default authSlice.reducer;
