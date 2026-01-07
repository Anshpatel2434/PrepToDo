import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useTheme } from "../context/ThemeContext";
import {
	AuthPopup,
	type AuthPopupCloseReason,
} from "../pages/auth/components/AuthPopup";
import { useFetchUserQuery } from "../pages/auth/redux_usecases/authApi";

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
	const { data: user, isLoading, isFetching } = useFetchUserQuery();

	if (user) return <>{children}</>;

	if (isLoading || isFetching) {
		return (
			<div
				className={`min-h-screen flex items-center justify-center ${
					isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
				}`}
			>
				<p
					className={`text-sm ${
						isDark
							? "text-text-secondary-dark"
							: "text-text-secondary-light"
					}`}
				>
					Loading…
				</p>
			</div>
		);
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
			className={`min-h-screen transition-colors duration-300 ${
				isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"
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
