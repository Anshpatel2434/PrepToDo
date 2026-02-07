import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { FaKey, FaArrowLeft, FaClock } from "react-icons/fa";
import { useCooldown } from "../../../hooks/useDebounce";

interface OtpStepProps {
	isDark: boolean;
	otp: string;
	onOtpChange: (otp: string) => void;
	onSubmit: () => void;
	onBack: () => void;
	onResendOtp: () => void;
	isLoading: boolean;
	isResending: boolean;
}

export const OtpStep: React.FC<OtpStepProps> = ({
	isDark,
	otp,
	onOtpChange,
	onSubmit,
	onBack,
	onResendOtp,
	isLoading,
	isResending,
}) => {
	const { isOnCooldown, startCooldown, remainingSeconds } = useCooldown(120000); // 2 minutes (OTP expiry)

	// Start cooldown on mount (since OTP was just sent)
	useEffect(() => {
		startCooldown();
	}, [startCooldown]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (otp.length === 6 && !isLoading) {
			onSubmit();
		}
	};

	const handleResendOtp = () => {
		if (isResending) return;
		onResendOtp();
		startCooldown();
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
						<div className="w-full h-full bg-gray-300 rounded"></div>
					</div>
					<div
						className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${isDark
								? "bg-brand-primary-dark text-white"
								: "bg-brand-primary-light text-white"
							}
          `}
					>
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

			{/* Header */}
			<div className="text-center mb-6">
				<div
					className={`
          w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center
          ${isDark ? "bg-brand-primary-dark/20" : "bg-brand-primary-light/20"}
        `}
				>
					<FaKey
						className={`
            ${isDark ? "text-brand-primary-dark" : "text-brand-primary-light"}
          `}
						size={24}
					/>
				</div>
				<h3
					className={`
          text-xl font-bold mb-2
          ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
        `}
				>
					Verify Your Email
				</h3>
				<p
					className={`
          text-sm
          ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
        `}
				>
					We sent a 6-digit code to your email. Enter it below to continue.
				</p>
			</div>

			{/* Timer */}
			<div className="flex items-center justify-center mb-4">
				<FaClock
					className={`
          mr-2 
          ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}
        `}
					size={14}
				/>
				<span
					className={`
          text-sm font-medium
          ${remainingSeconds > 60
							? isDark
								? "text-text-secondary-dark"
								: "text-text-secondary-light"
							: "text-red-500"
						}
        `}
				>
					{isOnCooldown ? formatTime(remainingSeconds) : "Code expired"}
				</span>
				{!isOnCooldown && (
					<button
						type="button"
						onClick={handleResendOtp}
						disabled={isResending}
						className={`
              ml-3 text-sm font-medium transition-colors duration-200
              ${isDark
								? "text-brand-primary-dark hover:text-brand-primary-hover-dark"
								: "text-brand-primary-light hover:text-brand-primary-hover-light"
							}
              ${isResending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
					>
						{isResending ? 'Sending...' : 'Resend'}
					</button>
				)}
			</div>

			{/* OTP input form */}
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* OTP input */}

				{/* OTP input */}
				<div>
					<label
						className={`
            block text-sm font-medium mb-2
            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
          `}
					>
						Verification Code
					</label>
					<div className="grid grid-cols-6 gap-2">
						{[0, 1, 2, 3, 4, 5].map((index) => (
							<input
								key={index}
								type="text"
								maxLength={1}
								value={otp[index] || ""}
								onChange={(e) => {
									const newOtp = otp.split("");
									newOtp[index] = e.target.value;
									onOtpChange(newOtp.join(""));
									// Auto-focus next input
									if (e.target.value && index < 5) {
										const nextInput = document.querySelector(
											`input[name="otp-${index + 1}"]`
										) as HTMLInputElement;
										nextInput?.focus();
									}
								}}
								onKeyDown={(e) => {
									// Handle backspace
									if (e.key === "Backspace" && !otp[index] && index > 0) {
										const prevInput = document.querySelector(
											`input[name="otp-${index - 1}"]`
										) as HTMLInputElement;
										prevInput?.focus();
									}
								}}
								name={`otp-${index}`}
								className={`
                  w-full h-12 text-center text-lg font-bold rounded-xl border-2 transition-colors duration-200
                  ${isDark
										? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark"
										: "bg-bg-tertiary-light border-border-light text-text-primary-light"
									}
                  focus:border-brand-primary-light dark:focus:border-brand-primary-dark focus:ring-0
                `}
								required
							/>
						))}
					</div>
				</div>

				{/* Action buttons */}
				<div className="flex space-x-3 pt-2">
					<button
						type="button"
						onClick={onBack}
						className={`
              flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200
              ${isDark
								? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark hover:bg-bg-primary-dark"
								: "bg-bg-tertiary-light border-border-light text-text-primary-light hover:bg-bg-primary-light"
							}
            `}
					>
						<div className="flex items-center justify-center space-x-2">
							<FaArrowLeft size={14} />
							<span>Back</span>
						</div>
					</button>

					<button
						type="submit"
						disabled={isLoading || otp.length !== 6}
						className={`
              flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:cursor-pointer
              ${isLoading || otp.length !== 6
								? "bg-gray-300 text-gray-500 cursor-not-allowed"
								: "bg-brand-primary-light hover:bg-brand-primary-hover-light dark:bg-brand-primary-dark dark:hover:bg-brand-primary-hover-dark text-white shadow-lg hover:shadow-xl"
							}
            `}
					>
						{isLoading ? "Verifying..." : "Verify Code"}
					</button>
				</div>
			</form>
		</motion.div>
	);
};
