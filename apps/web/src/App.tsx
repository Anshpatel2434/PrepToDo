// import React from 'react'; // Not needed for JSX with React 17+
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "./store";
import { HomePage } from "./pages/home/page/HomePage";
import { AuthPage } from "./pages/auth/page/AuthPage";
import { DashboardPage } from "./pages/dashboard/page/DashboardPage";
import "./App.css";
import { useEffect } from "react";
import { supabase } from "./services/apiClient";
import AuthCallback from "./pages/auth/components/AuthCallback";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("AUTH EVENT:", event);

            if (event === "SIGNED_IN" && session) {
                console.log("SIGNED IN USER:", session.user);
                // dispatch(setUser(session.user))
            }

            if (event === "SIGNED_OUT") {
                // dispatch(clearUser())
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <Provider store={store}>
            <ThemeProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Navigate to="/home" replace />} />
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
                        {/* Add more routes as needed */}
                    </Routes>
                </Router>
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
            </ThemeProvider>
        </Provider>
    );
}

export default App;
