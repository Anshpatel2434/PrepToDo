import {
    Navigate,
    RouterProvider,
    createBrowserRouter,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, lazy, Suspense } from "react";

import { ThemeProvider } from "./context/ThemeContext";
import { SafeAuthRoute } from "./ui_components/SafeAuthRoute";
import { supabase } from "./services/apiClient";
import { useLazyFetchDailyTestDataQuery } from "./pages/daily/redux_usecase/dailyPracticeApi";
import { PageLoader } from "./ui_components/PageLoader";

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

// Default exports
const AuthCallback = lazy(() => import("./pages/auth/components/AuthCallback"));
const TeachConceptPage = lazy(() => import("./pages/teach-concept/page/TeachConceptPage"));
const DailyPage = lazy(() => import("./pages/daily/page/DailyPage"));
const DailyRCPage = lazy(() => import("./pages/daily/daily_rc/Page/DailyRCPage"));
const DailyVAPage = lazy(() => import("./pages/daily/daily_va/Page/DailyVAPage"));
const CustomizedMocksPage = lazy(() => import("./pages/customized-mocks/page/CustomizedMocksPage"));
const MockTestPage = lazy(() => import("./pages/customized-mocks/page/MockTestPage"));

/* ---------------- ROUTER CONFIG ---------------- */

const router = createBrowserRouter([
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
        path: "/trialAI/teach_concept",
        element: (
            <Suspense fallback={<PageLoader />}>
                <TeachConceptPage />
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
]);

/* ---------------- APP ---------------- */

function AppContent() {
    const [triggerFetchDailyPracticeFunction, { error }] =
        useLazyFetchDailyTestDataQuery();

    if (error) console.error(error);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
                triggerFetchDailyPracticeFunction().catch((err) =>
                    console.error("Error fetching daily practice:", err)
                );
            }
        });

        return () => subscription.unsubscribe();
    }, [triggerFetchDailyPracticeFunction]);

    return (
        <>
            <RouterProvider router={router} />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: "500",
                    },
                    success: {
                        iconTheme: {
                            primary: "#10b981",
                            secondary: "#ffffff",
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: "#ef4444",
                            secondary: "#ffffff",
                        },
                    },
                }}
            />
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
