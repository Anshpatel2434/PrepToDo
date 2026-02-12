const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

/**
 * Custom fetch wrapper for Admin API endpoints.
 * Automatically includes credentials (cookies) for admin session.
 */
export async function adminApiClient<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const { headers, ...customConfig } = options;

    const configHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...(localStorage.getItem('preptodo_admin_token')
            ? { "Authorization": `Bearer ${localStorage.getItem('preptodo_admin_token')}` }
            : {}),
        ...headers,
    };

    const response = await fetch(`${BACKEND_URL}/api/admin${endpoint}`, {
        ...customConfig,
        headers: configHeaders,
        credentials: "include", // Essential for httpOnly cookie
    });

    const data = await response.json();

    if (!response.ok) {
        // Handle Admin-specific error structure if needed, or generic
        const errorMessage = data.error?.message || data.message || "Admin API Error";
        throw new Error(errorMessage);
    }

    return data.data || data; // Handle { success: true, data: ... } wrapper
}
