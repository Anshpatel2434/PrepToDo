import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { startLoading, otpSent, otpVerified, authError, setUser, clearUser, setPendingSignup, clearPendingSignup, setForgotPasswordEmail } from "./authSlice";
import type { UserResponse } from "../../../services/apiClient";

// =============================================================================
// Token Storage Utilities
// =============================================================================
const TOKEN_STORAGE_KEY = 'preptodo_access_token';

export function getStoredToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function setStoredToken(token: string): void {
    try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
        console.error('Failed to store token');
    }
}

export function clearStoredToken(): void {
    try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
        console.error('Failed to clear token');
    }
}

// =============================================================================
// Backend API Configuration
// =============================================================================
// For API calls, use empty string in dev (Vite proxy) or VITE_BACKEND_URL in prod
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
// For OAuth redirects, we need the actual backend URL (not proxied)
const OAUTH_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// =============================================================================
// Request Types
// =============================================================================
interface CheckEmailRequest {
    email: string;
    captchaToken?: string;
}

interface SendOtpRequest {
    email: string;
    captchaToken?: string;
}

interface VerifyOtpRequest {
    email: string;
    otp: string;
    pendingSignupId?: string;
}

interface CompleteSignupRequest {
    email: string;
    pendingSignupId: string;
    password?: string;
    skipPassword?: boolean;
}

interface LoginRequest {
    email: string;
    password: string;
    captchaToken?: string;
}

interface ForgotPasswordRequest {
    email: string;
    captchaToken?: string;
}

interface ResetPasswordRequest {
    token: string;
    password: string;
}

interface SetPasswordRequest {
    password: string;
}

interface ResendOtpRequest {
    email: string;
    pendingSignupId: string;
}

interface CheckPendingSignupRequest {
    pendingSignupId: string;
}

// =============================================================================
// Response Types
// =============================================================================
interface CheckEmailResponse {
    exists: boolean;
    has_password: boolean;
}

interface SendOtpResponse {
    pending_signup_id: string;
    expires_at: string;
    message: string;
}

interface VerifyOtpResponse {
    verified: boolean;
    pending_signup_id: string;
    email: string;
}

interface MessageResponse {
    message: string;
}

interface AuthResponseWithToken {
    user: UserResponse;
    message: string;
    accessToken?: string;
}

interface CheckPendingSignupResponse {
    valid: boolean;
    email: string;
    expires_at: string;
}

// =============================================================================
// API Error Type
// =============================================================================
interface BackendError {
    data: {
        success: false;
        error: {
            code: string;
            message: string;
            details?: unknown;
            retryAfterSeconds?: number;
        };
    };
    status: number;
}

// Helper to extract error message
function getErrorMessage(error: unknown): string {
    if ((error as BackendError)?.data?.error?.message) {
        return (error as BackendError).data.error.message;
    }
    if ((error as { message?: string })?.message) {
        return (error as { message: string }).message;
    }
    return 'An unexpected error occurred';
}

