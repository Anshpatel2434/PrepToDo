import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import { useResetPasswordMutation } from "./redux_usecases/authApi";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [resetPassword, { isLoading }] = useResetPasswordMutation();

    useEffect(() => {
        if (!token) {
            toast.error("Invalid or missing reset token");
            navigate("/auth");
        }
    }, [token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            await resetPassword({ token: token!, password }).unwrap();
            setIsSuccess(true);
            toast.success("Password reset successfully!");
        } catch (error: any) {
            toast.error(error?.data?.error?.message || "Failed to reset password");
        }
    };

    if (isSuccess) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`
						max-w-md w-full mx-4 p-8 rounded-2xl shadow-xl
						${isDark ? "bg-bg-secondary-dark" : "bg-bg-secondary-light"}
					`}
                >
                    <div className="text-center">
                        <FaCheckCircle
                            className={`mx-auto mb-4 ${isDark ? "text-green-400" : "text-green-500"}`}
                            size={48}
                        />
                        <h2
                            className={`text-2xl font-bold mb-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                        >
                            Password Reset Complete
                        </h2>
                        <p
                            className={`mb-6 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                                }`}
                        >
                            Your password has been reset successfully.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate("/auth")}
                            className="w-full py-3 px-4 rounded-xl font-medium bg-brand-primary-light hover:bg-brand-primary-hover-light dark:bg-brand-primary-dark dark:hover:bg-brand-primary-hover-dark text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            Go to Login
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-bg-primary-dark" : "bg-bg-primary-light"}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
					max-w-md w-full mx-4 p-8 rounded-2xl shadow-xl
					${isDark ? "bg-bg-secondary-dark" : "bg-bg-secondary-light"}
				`}
            >
                <h2
                    className={`text-2xl font-bold mb-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                >
                    Reset Your Password
                </h2>
                <p
                    className={`mb-6 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                >
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div>
                        <label
                            className={`block text-sm font-medium mb-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                        >
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                className={`
									w-full pl-10 pr-12 py-3 rounded-xl border-2 transition-colors duration-200
									${isDark
                                        ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark placeholder-text-muted-dark"
                                        : "bg-bg-tertiary-light border-border-light text-text-primary-light placeholder-text-muted-light"
                                    }
									focus:border-brand-primary-light dark:focus:border-brand-primary-dark focus:ring-0
								`}
                                required
                                minLength={8}
                            />
                            <FaLock
                                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                    }`}
                                size={16}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark
                                    ? "text-text-muted-dark hover:text-text-secondary-dark"
                                    : "text-text-muted-light hover:text-text-secondary-light"
                                    }`}
                            >
                                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label
                            className={`block text-sm font-medium mb-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                                }`}
                        >
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className={`
									w-full pl-10 pr-12 py-3 rounded-xl border-2 transition-colors duration-200
									${isDark
                                        ? "bg-bg-tertiary-dark border-border-dark text-text-primary-dark placeholder-text-muted-dark"
                                        : "bg-bg-tertiary-light border-border-light text-text-primary-light placeholder-text-muted-light"
                                    }
									focus:border-brand-primary-light dark:focus:border-brand-primary-dark focus:ring-0
								`}
                                required
                                minLength={8}
                            />
                            <FaLock
                                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? "text-text-muted-dark" : "text-text-muted-light"
                                    }`}
                                size={16}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDark
                                    ? "text-text-muted-dark hover:text-text-secondary-dark"
                                    : "text-text-muted-light hover:text-text-secondary-light"
                                    }`}
                            >
                                {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isLoading || !password || !confirmPassword}
                        className={`
							w-full py-3 px-4 rounded-xl font-medium transition-all duration-200
							${isLoading || !password || !confirmPassword
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-brand-primary-light hover:bg-brand-primary-hover-light dark:bg-brand-primary-dark dark:hover:bg-brand-primary-hover-dark text-white shadow-lg hover:shadow-xl"
                            }
						`}
                    >
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
