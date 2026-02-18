import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useTheme } from "../context/ThemeContext";
import {
	AuthPopup,
	type AuthPopupCloseReason,
} from "../pages/auth/components/AuthPopup";
import { useFetchUserQuery, getStoredToken } from "../pages/auth/redux_usecases/authApi";
import { PageLoader } from "./PageLoader";

interface SafeAuthRouteProps {
	children: React.ReactNode;
	initialMode?: "signin" | "signup";
}

export const SafeAuthRoute: React.FC<SafeAuthRouteProps> = ({
	children,
	initialMode = "signin",
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const { isDark } = useTheme();
	const { data: user, isLoading, isFetching } = useFetchUserQuery(undefined, {
		refetchOnMountOrArgChange: true,
		refetchOnFocus: true,
	});

	// Validate that both user data exists AND a valid token is present
	// This prevents showing authenticated content when OAuth was cancelled
	// and stale cache data might briefly exist
	const hasValidToken = getStoredToken() !== null;
	const isAuthenticated = user !== null && user !== undefined && hasValidToken;

	if (isAuthenticated) return <>{children}</>;

	if (isLoading || isFetching) {
		return <PageLoader variant="fullscreen" message="Loading..." />;
	}

	const handleClose = (reason?: AuthPopupCloseReason) => {
		if (reason !== "dismiss") return;

		if (window.history.length > 1) {
			navigate(-1);
			return;
		}

		navigate("/home", {
			replace: true,
			state: {
				from: location,
			},
		});
	};

	return (
		<div
			className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
				}`}
		>
			<AuthPopup
				isOpen={true}
				onClose={handleClose}
				isDark={isDark}
				initialMode={initialMode}
			/>
		</div>
	);
};