// =============================================================================
// Auth API
// =============================================================================
// Custom base query that automatically includes Authorization header
const rawBaseQuery = fetchBaseQuery({
    baseUrl: `${BACKEND_URL}/api/auth`,
    credentials: 'include', // Include cookies in requests
    prepareHeaders: (headers) => {
        const token = getStoredToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

// Refresh token state (to prevent concurrent refresh attempts)
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Function to attempt token refresh
async function attemptTokenRefresh(): Promise<boolean> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json() as { success: boolean; data?: { accessToken: string } };
        if (data.success && data.data?.accessToken) {
            setStoredToken(data.data.accessToken);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

// Wrapper to handle token expiration with automatic refresh
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    // If unauthorized (401), try to refresh the token
    if (result.error && result.error.status === 401) {
        // Use mutex to prevent concurrent refresh attempts
        if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = attemptTokenRefresh().finally(() => {
                isRefreshing = false;
                refreshPromise = null;
            });
        }

        // All concurrent requests wait for the same refresh promise
        const refreshSuccess = await refreshPromise;

        if (refreshSuccess) {
            // Retry the original request with new token
            result = await rawBaseQuery(args, api, extraOptions);
        } else {
            // Refresh failed - clear everything and let user re-login
            clearStoredToken();
            api.dispatch(clearUser());
        }
    }

    return result;
};

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: baseQueryWithAuth,
    tagTypes: ["Auth", "User"],
    endpoints: (builder) => ({
        // Check if email exists
        checkEmail: builder.mutation<CheckEmailResponse, CheckEmailRequest>({
            query: (body) => ({
                url: '/check-email',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: true; data: CheckEmailResponse }) => response.data,
        }),

        // Send OTP to email for signup
        sendOtp: builder.mutation<SendOtpResponse, SendOtpRequest>({
            query: (body) => ({
                url: '/send-otp',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: true; data: SendOtpResponse }) => response.data,
            onQueryStarted: async ({ email }, { dispatch, queryFulfilled }) => {
                try {
                    dispatch(startLoading());
                    const { data } = await queryFulfilled;
                    dispatch(otpSent({ email }));
                    dispatch(setPendingSignup({ id: data.pending_signup_id, email, expiresAt: data.expires_at }));
                    // Store in localStorage for persistence across refresh
                    localStorage.setItem('pendingSignupId', data.pending_signup_id);
                    localStorage.setItem('pendingSignupEmail', email);
                } catch (err) {
                    dispatch(authError(getErrorMessage(err)));
                }
            },
        }),

        // Verify OTP
        verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpRequest>({
            query: (body) => ({
                url: '/verify-otp',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: true; data: VerifyOtpResponse }) => response.data,
            onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
                try {
                    dispatch(startLoading());
                    await queryFulfilled;
                    dispatch(otpVerified());
                } catch (err) {
                    dispatch(authError(getErrorMessage(err)));
                }
            },
        }),

        // Complete signup with password
        completeSignup: builder.mutation<AuthResponseWithToken, CompleteSignupRequest>({
            query: (body) => ({
                url: '/complete-signup',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: true; data: AuthResponseWithToken }) => response.data,
            invalidatesTags: ['User'],
            onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
                try {
                    dispatch(startLoading());
                    const { data } = await queryFulfilled;
                    // Store access token in localStorage
                    if (data.accessToken) {
                        setStoredToken(data.accessToken);
                    }
                    dispatch(setUser(data.user));
                    dispatch(clearPendingSignup());
                    // Clear localStorage
                    localStorage.removeItem('pendingSignupId');
                    localStorage.removeItem('pendingSignupEmail');
                } catch (err) {
                    dispatch(authError(getErrorMessage(err)));
                }
            },
        }),

        // Login with email and password
        login: builder.mutation<AuthResponseWithToken, LoginRequest>({
            query: (body) => ({
                url: '/login',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: true; data: AuthResponseWithToken }) => response.data,
            invalidatesTags: ['User'],
            onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
                try {
                    dispatch(startLoading());
                    const { data } = await queryFulfilled;
                    // Store access token in localStorage
                    if (data.accessToken) {
                        setStoredToken(data.accessToken);
                    }
                    dispatch(setUser(data.user));
                } catch (err) {
                    dispatch(authError(getErrorMessage(err)));
                }
            },
        }),

        // Logout
        logout: builder.mutation<MessageResponse, void>({
            query: () => ({
                url: '/logout',
                method: 'POST',
            }),
            transformResponse: (response: { success: true; data: MessageResponse }) => response.data,
            invalidatesTags: ['User'],
            onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
                try {
                    await queryFulfilled;
                    // Clear token from localStorage
                    clearStoredToken();
                    dispatch(clearUser());
                } catch (err) {
                    // Still clear user and token on error
                    clearStoredToken();
                    dispatch(clearUser());
                    console.error('Logout error:', err);
                }
            },
        }),

        // Get current user
        // Uses queryFn to validate token existence first - prevents stale cache data
        // when OAuth flow is cancelled via browser back button
        fetchUser: builder.query<UserResponse | null, void>({
            queryFn: async (_arg, _queryApi, _extraOptions, fetchWithBQ) => {
                // If no token exists, return null immediately without making a network request
                // This prevents RTK Query from returning stale cached user data
                const token = getStoredToken();
                if (!token) {
                    return { data: null };
                }

                // Token exists, make the API call
                const result = await fetchWithBQ('/me');
                if (result.error) {
                    // On error (e.g., 401), return null
                    return { data: null };
                }

                const response = result.data as { success: true; data: { user: UserResponse } };
                return { data: response.data.user };
            },
            providesTags: ['User'],
        }),

        // Forgot password
        forgotPassword: builder.mutation<MessageResponse, ForgotPasswordRequest>({
            query: (body) => ({
                url: '/forgot-password',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: true; data: MessageResponse }) => response.data,
            onQueryStarted: async ({ email }, { dispatch, queryFulfilled }) => {
                try {
                    dispatch(startLoading());
                    await queryFulfilled;
                    dispatch(setForgotPasswordEmail(email));
                } catch (err) {
                    dispatch(authError(getErrorMessage(err)));
                }
            },
        }),

        // Reset password
        resetPassword: builder.mutation<MessageResponse, ResetPasswordRequest>({
            query: (body) => ({
                url: '/reset-password',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: true; data: MessageResponse }) => response.data,
        }),

        // Set password (for OAuth users)
        setPassword: builder.mutation<MessageResponse, SetPasswordRequest>({
            query: (body) => ({
                url: '/set-password',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: true; data: MessageResponse }) => response.data,
            invalidatesTags: ['User'],
        }),

        // Resend OTP
        resendOtp: builder.mutation<SendOtpResponse, ResendOtpRequest>({
            query: (body) => ({
                url: '/resend-otp',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: true; data: SendOtpResponse }) => response.data,
            onQueryStarted: async (_args, { dispatch, queryFulfilled }) => {
                try {
                    dispatch(startLoading());
                    const { data } = await queryFulfilled;
                    dispatch(setPendingSignup({
                        id: data.pending_signup_id,
                        email: _args.email,
                        expiresAt: data.expires_at
                    }));
                } catch (err) {
                    dispatch(authError(getErrorMessage(err)));
                }
            },
        }),

        // Check pending signup (for refresh persistence)
        checkPendingSignup: builder.mutation<CheckPendingSignupResponse, CheckPendingSignupRequest>({
            query: (body) => ({
                url: '/check-pending-signup',
                method: 'POST',
                body,
            }),
            transformResponse: (response: { success: true; data: CheckPendingSignupResponse }) => response.data,
        }),

        // Exchange OAuth token
        exchangeToken: builder.mutation<{ message: string }, { token: string }>({
            query: (body) => ({
                url: '/exchange-token',
                method: 'POST',
                body,
            }),
            invalidatesTags: ["User"],
            onQueryStarted: async ({ token }, { queryFulfilled }) => {
                // Store the OAuth token in localStorage immediately
                // This ensures fetchUser query has a valid token on subsequent calls
                setStoredToken(token);
                try {
                    await queryFulfilled;
                } catch {
                    // If the exchange fails, clear the token
                    clearStoredToken();
                }
            },
        }),
    }),
});

