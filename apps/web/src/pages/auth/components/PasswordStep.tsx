import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaUser } from "react-icons/fa";

interface PasswordStepProps {
	isDark: boolean;
	password: string;
	onPasswordChange: (password: string) => void;
	onSubmit: () => void;
	onBack: () => void;
	isLoading: boolean;
	skipPassword: boolean;
	setSkipPassword: (skipPassword: boolean) => void;
}

export const PasswordStep: React.FC<PasswordStepProps> = ({
	isDark,
	password,
	onPasswordChange,
	onSubmit,
	onBack,
	isLoading,
	skipPassword,
	setSkipPassword,
}) => {
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!skipPassword && password.length < 6) {
			return;
		} else {
			onSubmit();
		}
	};

	const getPasswordStrength = (pwd: string) => {
		if (!pwd) return { strength: 0, label: "", color: "" };

		let strength = 0;
		if (pwd.length >= 6) strength += 1;
		if (pwd.length >= 8) strength += 1;
		if (/[A-Z]/.test(pwd)) strength += 1;
		if (/[0-9]/.test(pwd)) strength += 1;
		if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;

		const labels = ["Too Short", "Weak", "Fair", "Good", "Strong"];
		const colors = [
			"red-500",
			"orange-500",
			"yellow-500",
			"green-500",
			"darkgreen",
		];

		return {
			strength,
			label: labels[strength - 1] || "",
			color: colors[strength - 1] || "",
		};
	};

	const passwordStrength = getPasswordStrength(password);

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
					<FaUser
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
					{skipPassword ? "Welcome!" : "Set Your Password"}
				</h3>
				<p
					className={`
          text-sm
          ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
        `}
				>
					{skipPassword
						? "You can set up a password later in your profile settings."
						: "Create a secure password or skip for now."}
				</p>
			</div>

			{/* Skip password option */}
			<div className="mb-4">
				<label className="flex items-center">
					<input
						type="checkbox"
						checked={skipPassword}
						onChange={(e) => {
							setSkipPassword(e.target.checked);
							console.log("skip password ? ", skipPassword);
						}}
						className="mr-2"
					/>
					<span
						className={`
            text-sm
            ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
          `}
					>
						Skip password for now (set up later)
					</span>
				</label>
			</div>

			{/* Password form */}
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Password input */}

				{/* Password input */}
				{!skipPassword && (
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
                  ${isDark
										? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark placeholder-text-muted-dark"
										: "bg-bg-tertiary-light border-border-light text-text-primary-light placeholder-text-muted-light"
									}
                  focus:border-brand-primary-light dark:focus:border-brand-primary-dark focus:ring-0
                `}
								required={!skipPassword}
								minLength={skipPassword ? 0 : 6}
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
                  ${isDark
										? "text-text-muted-dark hover:text-text-secondary-dark"
										: "text-text-muted-light hover:text-text-secondary-light"
									}
                `}
							>
								{showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
							</button>
						</div>

						{/* Password strength indicator */}
						{password && !skipPassword && (
							<div className="mt-2">
								<div className="flex justify-between text-xs">
									<span
										className={`
                    ${isDark ? "text-text-muted-dark" : "text-text-muted-light"}
                  `}
									>
										Password strength
									</span>
									<span
										className={`font-medium text-${passwordStrength.color}`}
									>
										{passwordStrength.label}
									</span>
								</div>
								<div className="mt-1 h-1 bg-gray-200 rounded">
									<div
										className={`h-1 rounded bg-${passwordStrength.color} transition-all duration-300`}
										style={{
											width: `${(passwordStrength.strength / 5) * 100}%`,
										}}
									/>
								</div>
							</div>
						)}
					</div>
				)}

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
						disabled={isLoading || (!skipPassword && password.length < 6)}
						className={`
              flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200
              ${isLoading || (!skipPassword && password.length < 6)
								? "bg-gray-300 text-gray-500 cursor-not-allowed"
								: "bg-brand-primary-light hover:bg-brand-primary-hover-light dark:bg-brand-primary-dark dark:hover:bg-brand-primary-hover-dark text-white shadow-lg hover:shadow-xl"
							}
            `}
					>
						{isLoading
							? "Creating Account..."
							: skipPassword
								? "Continue"
								: "Create Account"}
					</button>
				</div>
			</form>
		</motion.div>
	);
};
