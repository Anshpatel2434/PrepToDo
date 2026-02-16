// =============================================================================
// Auth Feature - Type Definitions
// =============================================================================

export interface UserResponse {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    provider: string; // Derived from raw_app_meta_data
    has_password: boolean;
    role: string;
    created_at: string | null;
    updated_at: string | null;
    ai_insights_remaining?: number;
    customized_mocks_remaining?: number;
}

export interface CheckEmailResponse {
    exists: boolean;
    hasPassword: boolean;
}

export interface SendOtpResponse {
    pending_signup_id: string;
    expires_at: string;
    message: string;
}

export interface VerifyOtpResponse {
    verified: boolean;
    pending_signup_id: string;
    email: string;
}

export interface LoginResponse {
    user: UserResponse;
    message: string;
    accessToken?: string; // JWT for localStorage storage
}

export interface CheckPendingSignupResponse {
    valid: boolean;
    email?: string;
    expires_at?: string;
}

export interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
}

// App metadata stored in raw_app_meta_data
export interface AppMetaData {
    provider?: string;
    google_id?: string;
    providers?: string[];
}

// Response from refresh token endpoint
export interface RefreshTokenResponse {
    accessToken: string;
    user: UserResponse;
}
