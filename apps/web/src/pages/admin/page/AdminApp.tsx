import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

// Lazy load pages
const AdminLoginPage = React.lazy(() => import('../auth/AdminLoginPage'));
const AdminLayout = React.lazy(() => import('../components/AdminLayout'));
const OverviewPage = React.lazy(() => import('../pages/OverviewPage'));
const UsersPage = React.lazy(() => import('../pages/UsersPage'));

// Loader
// ... existing loader ...

// ... existing component ...
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

export default function AdminApp() {
    const { admin, isLoading } = useAdminAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Effect to handle redirection based on auth state
    useEffect(() => {
        if (!isLoading) {
            const isLoginPage = location.pathname.includes('/login');

            if (!admin && !isLoginPage) {
                navigate('/admin/login', { replace: true });
            } else if (admin && isLoginPage) {
                navigate('/admin/dashboard', { replace: true });
            }
        }
    }, [admin, isLoading, location.pathname, navigate]);

    if (isLoading) {
        return <AdminLoader />;
    }

    return (
        <React.Suspense fallback={<AdminLoader />}>
            <Routes>
                <Route path="login" element={<AdminLoginPage />} />

                {/* Protected Routes wrapped in Layout */}
                {admin && (
                    <Route element={<AdminLayout />}>
                        <Route path="dashboard" element={<OverviewPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="users/:id" element={<UserDetailPage />} />
                        <Route path="financials" element={<FinancialsPage />} />
                        <Route path="content" element={<ContentPage />} />
                        <Route path="system" element={<SystemPage />} />
                        <Route path="ai-usage" element={<AIUsagePage />} />
                        <Route path="/" element={<Navigate to="dashboard" replace />} />
                        {/* Add other routes here */}
                    </Route>
                )}

                {/* Fallback */}
                <Route path="*" element={
                    !admin ? <Navigate to="login" replace /> : <Navigate to="dashboard" replace />
                } />
            </Routes>
        </React.Suspense>
    );
}
