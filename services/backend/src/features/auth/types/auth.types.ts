// =============================================================================
// Auth Feature - Type Definitions
// =============================================================================

export interface UserResponse {
    id: string;
    email: string;
    emailConfirmedAt: string | null;
    provider: string; // Derived from raw_app_meta_data
    hasPassword: boolean;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface CheckEmailResponse {
    exists: boolean;
    hasPassword: boolean;
}

export interface SendOtpResponse {
    pendingSignupId: string;
    expiresAt: string;
    message: string;
}

export interface VerifyOtpResponse {
    verified: boolean;
    pendingSignupId: string;
    email: string;
}

export interface LoginResponse {
    user: UserResponse;
    message: string;
}

export interface CheckPendingSignupResponse {
    valid: boolean;
    email?: string;
    expiresAt?: string;
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
