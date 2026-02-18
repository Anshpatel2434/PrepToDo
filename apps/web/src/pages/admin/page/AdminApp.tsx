import React, { useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAdminAuth, AdminAuthProvider } from '../hooks/useAdminAuth';
import { useFetchUserQuery } from '../../auth/redux_usecases/authApi';

// Lazy load pages
const AdminLayout = React.lazy(() => import('../components/AdminLayout'));
const OverviewPage = React.lazy(() => import('../pages/OverviewPage'));
const UsersPage = React.lazy(() => import('../pages/UsersPage'));

const UserDetailPage = React.lazy(() => import('../pages/UserDetailPage'));
const FinancialsPage = React.lazy(() => import('../pages/FinancialsPage'));
const ContentPage = React.lazy(() => import('../pages/ContentPage'));
const SystemPage = React.lazy(() => import('../pages/SystemPage'));
const AIUsagePage = React.lazy(() => import('../pages/AIUsagePage'));

const AdminLoader = () => (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1117] text-[#6366f1]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent"></div>
    </div>
);

// Wrapper that provides the context
export default function AdminApp() {
    return (
        <AdminAuthProvider>
            <AdminAppContent />
        </AdminAuthProvider>
    );
}

// Actual admin app content — reads from the shared context
function AdminAppContent() {
    const { admin, isLoading: isAdminAuthLoading, checkSession } = useAdminAuth();
    const { data: mainUser, isLoading: isMainAuthLoading } = useFetchUserQuery();
    const navigate = useNavigate();
    const hasTriggeredCheckRef = useRef(false);

    const isLoading = isAdminAuthLoading || isMainAuthLoading;

    // Trigger admin session check ONLY after mainUser is confirmed admin.
    // Uses a 1-second delay to ensure the auth cookie is stored by the browser
    // (on fresh login, the cookie from the login response may not be stored yet).
    // On page refresh, the cookie is already stored so the delay is just a brief wait.
    useEffect(() => {
        if (mainUser?.role === 'admin' && !hasTriggeredCheckRef.current) {
            hasTriggeredCheckRef.current = true;
            const timer = setTimeout(() => {
                checkSession();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [mainUser, checkSession]);

    // Redirect non-admin users
    useEffect(() => {
        if (!isMainAuthLoading) {
            if (!mainUser) {
                navigate('/auth', { replace: true });
                return;
            }
            if (mainUser.role !== 'admin') {
                navigate('/home', { replace: true });
                return;
            }
        }
    }, [mainUser, isMainAuthLoading, navigate]);

    // Redirect if admin check completed and failed
    useEffect(() => {
        if (!isAdminAuthLoading && !admin && hasTriggeredCheckRef.current && mainUser?.role === 'admin') {
            // Admin check completed but failed — no admin session
            navigate('/auth', { replace: true });
        }
    }, [admin, isAdminAuthLoading, mainUser, navigate]);

    if (isLoading || !admin) {
        return <AdminLoader />;
    }

    return (
        <React.Suspense fallback={<AdminLoader />}>
            <Routes>
                {/* Protected Routes wrapped in Layout */}
                <Route element={<AdminLayout />}>
                    <Route path="dashboard" element={<OverviewPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="users/:id" element={<UserDetailPage />} />
                    <Route path="financials" element={<FinancialsPage />} />
                    <Route path="content" element={<ContentPage />} />
                    <Route path="system" element={<SystemPage />} />
                    <Route path="ai-usage" element={<AIUsagePage />} />
                    <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
        </React.Suspense>
    );
}
