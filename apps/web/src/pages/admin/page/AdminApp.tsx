import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
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

export default function AdminApp() {
    const { admin, isLoading: isAdminAuthLoading } = useAdminAuth();
    const { data: mainUser, isLoading: isMainAuthLoading } = useFetchUserQuery();
    const navigate = useNavigate();
    const location = useLocation();

    const isLoading = isAdminAuthLoading || isMainAuthLoading;

    // Effect to handle redirection based on auth state
    useEffect(() => {
        if (!isLoading) {
            // 1. If not logged in at all, redirect to normal auth page
            if (!mainUser) {
                navigate('/auth', { replace: true });
                return;
            }

            // 2. If logged in but not an admin, kick them out
            if (mainUser.role !== 'admin') {
                navigate('/home', { replace: true });
                return;
            }

            // 3. If admin user but admin session not established yet,
            //    the useAdminAuth hook will handle session verification via cookie.
            //    If no admin session cookie exists, redirect to auth page.
            if (!admin && !isAdminAuthLoading) {
                // User has admin role but no admin panel session — redirect to auth
                navigate('/auth', { replace: true });
                return;
            }
        }
    }, [admin, mainUser, isLoading, isAdminAuthLoading, location.pathname, navigate]);

    if (isLoading) {
        return <AdminLoader />;
    }

    // If no admin session, show loader while redirect happens
    if (!admin) {
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
