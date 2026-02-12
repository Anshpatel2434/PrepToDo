import { useState, useEffect, useCallback } from 'react';
import { adminApiClient } from '../services/adminApiClient';
import { useNavigate } from 'react-router-dom';
import { getStoredToken } from '../../auth/redux_usecases/authApi';

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

    // Attempt auto-login using the user's normal JWT
    const attemptAutoLogin = useCallback(async (): Promise<boolean> => {
        const token = getStoredToken();
        if (!token) return false;

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/auth/auto-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
            });

            if (!response.ok) return false;

            const data = await response.json();
            if (data.data?.authenticated) {
                setAdmin({ email: data.data.email, role: data.data.role });
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
            const response = await adminApiClient<{ authenticated: boolean; email: string; role: 'admin' }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
            });

            if (response.authenticated) {
                setAdmin({ email: response.email, role: response.role });
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
            navigate('/auth');
        } catch {
            // Logout failure is non-critical — session will expire naturally
        }
    };

    return { admin, isLoading, error, login, logout, checkSession };
}