// =============================================================================
// Export Hooks
// =============================================================================
export const {
    useCheckEmailMutation,
    useSendOtpMutation,
    useVerifyOtpMutation,
    useCompleteSignupMutation,
    useLoginMutation,
    useLogoutMutation,
    useFetchUserQuery,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useSetPasswordMutation,
    useResendOtpMutation,
    useCheckPendingSignupMutation,
    useExchangeTokenMutation,
} = authApi;

// =============================================================================
// Google OAuth Helper
// =============================================================================

// Auth paths that should never be used as post-login redirect destinations
const AUTH_PATHS = ['/auth', '/auth/', '/auth/callback', '/auth/reset-password'];

/**
 * Sanitize redirect URL to prevent redirecting to auth pages after login.
 * Returns null if the path should be filtered out.
 */
function sanitizeRedirectUrl(path: string | undefined | null): string | null {
    if (!path) return null;
    // Normalize path
    const normalizedPath = path.toLowerCase().split('?')[0];
    // Filter out auth-related paths
    if (AUTH_PATHS.some(authPath => normalizedPath === authPath || normalizedPath.startsWith('/auth/'))) {
        return null;
    }
    return path;
}

export function initiateGoogleLogin(returnTo?: string) {
    const params = new URLSearchParams();
    if (returnTo) params.set('returnTo', returnTo);

    // Store current path for redirect after auth (if it's not an auth page)
    const safeRedirect = sanitizeRedirectUrl(returnTo || window.location.pathname);
    if (safeRedirect) {
        localStorage.setItem('post_auth_redirect', safeRedirect);
    } else {
        localStorage.removeItem('post_auth_redirect');
    }

    // Redirect to backend OAuth endpoint (must use actual backend URL, not proxy)
    window.location.href = `${OAUTH_BACKEND_URL}/api/auth/google?${params.toString()}`;
}