import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

// Local auth UI & flow state (Redux slice)
export interface AuthState {
	isLoading: boolean;
	error: string | null;
	signupStep: number; // 1: email, 2: OTP, 3: password/setup
	email: string;
	isEmailVerified: boolean;
}

const initialState: AuthState = {
	isLoading: false,
	error: null,
	signupStep: 1,
	email: "",
	isEmailVerified: false,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		startLoading(state) {
			state.isLoading = true;
			state.error = null;
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

		resetAuth(state) {
			Object.assign(state, initialState);
		},
	},
});

export const { startLoading, otpSent, otpVerified, authError, resetAuth } =
	authSlice.actions;

export default authSlice.reducer;
