import { useEffect } from "react";

const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID;

/**
 * Loads Microsoft Clarity analytics script.
 * Renders nothing — just boots the Clarity snippet via useEffect.
 * No-ops gracefully if VITE_CLARITY_PROJECT_ID env var is not set.
 */
export function ClarityProvider() {
	useEffect(() => {
		if (!CLARITY_PROJECT_ID) return;

		// Standard Clarity bootstrap snippet
		(function (c: Window, l: Document, a: string, r: string, i: string) {
			(c as any)[a] =
				(c as any)[a] ||
				function () {
					((c as any)[a].q = (c as any)[a].q || []).push(arguments);
				};
			const t = l.createElement(r) as HTMLScriptElement;
			t.async = true;
			t.src = "https://www.clarity.ms/tag/" + i;
			const y = l.getElementsByTagName(r)[0];
			y.parentNode!.insertBefore(t, y);
		})(window, document, "clarity", "script", CLARITY_PROJECT_ID);
	}, []);

	return null;
}
