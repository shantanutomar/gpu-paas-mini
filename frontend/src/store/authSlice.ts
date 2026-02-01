import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  apiKey: string | null;
}

const loadApiKey = (): string | null => {
  try {
    const key = localStorage.getItem('apiKey');
    return key;
  } catch (error) {
    console.error('Failed to load API key from localStorage:', error);
    return null;
  }
};

const saveApiKey = (key: string | null) => {
  try {
    if (key) {
      localStorage.setItem('apiKey', key);
    } else {
      localStorage.removeItem('apiKey');
    }
  } catch (error) {
    console.error('Failed to save API key to localStorage:', error);
  }
};

const initialState: AuthState = {
  apiKey: loadApiKey(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setApiKey: (state, action: PayloadAction<string>) => {
      state.apiKey = action.payload;
      saveApiKey(action.payload);
    },
    clearApiKey: (state) => {
      state.apiKey = null;
      saveApiKey(null);
    },
  },
});

export const { setApiKey, clearApiKey } = authSlice.actions;
export default authSlice.reducer;
