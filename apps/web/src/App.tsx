// import React from 'react'; // Not needed for JSX with React 17+
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { HomePage } from "./pages/home/page/HomePage";
import { AuthPage } from "./pages/auth/page/AuthPage";
import { DashboardPage } from "./pages/dashboard/page/DashboardPage";
import "./App.css";
import { useEffect } from "react";
import { supabase } from "./services/apiClient";
import AuthCallback from "./pages/auth/components/AuthCallback";
import { ThemeProvider } from "./context/ThemeContext";
import TeachConceptPage from "./pages/teach-concept/page/TeachConceptPage";
import DailyRCPage from "./pages/daily/daily_rc/Page/DailyRCPage";
import DailyVAPage from "./pages/daily/daily_va/Page/DailyVAPage";
import { useLazyFetchDailyTestDataQuery } from "./pages/daily/redux_usecase/dailyPracticeApi";
import DailyPage from "./pages/daily/page/DailyPage";

function App() {
	const [triggerFetchDailyPracticeFunction, { error }] =
		useLazyFetchDailyTestDataQuery();
	if (error) console.log(error);
	async function fetchDailyPracticeData() {
		try {
			await triggerFetchDailyPracticeFunction();
		} catch (error) {
			console.log("error while triggering");
			console.log(error);
		}
	}

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			console.log("AUTH EVENT:", event);

			if (event === "SIGNED_IN" && session) {
				console.log("SIGNED IN USER:", session.user);
				console.log(
					"Well the user is signed in, now lets fetch the daily practice data"
				);
				fetchDailyPracticeData();
				// dispatch(setUser(session.user))
			}

			if (event === "SIGNED_OUT") {
				// dispatch(clearUser())
			}
		});

		return () => subscription.unsubscribe();
	}, []);

	return (
		<ThemeProvider>
			<Router>
				<Routes>
					<Route path="/" element={<Navigate to="/home" replace />} />
					<Route path="/home" element={<HomePage />} />
					<Route path="/dashboard" element={<DashboardPage />} />
					<Route path="/auth" element={<AuthPage />} />
					<Route path="/auth/callback" element={<AuthCallback />} />
					<Route path="/trialAI/teach_concept" element={<TeachConceptPage />} />
					<Route path="/daily" element={<DailyPage />} />
					<Route path="/daily/rc" element={<DailyRCPage />} />
					<Route path="/daily/va" element={<DailyVAPage />} />
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
	);
}

export default App;
