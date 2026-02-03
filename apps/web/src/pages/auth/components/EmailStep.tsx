import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaSpinner } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { EmailService } from "../../../services/email-handling/emailService";
import { TurnstileWidget, type TurnstileWidgetRef } from "../../../ui_components/TurnstileWidget";
import { useCooldown } from "../../../hooks/useDebounce";
import toast from "react-hot-toast";

interface EmailStepProps {
	isDark: boolean;
	email: string;
	onEmailChange: (email: string) => void;
	onSubmit: (email: string, captchaToken?: string) => void;
	isLoading: boolean;
	isGoogleLoading: boolean;
	error: string | null;
	onGoogleLogin: () => void;
	onSwitchMode: () => void;
}

export const EmailStep: React.FC<EmailStepProps> = ({
	isDark,
	email,
	onEmailChange,
	onSubmit,
	isLoading,
	error,
	onGoogleLogin,
	onSwitchMode,
	isGoogleLoading,
}) => {
	const [captchaToken, setCaptchaToken] = useState<string | null>(null);
	const turnstileRef = useRef<TurnstileWidgetRef>(null);
	const { isOnCooldown, startCooldown, remainingSeconds } = useCooldown(60000); // 60 second cooldown

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (isOnCooldown) {
			toast.error(`Please wait ${remainingSeconds}s before trying again`);
			return;
		}

		// Check for CAPTCHA - only required if the widget is enabled (site key is set)
		// const siteKeyConfigured = !!import.meta.env.VITE_TURNSTILE_SITE_KEY;
		// if (siteKeyConfigured && !captchaToken) {
		// 	toast.error("Please complete the security verification");
		// 	return;
		// }

		onSubmit(email, captchaToken ?? undefined);
		startCooldown();

		// Reset captcha after submission
		turnstileRef.current?.reset();
		setCaptchaToken(null);
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.3 }}
		>
			{/* Step indicator */}
			<div className="flex items-center justify-center mb-6">
				<div className="flex items-center space-x-2">
					<div
						className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${isDark
								? "bg-brand-primary-dark text-white"
								: "bg-brand-primary-light text-white"
							}
          `}
					>
						1
					</div>
					<div className="w-8 h-1 bg-gray-300 rounded">
						<div className="w-1/2 h-full bg-gray-300 rounded"></div>
					</div>
					<div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-500">
						2
					</div>
					<div className="w-8 h-1 bg-gray-300 rounded">
						<div className="w-1/2 h-full bg-gray-300 rounded"></div>
					</div>
					<div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-500">
						3
					</div>
				</div>
			</div>

			{/* Email form */}
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Error message */}
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm"
					>
						{error}
					</motion.div>
				)}

				{/* Email input */}
				<div>
					<label
						className={`
            block text-sm font-medium mb-2
            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
          `}
					>
						Email Address
					</label>
					<div className="relative">
						<input
							type="email"
							value={email}
							onChange={(e) => onEmailChange(e.target.value)}
							placeholder="Enter your email"
							className={`
                w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-colors duration-200
                ${isDark
									? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark placeholder-text-muted-dark"
									: "bg-bg-tertiary-light border-border-light text-text-primary-light placeholder-text-muted-light"
								}
                focus:border-brand-primary-light dark:focus:border-brand-primary-dark focus:ring-0
              `}
							required
						/>
						<FaEnvelope
							className={`
              absolute left-3 top-1/2 transform -translate-y-1/2 
              ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}
            `}
							size={16}
						/>
					</div>
				</div>

				{/* Turnstile CAPTCHA Widget */}
				<TurnstileWidget
					ref={turnstileRef}
					isDark={isDark}
					onVerify={setCaptchaToken}
					onExpire={() => setCaptchaToken(null)}
					onError={() => {
						setCaptchaToken(null);
						toast.error("Security verification failed. Please try again.");
					}}
				/>

				{/* Action buttons */}
				<div className="space-y-3 pt-2">
					<button
						type="submit"
						disabled={isLoading || !email || !EmailService.isValidEmail(email) || isOnCooldown}
						className={`
              w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:cursor-pointer
              ${isLoading || !email || !EmailService.isValidEmail(email) || isOnCooldown
								? "bg-gray-300 text-gray-500 cursor-not-allowed"
								: "bg-brand-primary-light hover:bg-brand-primary-hover-light dark:bg-brand-primary-dark dark:hover:bg-brand-primary-hover-dark text-white shadow-lg hover:shadow-xl"
							}
            `}
					>
						{isLoading ? "Sending..." : isOnCooldown ? `Wait ${remainingSeconds}s` : "Continue with Email"}
					</button>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<div
								className={`
                w-full border-t 
                ${isDark ? "border-border-dark" : "border-border-light"}
              `}
							></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span
								className={`
                px-2 
                ${isDark
										? "bg-bg-secondary-dark text-text-secondary-dark"
										: "bg-bg-secondary-light text-text-secondary-light"
									}
              `}
							>
								Or
							</span>
						</div>
					</div>

					<button
						type="button"
						onClick={onGoogleLogin}
						disabled={isLoading || isGoogleLoading}
						className={`
                        w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 border-2 hover:cursor-pointer
                        ${isLoading || isGoogleLoading
								? "bg-gray-300 text-gray-500 cursor-not-allowed"
								: isDark
									? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark hover:bg-bg-primary-dark"
									: "bg-bg-tertiary-light border-border-light text-text-primary-light hover:bg-bg-primary-light"
							}
                      `}
					>
						<div className="flex items-center justify-center space-x-2">
							{isGoogleLoading ? (
								<FaSpinner className="animate-spin" size={16} />
							) : (
								<FcGoogle size={16} />
							)}
							<span>Continue with Google</span>
						</div>
					</button>
				</div>
				{/* Switch mode */}
				<div className="text-center pt-4">
					<p
						className={`
            text-sm
            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
          `}
					>
						Already have an account?{" "}
						<button
							type="button"
							onClick={onSwitchMode}
							className={`
                font-medium transition-colors duration-200 hover:cursor-pointer
                ${isDark
									? "text-brand-primary-dark hover:text-brand-primary-hover-dark"
									: "text-brand-primary-light hover:text-brand-primary-hover-light"
								}
              `}
						>
							Sign in
						</button>
					</p>
				</div>
			</form>
		</motion.div>
	);
};
