// AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../services/apiClient";

export default function AuthCallback() {
	const navigate = useNavigate();

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			console.log("CALLBACK EVENT:", event);

			if (event === "SIGNED_IN" && session) {
				console.log(
					"77777777777777777777777777777 in authCallback : ",
					localStorage.getItem("post_auth_redirect")?.startsWith("/auth", 0)
				);
				if (
					localStorage.getItem("post_auth_redirect")?.startsWith("/auth", 0)
				) {
					navigate("/home", { replace: true });
				} else {
					const redirectTo = localStorage.getItem("post_auth_redirect") || "/";

					localStorage.removeItem("post_auth_redirect");

					navigate(redirectTo, { replace: true });
				}
			}
		});

		return () => subscription.unsubscribe();
	}, [navigate]);

	return <div>Completing sign in…</div>;
}
