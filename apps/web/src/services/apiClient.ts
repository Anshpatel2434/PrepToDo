import { createClient } from "@supabase/supabase-js";

// =============================================================================
// Supabase Client (for database queries, NOT auth)
// =============================================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: false, // We manage auth separately now
		autoRefreshToken: false,
		detectSessionInUrl: false,
	},
});

// =============================================================================
// Custom Backend API Client
// =============================================================================
// In development, Vite proxies /api requests to the backend
// In production, set VITE_BACKEND_URL to the actual backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// API Response Types
export interface ApiErrorResponse {
	success: false;
	error: {
		code: string;
		message: string;
		details?: unknown;
		retryAfterSeconds?: number;
	};
}

export interface ApiSuccessResponse<T = unknown> {
	success: true;
	data: T;
	message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Custom error class for API errors
export class BackendApiError extends Error {
	public readonly code: string;
	public readonly statusCode: number;
	public readonly details?: unknown;
	public readonly retryAfterSeconds?: number;

	constructor(response: ApiErrorResponse, statusCode: number) {
		super(response.error.message);
		this.name = 'BackendApiError';
		this.code = response.error.code;
		this.statusCode = statusCode;
		this.details = response.error.details;
		this.retryAfterSeconds = response.error.retryAfterSeconds;
	}
}

// Fetch wrapper with error handling
export async function apiFetch<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${BACKEND_URL}${endpoint}`;

	const response = await fetch(url, {
		...options,
		credentials: 'include', // Include cookies
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	});

	const data: ApiResponse<T> = await response.json();

	if (!data.success) {
		throw new BackendApiError(data as ApiErrorResponse, response.status);
	}

	return (data as ApiSuccessResponse<T>).data;
}

// =============================================================================
// User Response Type
// =============================================================================
export interface UserResponse {
	id: string;
	email: string;
	email_confirmed_at: string | null;
	provider: string | null;
	has_password: boolean;
	created_at: string | null;
	updated_at: string | null;
}