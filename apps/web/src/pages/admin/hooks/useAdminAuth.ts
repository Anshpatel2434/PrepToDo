import { useState, useEffect, useCallback } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { useNavigate } from 'react-router-dom';

interface AdminUser {
    email: string;
    role: 'admin';
}

interface UseAdminAuthReturn {
    admin: AdminUser | null;
    isLoading: boolean;
    error: string | null;
    login: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export function useAdminAuth(): UseAdminAuthReturn {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Attempt auto-login using the user's normal JWT (via cookie)
    const attemptAutoLogin = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/auth/auto-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) return false;

            const data = await response.json();
            if (data.data?.authenticated) {
                setAdmin({ email: data.data.email, role: data.data.role });
                if (data.data.token) {
                    localStorage.setItem('preptodo_admin_token', data.data.token);
                }
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    const checkSession = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await adminApiClient<{ authenticated: boolean; email: string; role: 'admin' }>('/auth/verify');
            if (response.authenticated) {
                setAdmin({ email: response.email, role: response.role });
            } else {
                // No admin session — try auto-login from user JWT
                const autoLogged = await attemptAutoLogin();
                if (!autoLogged) {
                    setAdmin(null);
                }
            }
        } catch {
            // Verify failed — try auto-login from user JWT
            const autoLogged = await attemptAutoLogin();
            if (!autoLogged) {
                setAdmin(null);
            }
        } finally {
            setIsLoading(false);
        }
    }, [attemptAutoLogin]);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const login = async (credentials: any) => {
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
    };

    const logout = async () => {
        try {
            await adminApiClient('/auth/logout', { method: 'POST' });
            setAdmin(null);
            localStorage.removeItem('preptodo_admin_token');
            navigate('/auth');
        } catch {
            // Logout failure is non-critical — session will expire naturally
        }
    };

    return { admin, isLoading, error, login, logout, checkSession };
}
