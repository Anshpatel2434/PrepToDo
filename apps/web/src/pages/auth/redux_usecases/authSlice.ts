import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { UserResponse } from "../../../services/apiClient";

// =============================================================================
// Auth State Interface
// =============================================================================
export interface AuthState {
	isLoading: boolean;
	error: string | null;
	signupStep: number; // 1: email, 2: OTP, 3: password/setup
	email: string;
	isEmailVerified: boolean;
	user: UserResponse | null;
	pendingSignup: {
		id: string;
		email: string;
		expiresAt: string;
	} | null;
	forgotPasswordEmail: string | null;
}

// =============================================================================
// Initial State
// =============================================================================
const initialState: AuthState = {
	isLoading: false,
	error: null,
	signupStep: 1,
	email: "",
	isEmailVerified: false,
	user: null,
	pendingSignup: null,
	forgotPasswordEmail: null,
};

// =============================================================================
// Auth Slice
// =============================================================================
const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		startLoading(state) {
			state.isLoading = true;
			state.error = null;
		},

		stopLoading(state) {
			state.isLoading = false;
		},

		otpSent(state, action: PayloadAction<{ email: string }>) {
			state.signupStep = 2;
			state.email = action.payload.email;
			state.isLoading = false;
		},

		otpVerified(state) {
			state.isEmailVerified = true;
			state.signupStep = 3;
			state.isLoading = false;
		},

		authError(state, action: PayloadAction<string>) {
			state.isLoading = false;
			state.error = action.payload;
		},

		clearError(state) {
			state.error = null;
		},

		setUser(state, action: PayloadAction<UserResponse>) {
			state.user = action.payload;
			state.isLoading = false;
			state.error = null;
		},

		clearUser(state) {
			state.user = null;
			state.isLoading = false;
		},

		setPendingSignup(
			state,
			action: PayloadAction<{ id: string; email: string; expiresAt: string }>
		) {
			state.pendingSignup = action.payload;
			state.email = action.payload.email;
		},

		clearPendingSignup(state) {
			state.pendingSignup = null;
		},

		setForgotPasswordEmail(state, action: PayloadAction<string>) {
			state.forgotPasswordEmail = action.payload;
			state.isLoading = false;
		},

		// Restore signup state from localStorage (for refresh persistence)
		restoreSignupState(
			state,
			action: PayloadAction<{
				signupStep: number;
				email: string;
				pendingSignup: { id: string; email: string; expiresAt: string } | null;
			}>
		) {
			state.signupStep = action.payload.signupStep;
			state.email = action.payload.email;
			state.pendingSignup = action.payload.pendingSignup;
		},

		resetAuth(state) {
			Object.assign(state, initialState);
		},
	},
});

// =============================================================================
// Export Actions
// =============================================================================
export const {
	startLoading,
	stopLoading,
	otpSent,
	otpVerified,
	authError,
	clearError,
	setUser,
	clearUser,
	setPendingSignup,
	clearPendingSignup,
	setForgotPasswordEmail,
	restoreSignupState,
	resetAuth,
} = authSlice.actions;

export default authSlice.reducer;
