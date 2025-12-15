import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserItem } from '../../../types';

export interface AuthState {
  user: UserItem | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  confirmationToken: string | null;
  signupStep: number; // 1: email, 2: OTP, 3: password/setup
  email: string;
  isEmailVerified: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  confirmationToken: null,
  signupStep: 1,
  email: '',
  isEmailVerified: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Auth actions
    setUser: (state, action: PayloadAction<UserItem | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.error = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Signup flow actions
    setEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },

    nextSignupStep: (state) => {
      state.signupStep = Math.min(state.signupStep + 1, 3);
    },

    previousSignupStep: (state) => {
      state.signupStep = Math.max(state.signupStep - 1, 1);
    },

    resetSignupFlow: (state) => {
      state.signupStep = 1;
      state.email = '';
      state.isEmailVerified = false;
      state.confirmationToken = null;
      state.error = null;
    },

    setEmailVerified: (state, action: PayloadAction<boolean>) => {
      state.isEmailVerified = action.payload;
    },

    setConfirmationToken: (state, action: PayloadAction<string | null>) => {
      state.confirmationToken = action.payload;
    },

    // Logout
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.confirmationToken = null;
      state.signupStep = 1;
      state.email = '';
      state.isEmailVerified = false;
      state.error = null;
    },
  },
});

export const {
  setUser,
  setLoading,
  setError,
  clearError,
  setEmail,
  nextSignupStep,
  previousSignupStep,
  resetSignupFlow,
  setEmailVerified,
  setConfirmationToken,
  logout,
} = authSlice.actions;

export default authSlice.reducer;