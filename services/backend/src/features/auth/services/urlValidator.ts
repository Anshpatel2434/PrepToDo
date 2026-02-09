// =============================================================================
// Auth Feature - URL Validation Service
// =============================================================================
// Validates redirect URLs against an allowlist to prevent open redirect attacks

// =============================================================================
// Allowed Return Paths
// =============================================================================
// These are the only paths that users can be redirected to after OAuth
const ALLOWED_RETURN_PATHS = [
    '/',
    '/dashboard',
    '/practice',
    '/analytics',
    '/settings',
    '/daily-practice',
    '/customized-mocks',
    '/auth/callback',
    '/auth',
] as const;

// =============================================================================
// Validate Return URL
// =============================================================================
/**
 * Validates a returnTo URL against the allowlist.
 * Returns a safe default if the URL is not valid.
 * 
 * @param returnTo - The URL path to validate
 * @returns A safe URL path that is in the allowlist
 */
export function validateReturnTo(returnTo: string | undefined | null): string {
    const DEFAULT_RETURN = '/dashboard';

    // Handle missing or empty values
    if (!returnTo || typeof returnTo !== 'string') {
        return DEFAULT_RETURN;
    }

    // Trim whitespace
    const trimmed = returnTo.trim();

    // Reject absolute URLs (http://, https://, //, etc.)
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('//') ||
        trimmed.includes('://') ||
        trimmed.includes('\\')
    ) {
        return DEFAULT_RETURN;
    }

    // Must start with /
    if (!trimmed.startsWith('/')) {
        return DEFAULT_RETURN;
    }

    // Check if the path matches any allowed prefix
    const isAllowed = ALLOWED_RETURN_PATHS.some(allowedPath => {
        // Exact match
        if (trimmed === allowedPath) {
            return true;
        }
        // Prefix match (e.g., /dashboard/settings matches /dashboard)
        if (trimmed.startsWith(allowedPath + '/')) {
            return true;
        }
        // Handle query params (e.g., /dashboard?tab=1)
        if (trimmed.startsWith(allowedPath + '?')) {
            return true;
        }
        return false;
    });

    return isAllowed ? trimmed : DEFAULT_RETURN;
}
