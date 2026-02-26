import {
    Navigate,
    RouterProvider,
    createBrowserRouter,
} from "react-router-dom";
import { lazy, Suspense } from "react";

import { ThemeProvider } from "./context/ThemeContext";
import { SafeAuthRoute } from "./ui_components/SafeAuthRoute";
import { PageLoader } from "./ui_components/PageLoader";
import { CustomToaster } from "./ui_components/CustomToaster";

import "./App.css";

/* ---------------- LAZY IMPORTS ---------------- */

const lazyNamed = <T extends string, M>(
    importPromise: Promise<M>,
    exportName: T
) =>
    lazy(() =>
        importPromise.then((module) => ({
            default: (module as unknown as Record<string, React.ComponentType>)[exportName],
        }))
    );

const HomePage = lazyNamed(import("./pages/home/page/HomePage"), "HomePage");
const AuthPage = lazyNamed(import("./pages/auth/page/AuthPage"), "AuthPage");
const DashboardPage = lazyNamed(import("./pages/dashboard/page/DashboardPage"), "DashboardPage");
const AdminApp = lazy(() => import("./pages/admin/page/AdminApp"));

// Default exports
const AuthCallback = lazy(() => import("./pages/auth/components/AuthCallback"));
const DailyPage = lazy(() => import("./pages/daily/page/DailyPage"));
const DailyRCPage = lazy(() => import("./pages/daily/daily_rc/Page/DailyRCPage"));
const DailyVAPage = lazy(() => import("./pages/daily/daily_va/Page/DailyVAPage"));
const CustomizedMocksPage = lazy(() => import("./pages/customized-mocks/page/CustomizedMocksPage"));
const MockTestPage = lazy(() => import("./pages/customized-mocks/page/MockTestPage"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/legal/RefundPolicy"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const ErrorPage = lazy(() => import("./pages/error/ErrorPage"));

// Forum (public, SEO-crawlable)
const ForumPage = lazyNamed(import("./pages/forum/page/ForumPage"), "ForumPage");
const ForumThreadPage = lazy(() => import("./pages/forum/page/ForumThreadPage"));

/* ---------------- ROUTER CONFIG ---------------- */

const router = createBrowserRouter([
    {
        errorElement: (
            <Suspense fallback={<PageLoader />}>
                <ErrorPage />
            </Suspense>
        ),
        children: [
            {
                path: "/",
                element: <Navigate to="/home" replace />,
            },
            {
                path: "/home",
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <HomePage />
                    </Suspense>
                ),
            },
            {
                path: "/dashboard",
                element: (
                    <SafeAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <DashboardPage />
                        </Suspense>
                    </SafeAuthRoute>
                ),
            },
            {
                path: "/auth",
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <AuthPage />
                    </Suspense>
                ),
            },
            {
                path: "/auth/callback",
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <AuthCallback />
                    </Suspense>
                ),
            },
            {
                path: "/auth/reset-password",
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <ResetPasswordPage />
                    </Suspense>
                ),
            },
            {
                path: "/daily",
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <DailyPage />
                    </Suspense>
                ),
            },
            {
                path: "/daily/rc",
                element: (
                    <SafeAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <DailyRCPage />
                        </Suspense>
                    </SafeAuthRoute>
                ),
            },
            {
                path: "/daily/va",
                element: (
                    <SafeAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <DailyVAPage />
                        </Suspense>
                    </SafeAuthRoute>
                ),
            },
            {
                path: "/customized-mocks",
                element: (
                    <SafeAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <CustomizedMocksPage />
                        </Suspense>
                    </SafeAuthRoute>
                ),
            },
            {
                path: "/mock",
                element: (
                    <SafeAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <MockTestPage />
                        </Suspense>
                    </SafeAuthRoute>
                ),
            },
            {
                path: "/privacy",
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <PrivacyPolicy />
                    </Suspense>
                ),
            },
            {
                path: "/terms",
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <TermsOfService />
                    </Suspense>
                ),
            },
            {
                path: "/refund",
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <RefundPolicy />
                    </Suspense>
                ),
            },
            {
                path: "/forum",
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <ForumPage />
                    </Suspense>
                ),
            },
            {
                path: "/forum/:slug",
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <ForumThreadPage />
                    </Suspense>
                ),
            },
            {
                path: "/admin/*",
                element: (
                    <Suspense fallback={<PageLoader />}>
                        <AdminApp />
                    </Suspense>
                ),
            },
            {
                path: "*",
                loader: () => { throw new Response("Not Found", { status: 404 }); },
            },
        ],
    },
]);

/* ---------------- APP ---------------- */

function AppContent() {
    return (
        <>
            <RouterProvider router={router} />
            <CustomToaster />
        </>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

export default App;
