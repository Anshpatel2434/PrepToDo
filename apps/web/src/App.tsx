import {
    Navigate,
    RouterProvider,
    createBrowserRouter,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

import { HomePage } from "./pages/home/page/HomePage";
import { AuthPage } from "./pages/auth/page/AuthPage";
import { DashboardPage } from "./pages/dashboard/page/DashboardPage";
import AuthCallback from "./pages/auth/components/AuthCallback";
import TeachConceptPage from "./pages/teach-concept/page/TeachConceptPage";
import DailyRCPage from "./pages/daily/daily_rc/Page/DailyRCPage";
import DailyVAPage from "./pages/daily/daily_va/Page/DailyVAPage";
import DailyPage from "./pages/daily/page/DailyPage";

import { ThemeProvider } from "./context/ThemeContext";
import { DailyExamProvider, useDailyExam } from "./context/DailyExamContext";
import { SafeAuthRoute } from "./ui_components/SafeAuthRoute";
import { supabase } from "./services/apiClient";
import { useLazyFetchDailyTestDataQuery } from "./pages/daily/redux_usecase/dailyPracticeApi";

import "./App.css";

/* ---------------- ROUTER CONFIG ---------------- */

const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/home" replace />,
    },
    {
        path: "/home",
        element: <HomePage />,
    },
    {
        path: "/dashboard",
        element: (
            <SafeAuthRoute>
                <DashboardPage />
            </SafeAuthRoute>
        ),
    },
    {
        path: "/auth",
        element: <AuthPage />,
    },
    {
        path: "/auth/callback",
        element: <AuthCallback />,
    },
    {
        path: "/trialAI/teach_concept",
        element: <TeachConceptPage />,
    },
    {
        path: "/daily",
        element: <DailyPage />,
    },
    {
        path: "/daily/rc",
        element: (
            <SafeAuthRoute>
                <DailyRCPage />
            </SafeAuthRoute>
        ),
    },
    {
        path: "/daily/va",
        element: (
            <SafeAuthRoute>
                <DailyVAPage />
            </SafeAuthRoute>
        ),
    },
]);

/* ---------------- APP ---------------- */

function AppContent() {
    const { setTodayExamId } = useDailyExam();
    const [triggerFetchDailyPracticeFunction, { error }] =
        useLazyFetchDailyTestDataQuery();

    if (error) console.log(error);

    async function fetchDailyPracticeData() {
        try {
            const result = await triggerFetchDailyPracticeFunction();
            if (result?.data?.examInfo?.id) {
                setTodayExamId(result.data.examInfo.id);
            }
        } catch (err) {
            console.error("Error while triggering daily practice fetch", err);
        }
    }

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("AUTH EVENT:", event);

            if (event === "SIGNED_IN" && session) {
                console.log("SIGNED IN USER:", session.user);
                fetchDailyPracticeData();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

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
            <DailyExamProvider>
                <AppContent />
            </DailyExamProvider>
        </ThemeProvider>
    );
}

export default App;
