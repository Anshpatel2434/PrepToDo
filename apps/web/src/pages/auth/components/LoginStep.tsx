import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { EmailService } from "../../../services/email_handling/emailService";

interface LoginStepProps {
	isDark: boolean;
	email: string;
	password: string;
	onEmailChange: (email: string) => void;
	onPasswordChange: (password: string) => void;
	onSubmit: () => void;
	onGoogleLogin: () => void;
	onSwitchMode: () => void;
	isLoading: boolean;
	error: string | null;
}

export const LoginStep: React.FC<LoginStepProps> = ({
	isDark,
	email,
	password,
	onEmailChange,
	onPasswordChange,
	onSubmit,
	onGoogleLogin,
	onSwitchMode,
	isLoading,
	error,
}) => {
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (email && password && EmailService.isValidEmail(email)) {
			onSubmit();
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			transition={{ duration: 0.3 }}
		>
			{/* Login form */}
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
                ${
									isDark
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

				{/* Password input */}
				<div>
					<label
						className={`
            block text-sm font-medium mb-2
            ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
          `}
					>
						Password
					</label>
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => onPasswordChange(e.target.value)}
							placeholder="Enter your password"
							className={`
                w-full pl-10 pr-12 py-3 rounded-xl border-2 transition-colors duration-200
                ${
									isDark
										? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark placeholder-text-muted-dark"
										: "bg-bg-tertiary-light border-border-light text-text-primary-light placeholder-text-muted-light"
								}
                focus:border-brand-primary-light dark:focus:border-brand-primary-dark focus:ring-0
              `}
							required
						/>
						<FaLock
							className={`
              absolute left-3 top-1/2 transform -translate-y-1/2 
              ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}
            `}
							size={16}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className={`
                absolute right-3 top-1/2 transform -translate-y-1/2 
                ${
									isDark
										? "text-text-muted-dark hover:text-text-secondary-dark"
										: "text-text-muted-light hover:text-text-secondary-light"
								}
              `}
						>
							{showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
						</button>
					</div>
				</div>

				{/* Forgot password link */}
				<div className="text-right">
					<button
						type="button"
						className={`
              text-sm transition-colors duration-200 hover:cursor-pointer
              ${
								isDark
									? "text-brand-primary-dark hover:text-brand-primary-hover-dark"
									: "text-brand-primary-light hover:text-brand-primary-hover-light"
							}
            `}
					>
						Forgot password?
					</button>
				</div>

				{/* Action buttons */}
				<div className="space-y-3 pt-2">
					<button
						type="submit"
						disabled={
							isLoading ||
							!email ||
							!password ||
							!EmailService.isValidEmail(email)
						}
						className={`
              w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:cursor-pointer
              ${
								isLoading ||
								!email ||
								!password ||
								!EmailService.isValidEmail(email)
									? "bg-gray-300 text-gray-500 cursor-not-allowed"
									: "bg-brand-primary-light hover:bg-brand-primary-hover-light dark:bg-brand-primary-dark dark:hover:bg-brand-primary-hover-dark text-white shadow-lg hover:shadow-xl"
							}
            `}
					>
						{isLoading ? "Signing In..." : "Sign In"}
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
                ${
									isDark
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
						disabled={isLoading}
						className={`
              w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 border-2 hover:cursor-pointer
              ${
								isLoading
									? "bg-gray-300 text-gray-500 cursor-not-allowed"
									: isDark
									? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark hover:bg-bg-primary-dark"
									: "bg-bg-tertiary-light border-border-light text-text-primary-light hover:bg-bg-primary-light"
							}
            `}
					>
						<div className="flex items-center justify-center space-x-2">
							<FcGoogle size={16} />
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
						Don't have an account?{" "}
						<button
							type="button"
							onClick={onSwitchMode}
							className={`
                font-medium transition-colors duration-200 hover:cursor-pointer
                ${
									isDark
										? "text-brand-primary-dark hover:text-brand-primary-hover-dark"
										: "text-brand-primary-light hover:text-brand-primary-hover-light"
								}
              `}
						>
							Sign up
						</button>
					</p>
				</div>
			</form>
		</motion.div>
	);
};
