// AuthCallback.tsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../services/apiClient";

export default function AuthCallback() {
    const navigate = useNavigate();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Set a timeout to handle failed/cancelled authentication
        // If no SIGNED_IN event within 5 seconds, redirect to home
        timeoutRef.current = setTimeout(async () => {
            console.log("Authentication timeout - redirecting to home");
            localStorage.removeItem("post_auth_redirect");
            navigate("/home", { replace: true });
        }, 5000);

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("CALLBACK EVENT:", event);

            if (event === "SIGNED_IN" && session) {
                // Clear the timeout since auth succeeded
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                console.log(
                    "77777777777777777777777777777 in authCallback : ",
                    localStorage.getItem("post_auth_redirect")?.startsWith("/auth", 0)
                );
                
                // Get the redirect URL and clear it from localStorage
                const redirectUrl = localStorage.getItem("post_auth_redirect");
                localStorage.removeItem("post_auth_redirect");
                
                // Navigate based on the redirect URL
                if (redirectUrl?.startsWith("/auth")) {
                    navigate("/home", { replace: true });
                } else {
                    const redirectTo = redirectUrl || "/";
                    navigate(redirectTo, { replace: true });
                }
            }
        });

        return () => {
            // Cleanup on unmount
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            subscription.unsubscribe();
        };
    }, [navigate]);

    return <div>Completing sign in…</div>;
}
