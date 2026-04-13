import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export const fetchProducts = createAsyncThunk('inventory/fetchProducts', async (_, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.get('/api/inventory');
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch inventory');
    }
});

export const addProduct = createAsyncThunk('inventory/addProduct', async (productData, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.post('/api/inventory', productData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to add product');
    }
});

export const editProduct = createAsyncThunk('inventory/editProduct', async ({ id, data }, { rejectWithValue }) => {
    try {
        const response = await axiosInstance.put(`/api/inventory/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to edit product');
    }
});

export const removeProduct = createAsyncThunk('inventory/removeProduct', async (id, { rejectWithValue }) => {
    try {
        await axiosInstance.delete(`/api/inventory/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
});

const initialState = {
    items: [],
    status: 'idle',
    error: null
};

const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        clearInventoryError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Add
            .addCase(addProduct.fulfilled, (state, action) => {
                // Prepend to top since it comes back ordered latest DESC usually
                state.items.unshift(action.payload);
            })
            // Edit
            .addCase(editProduct.fulfilled, (state, action) => {
                const index = state.items.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            // Delete
            .addCase(removeProduct.fulfilled, (state, action) => {
                state.items = state.items.filter(p => p.id !== action.payload);
            });
    }
});

export const { clearInventoryError } = inventorySlice.actions;
export default inventorySlice.reducer;
