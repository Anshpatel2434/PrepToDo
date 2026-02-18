import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { useNavigate } from 'react-router-dom';

// =============================================================================
// Types
// =============================================================================
interface AdminUser {
    email: string;
    role: 'admin';
}

interface AdminAuthContextType {
    admin: AdminUser | null;
    isLoading: boolean;
    error: string | null;
    login: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// =============================================================================
// Context (singleton — ensures only ONE auth check runs across all consumers)
// =============================================================================
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Module-level flag — survives component unmount/remount cycles
let _hasCheckedSession = false;

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // Attempt auto-login using the user's normal JWT (via cookie)
    const attemptAutoLogin = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/auth/auto-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) return false;

            const data = await response.json();
            if (data.data?.authenticated) {
                if (isMountedRef.current) {
                    setAdmin({ email: data.data.email, role: data.data.role });
                    if (data.data.token) {
                        localStorage.setItem('preptodo_admin_token', data.data.token);
                    }
                }
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    // Check session — runs exactly ONCE in the app's lifetime
    useEffect(() => {
        if (_hasCheckedSession) {
            // Already checked in a previous mount — just mark as not loading
            setIsLoading(false);
            return;
        }
        _hasCheckedSession = true;

        const checkSession = async () => {
            try {
                setIsLoading(true);
                const response = await adminApiClient<{ authenticated: boolean; email: string; role: 'admin' }>('/auth/verify');
                if (response.authenticated && isMountedRef.current) {
                    setAdmin({ email: response.email, role: response.role });
                } else {
                    const autoLogged = await attemptAutoLogin();
                    if (!autoLogged && isMountedRef.current) {
                        setAdmin(null);
                    }
                }
            } catch {
                const autoLogged = await attemptAutoLogin();
                if (!autoLogged && isMountedRef.current) {
                    setAdmin(null);
                }
            } finally {
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        checkSession();
    }, [attemptAutoLogin]);

    const login = useCallback(async (credentials: any) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await adminApiClient<{ authenticated: boolean; email: string; role: 'admin'; token?: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
            });

            if (response.authenticated) {
                setAdmin({ email: response.email, role: response.role });
                if (response.token) {
                    localStorage.setItem('preptodo_admin_token', response.token);
                }
                navigate('/admin/dashboard/overview');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const logout = useCallback(async () => {
        try {
            await adminApiClient('/auth/logout', { method: 'POST' });
            setAdmin(null);
            localStorage.removeItem('preptodo_admin_token');
            // Reset the flag so next admin visit re-checks session
            _hasCheckedSession = false;
            navigate('/auth');
        } catch {
            // Logout failure is non-critical
        }
    }, [navigate]);

    return (
        <AdminAuthContext.Provider value= {{ admin, isLoading, error, login, logout }
}>
    { children }
    </AdminAuthContext.Provider>
    );
}

// =============================================================================
// Hook — consumers just read from context, no independent state or effects
// =============================================================================
export function useAdminAuth(): AdminAuthContextType {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within <AdminAuthProvider>');
    }
    return context;
}
