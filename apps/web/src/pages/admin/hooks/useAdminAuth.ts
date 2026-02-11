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

export function useAdminAuth(): UseAdminAuthReturn {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const checkSession = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await adminApiClient<{ authenticated: boolean; email: string; role: 'admin' }>('/auth/verify');
            if (response.authenticated) {
                setAdmin({ email: response.email, role: response.role });
            } else {
                setAdmin(null);
            }
        } catch (err) {
            setAdmin(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const login = async (credentials: any) => {
        try {
            setError(null);
            const response = await adminApiClient('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
            });

            if (response.authenticated) {
                setAdmin({ email: response.email, role: response.role });
                navigate('/admin/dashboard'); // Redirect to dashboard after login
            }
        } catch (err: any) {
            setError(err.message || 'Login failed');
            throw err;
        }
    };

    const logout = async () => {
        try {
            await adminApiClient('/auth/logout', { method: 'POST' });
            setAdmin(null);
            navigate('/admin/login');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    return { admin, isLoading, error, login, logout, checkSession };
}
