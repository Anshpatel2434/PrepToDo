import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_API_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		if (!POSTHOG_KEY) return;

		posthog.init(POSTHOG_KEY, {
			api_host: POSTHOG_HOST || "https://us.i.posthog.com",
			person_profiles: "identified_only",
			capture_pageview: true,
			capture_pageleave: true,
			autocapture: true,
		});
	}, []);

	if (!POSTHOG_KEY) return <>{children}</>;

	return <PHProvider client={posthog}>{children}</PHProvider>;
}
