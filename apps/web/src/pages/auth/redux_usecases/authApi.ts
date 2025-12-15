import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../../services/apiClient";
import type { UserItem } from "../../../types";

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
    otp: string;
}

interface FinalizeSignupRequest {
    email: string;
    password?: string;
}

interface ConfirmTokenRequest {
    token: string;
}

// Local auth state interface (managed by RTK Query cache)
interface AuthState {
    user: UserItem | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    confirmationToken: string | null;
    signupStep: number; // 1: email, 2: OTP, 3: password/setup
    email: string;
    isEmailVerified: boolean;
}

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['Auth'],
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
            onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    if (data?.success) {
                        // Update auth state
                        dispatch(authApi.util.updateQueryData('getAuthState', undefined, (draft) => {
                            if (draft) {
                                draft.signupStep = 2;
                                draft.isLoading = false;
                                draft.error = null;
                            }
                        }));
                    }
                } catch {
                    // Error is handled by the queryFn
                }
            },
        }),

        // Query to get current auth state
        getAuthState: builder.query<AuthState, void>({
            queryFn: () => {
                // Return current state from localStorage or default state
                const savedToken = sessionStorage.getItem('auth_token');
                const savedUser = sessionStorage.getItem('auth_user');
                
                return {
                    data: {
                        user: savedUser ? JSON.parse(savedUser) : null,
                        isAuthenticated: !!savedToken,
                        isLoading: false,
                        error: null,
                        confirmationToken: savedToken,
                        signupStep: 1,
                        email: '',
                        isEmailVerified: false,
                    } as AuthState
                };
            },
            providesTags: ['Auth'],
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
            onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    const result = data as { success: boolean; token: string };
                    if (result?.success) {
                        // Update auth state
                        dispatch(authApi.util.updateQueryData('getAuthState', undefined, (draft) => {
                            if (draft) {
                                draft.signupStep = 3;
                                draft.isEmailVerified = true;
                                draft.confirmationToken = result.token;
                                draft.error = null;
                            }
                        }));
                    }
                } catch {
                    // Error is handled by the queryFn
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
            onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    const result = data as { success: boolean; user: UserItem };
                    if (result?.success && result.user) {
                        // Update auth state with user data
                        dispatch(authApi.util.updateQueryData('getAuthState', undefined, (draft) => {
                            if (draft) {
                                draft.user = result.user;
                                draft.isAuthenticated = true;
                                draft.signupStep = 1;
                                draft.isEmailVerified = false;
                                draft.confirmationToken = null;
                                draft.error = null;
                            }
                        }));
                        
                        // Store in session
                        sessionStorage.setItem('auth_token', result.user.confirmationToken);
                        sessionStorage.setItem('auth_user', JSON.stringify(result.user));
                    }
                } catch {
                    // Error is handled by the queryFn
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
            },
            onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    const result = data as { user?: UserItem };
                    if (result?.user) {
                        // Update auth state
                        dispatch(authApi.util.updateQueryData('getAuthState', undefined, (draft) => {
                            if (draft) {
                                draft.user = result.user!;
                                draft.isAuthenticated = true;
                                draft.error = null;
                            }
                        }));
                    }
                } catch {
                    // Error is handled by the queryFn
                }
            },
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
            },
            onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    const result = data as { user?: UserItem; session?: { access_token?: string } };
                    if (result?.user) {
                        // Update auth state
                        dispatch(authApi.util.updateQueryData('getAuthState', undefined, (draft) => {
                            if (draft) {
                                draft.user = result.user!;
                                draft.isAuthenticated = true;
                                draft.error = null;
                            }
                        }));
                        
                        // Store in session
                        sessionStorage.setItem('auth_token', result.session?.access_token || '');
                        sessionStorage.setItem('auth_user', JSON.stringify(result.user));
                    }
                } catch {
                    // Error is handled by the queryFn
                }
            },
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
            onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    const result = data as { success: boolean; user?: UserItem };
                    if (result?.success && result?.user) {
                        // Update auth state
                        dispatch(authApi.util.updateQueryData('getAuthState', undefined, (draft) => {
                            if (draft) {
                                draft.user = result.user!;
                                draft.isAuthenticated = true;
                                draft.confirmationToken = args.token;
                                draft.error = null;
                            }
                        }));
                    }
                } catch {
                    // Error is handled by the queryFn
                }
            },
        }),

        // Logout
        logout: builder.mutation<{ success: boolean }, void>({
            queryFn: async () => {
                try {
                    const { error } = await supabase.auth.signOut();
                    if (error) return { error: { status: 'CUSTOM_ERROR', data: error.message } };
                    
                    // Clear session storage
                    sessionStorage.removeItem('auth_token');
                    sessionStorage.removeItem('auth_user');
                    
                    return { data: { success: true } };
                } catch (err) {
                    const error = err as { message?: string };
                    return { error: { status: 'CUSTOM_ERROR', data: error.message || 'Logout failed' } };
                }
            },
            onQueryStarted: async (_args, { dispatch }) => {
                // Reset auth state immediately for better UX
                dispatch(authApi.util.updateQueryData('getAuthState', undefined, (draft) => {
                    if (draft) {
                        draft.user = null;
                        draft.isAuthenticated = false;
                        draft.error = null;
                        draft.confirmationToken = null;
                        draft.signupStep = 1;
                        draft.email = '';
                        draft.isEmailVerified = false;
                    }
                }));
            },
        }),
    })
})

// Export hooks for usage in functional components
export const {
    // Queries
    useGetAuthStateQuery,
    
    // Mutations
    useSendOtpEmailMutation,
    useVerifyOtpMutation,
    useFinalizeSignupMutation,
    useSignUpMutation,
    useLoginMutation,
    useLoginWithGoogleMutation,
    useConfirmUserMutation,
    useLogoutMutation,
} = authApi;