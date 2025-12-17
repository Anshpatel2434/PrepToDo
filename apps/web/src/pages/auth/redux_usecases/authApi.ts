import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";
import { startLoading, otpSent, otpVerified, authError } from "./authSlice";

// Types for form data
interface AuthCredentials {
	email: string;
	password: string;
}

// Types for the 3-step signup process
interface SendEmailRequest {
	email: string;
}

interface VerifyOtpRequest {
	email: string;
	token: string;
}

interface updateUserPassword {
	newPassword: string;
}
interface CheckUserExistsResponse {
	exists: boolean;
}

export const authApi = createApi({
	reducerPath: "authApi",
	baseQuery: fakeBaseQuery(),
	tagTypes: ["Auth"],
	endpoints: (builder) => ({
		//SIGNUP STEP 1: Send the OTP to the user's email
		sendOtpToEmail: builder.mutation<any, SendEmailRequest>({
			queryFn: async ({ email }) => {
				try {
					const { data, error } = await supabase.auth.signInWithOtp({
						email: email,
					});

					if (error)
						return { error: { status: "CUSTOM_ERROR", data: error.message } };
					return {
						data: data,
						success: true,
						message: "OTP sent successfully",
					};
				} catch (err) {
					const error = err as { message?: string };
					return {
						error: {
							status: "CUSTOM_ERROR",
							data: error.message || "Failed to send OTP",
						},
					};
				}
			},
			onQueryStarted: async ({ email }, { dispatch, queryFulfilled }) => {
				try {
					dispatch(startLoading());
					await queryFulfilled;
					// Update auth state

					dispatch(otpSent({ email }));
				} catch (err: any) {
					dispatch(authError(err?.error?.data || "Failed to send OTP"));
				}
			},
		}),

		// Step 2: Verify OTP
		verifyUserOtp: builder.mutation<any, VerifyOtpRequest>({
			queryFn: async ({ email, token }) => {
				try {
					const { data, error } = await supabase.auth.verifyOtp({
						email,
						token,
						type: "email",
					});

					if (error)
						return { error: { status: "CUSTOM_ERROR", data: error.message } };
					return { data };
				} catch (err) {
					const error = err as { message?: string };
					return {
						error: {
							status: "CUSTOM_ERROR",
							data: error.message || "Failed to verify OTP",
						},
					};
				}
			},
			onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
				try {
					dispatch(startLoading());
					await queryFulfilled;
					dispatch(otpVerified());
					// 🚀 FETCH USER IMMEDIATELY
					dispatch(
						authApi.endpoints.fetchUser.initiate(undefined, {
							forceRefetch: true,
						})
					);
				} catch (err: any) {
					dispatch(authError(err?.error?.data || "Invalid OTP"));
				}
			},
		}),

		//SIGNUP STEP 3: Set the password for the now-logged-in user
		updateUserPassword: builder.mutation<any, updateUserPassword>({
			queryFn: async ({ newPassword }) => {
				try {
					console.log(
						"$$$$$$$$$$$$$$$$$$$ we have come here in updatePassword call"
					);
					const { data, error } = await supabase.auth.updateUser({
						password: newPassword,
					});
					console.log("Is the password updated ? ");
					console.log(data);

					if (error) {
						console.log("$$$$$$$$$$$$$$$$$$$ error in updateUserPassword");
						console.log(error);
						return { error: { status: "CUSTOM_ERROR", data: error.message } };
					}
					return { data };
				} catch (err) {
					const error = err as { message?: string };
					console.log("$$$$$$$$$$$$$$$$$$$ error in updateUserPassword");
					console.log(err);
					return {
						error: {
							status: "CUSTOM_ERROR",
							data: error.message || "Failed to complete signup",
						},
					};
				}
			},
		}),

		// Traditional signup (fallback)
		signUp: builder.mutation<unknown, AuthCredentials>({
			queryFn: async ({ email, password }) => {
				try {
					const { data, error } = await supabase.auth.signUp({
						email,
						password,
					});
					if (error)
						return { error: { status: "CUSTOM_ERROR", data: error.message } };
					return { data };
				} catch (err) {
					const error = err as { message?: string };
					return {
						error: {
							status: "CUSTOM_ERROR",
							data: error.message || "Signup failed",
						},
					};
				}
			},
		}),

		// Traditional login
		login: builder.mutation<unknown, AuthCredentials>({
			queryFn: async ({ email, password }) => {
				try {
					const { data, error } = await supabase.auth.signInWithPassword({
						email,
						password,
					});
					if (error)
						return { error: { status: "CUSTOM_ERROR", data: error.message } };
					return { data };
				} catch (err) {
					const error = err as { message?: string };
					return {
						error: {
							status: "CUSTOM_ERROR",
							data: error.message || "Login failed",
						},
					};
				}
			},
			onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
				try {
					await queryFulfilled;
					// 🚀 FETCH USER IMMEDIATELY
					dispatch(
						authApi.endpoints.fetchUser.initiate(undefined, {
							forceRefetch: true,
						})
					);
				} catch (err: any) {
					console.log("error in login onQueryStarted");
					console.log(err);
				}
			},
		}),

		// Google OAuth login
		loginWithGoogle: builder.mutation<unknown, void>({
			queryFn: async () => {
				try {
					console.log("so now what we are not even reaching here???");
					const { data, error } = await supabase.auth.signInWithOAuth({
						provider: "google",
						options: {
							redirectTo: `${window.location.origin}/auth/callback`,
						},
					});
					if (error) {
						console.log("error while google login");
						console.log(error);

						return { error: { status: "CUSTOM_ERROR", data: error.message } };
					}
					return { data };
				} catch (err) {
					const error = err as { message?: string };
					console.log("error while google login");
					console.log(err);
					return {
						error: {
							status: "CUSTOM_ERROR",
							data: error.message || "Google login failed",
						},
					};
				}
			},
			onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
				try {
					await queryFulfilled;
					// 🚀 FETCH USER IMMEDIATELY
					dispatch(
						authApi.endpoints.fetchUser.initiate(undefined, {
							forceRefetch: true,
						})
					);
				} catch (err: any) {
					console.log("error in loginWithGoogle onQueryStarted");
					console.log(err);
				}
			},
		}),

		// Logout
		logout: builder.mutation<{ success: boolean }, void>({
			queryFn: async () => {
				try {
					const { error } = await supabase.auth.signOut();
					if (error)
						return { error: { status: "CUSTOM_ERROR", data: error.message } };

					return { data: { success: true } };
				} catch (err) {
					const error = err as { message?: string };
					return {
						error: {
							status: "CUSTOM_ERROR",
							data: error.message || "Logout failed",
						},
					};
				}
			},
			onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
				try {
					await queryFulfilled;
					// 🚀 FETCH USER IMMEDIATELY
					dispatch(
						authApi.endpoints.fetchUser.initiate(undefined, {
							forceRefetch: true,
						})
					);
				} catch (err: any) {
					console.log("error in logging out onQueryStarted");
					console.log(err);
				}
			},
		}),

		//to get the current user
		fetchUser: builder.query<any, void>({
			queryFn: async () => {
				console.log(
					"---------------------- Fetch user called --------------------------------------"
				);
				try {
					const {
						data: { session },
						error,
					} = await supabase.auth.getSession();
					if (error) {
						return {
							error: { status: "CUSTOM_ERROR", data: error.message },
						};
					}
					return { data: session?.user, status: "success", isLoggedIn: true };
				} catch (err) {
					const error = err as { message?: string };
					return {
						error: {
							status: "CUSTOM_ERROR",
							data: error.message || "Fetching User failed",
						},
					};
				}
			},
		}),

		checkUserExists: builder.mutation<
			CheckUserExistsResponse,
			SendEmailRequest
		>({
			queryFn: async ({ email }) => {
				try {
					const { data, error } = await supabase
						.from("user_profiles")
						.select("id")
						.eq("email", email)
						.limit(1);

					if (error) {
						return {
							error: {
								status: "CUSTOM_ERROR",
								data: error.message,
							},
						};
					}

					return {
						data: {
							exists: data.length > 0,
						},
					};
				} catch (err: any) {
					return {
						error: {
							status: "CUSTOM_ERROR",
							data: err.message || "Failed to check user",
						},
					};
				}
			},
		}),
	}),
});

// Export hooks for usage in functional components
export const {
	//function queries
	useSignUpMutation,
	useLoginMutation,
	useLoginWithGoogleMutation,
	useLogoutMutation,
	useFetchUserQuery,
	useSendOtpToEmailMutation,
	useVerifyUserOtpMutation,
	useUpdateUserPasswordMutation,
	useCheckUserExistsMutation,
} = authApi;
