import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";
import type { UserItem } from "../../../types";

//type for the data recieved from the form
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
    otp: string;
}

interface FinalizeSignupRequest {
    email: string;
    password?: string;
}

interface ConfirmTokenRequest {
    token: string;
}

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        // Step 1: Send OTP Email
        sendOtpEmail: builder.mutation<{ success: boolean; message: string }, SendEmailRequest>({
            queryFn: async ({ email }) => {
                try {
                    const { data, error } = await supabase.functions.invoke('send-otp-email', {
                        body: { email }
                    });
                    
                    if (error) return { error: { status: 'CUSTOM_ERROR', data: error.message } };
                    return { data: data || { success: true, message: 'OTP sent successfully' } };
                } catch (err) {
                    const error = err as { message?: string };
                    return { error: { status: 'CUSTOM_ERROR', data: error.message || 'Failed to send OTP' } };
                }
            },
        }),

        // Step 2: Verify OTP
        verifyOtp: builder.mutation<{ success: boolean; token: string; message: string }, VerifyOtpRequest>({
            queryFn: async ({ email, otp }) => {
                try {
                    const { data, error } = await supabase.functions.invoke('verify-otp', {
                        body: { email, otp }
                    });
                    
                    if (error) return { error: { status: 'CUSTOM_ERROR', data: error.message } };
                    return { data };
                } catch (err) {
                    const error = err as { message?: string };
                    return { error: { status: 'CUSTOM_ERROR', data: error.message || 'Failed to verify OTP' } };
                }
            },
        }),

        // Step 3: Finalize signup (set password or skip)
        finalizeSignup: builder.mutation<{ success: boolean; user: UserItem; message: string }, FinalizeSignupRequest>({
            queryFn: async ({ email, password }) => {
                try {
                    const { data, error } = await supabase.functions.invoke('finalize-signup', {
                        body: { email, password }
                    });
                    
                    if (error) return { error: { status: 'CUSTOM_ERROR', data: error.message } };
                    return { data };
                } catch (err) {
                    const error = err as { message?: string };
                    return { error: { status: 'CUSTOM_ERROR', data: error.message || 'Failed to complete signup' } };
                }
            },
        }),

        // Traditional signup (fallback)
        signUp: builder.mutation<unknown, AuthCredentials>({
            queryFn: async ({ email, password }) => {
                try {
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password
                    });
                    if (error) return { error: { status: 'CUSTOM_ERROR', data: error.message } };
                    return { data };
                } catch (err) {
                    const error = err as { message?: string };
                    return { error: { status: 'CUSTOM_ERROR', data: error.message || 'Signup failed' } };
                }
            }
        }),

        // Traditional login
        login: builder.mutation<unknown, AuthCredentials>({
            queryFn: async ({ email, password }) => {
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password
                    });
                    if (error) return { error: { status: 'CUSTOM_ERROR', data: error.message } };
                    return { data };
                } catch (err) {
                    const error = err as { message?: string };
                    return { error: { status: 'CUSTOM_ERROR', data: error.message || 'Login failed' } };
                }
            }
        }),

        // Google OAuth login
        loginWithGoogle: builder.mutation<unknown, void>({
            queryFn: async () => {
                try {
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: `${window.location.origin}/auth/callback`
                        }
                    });
                    if (error) return { error: { status: 'CUSTOM_ERROR', data: error.message } };
                    return { data };
                } catch (err) {
                    const error = err as { message?: string };
                    return { error: { status: 'CUSTOM_ERROR', data: error.message || 'Google login failed' } };
                }
            },
        }),

        // Confirm user session with token
        confirmUser: builder.mutation<{ success: boolean; user: UserItem | null }, ConfirmTokenRequest>({
            queryFn: async ({ token }) => {
                try {
                    const { data, error } = await supabase.functions.invoke('confirm-user', {
                        body: { token }
                    });
                    
                    if (error) return { error: { status: 'CUSTOM_ERROR', data: error.message } };
                    return { data };
                } catch (err) {
                    const error = err as { message?: string };
                    return { error: { status: 'CUSTOM_ERROR', data: error.message || 'Failed to confirm user' } };
                }
            },
        }),

        // Logout
        logout: builder.mutation<{ success: boolean }, void>({
            queryFn: async () => {
                try {
                    const { error } = await supabase.auth.signOut();
                    if (error) return { error: { status: 'CUSTOM_ERROR', data: error.message } };
                    return { data: { success: true } };
                } catch (err) {
                    const error = err as { message?: string };
                    return { error: { status: 'CUSTOM_ERROR', data: error.message || 'Logout failed' } };
                }
            },
        }),
    })
})

// Export hooks for usage in functional components
export const {
    useSendOtpEmailMutation,
    useVerifyOtpMutation,
    useFinalizeSignupMutation,
    useSignUpMutation,
    useLoginMutation,
    useLoginWithGoogleMutation,
    useConfirmUserMutation,
    useLogoutMutation,
} = authApi;