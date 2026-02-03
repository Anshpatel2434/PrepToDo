import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { EmailService } from "../../../services/email-handling/emailService";
import { useForgotPasswordMutation } from "../redux_usecases/authApi";
import toast from "react-hot-toast";

interface ForgotPasswordStepProps {
    isDark: boolean;
    onBack: () => void;
}

export const ForgotPasswordStep: React.FC<ForgotPasswordStepProps> = ({
    isDark,
    onBack,
}) => {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !EmailService.isValidEmail(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        try {
            await forgotPassword({ email }).unwrap();
            setIsSubmitted(true);
            toast.success("Password reset link sent!");
        } catch (error: any) {
            toast.error(error?.data?.error?.message || "Failed to send reset link");
        }
    };

    if (isSubmitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
            >
                <FaCheckCircle
                    className={`mx-auto mb-4 ${isDark ? "text-green-400" : "text-green-500"}`}
                    size={48}
                />
                <h3
                    className={`text-xl font-semibold mb-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                        }`}
                >
                    Check your email
                </h3>
                <p
                    className={`mb-6 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                        }`}
                >
                    We've sent a password reset link to <strong>{email}</strong>
                </p>
                <button
                    type="button"
                    onClick={onBack}
                    className={`
						py-2 px-4 rounded-xl font-medium transition-all duration-200
						${isDark
                            ? "text-brand-primary-dark hover:text-brand-primary-hover-dark"
                            : "text-brand-primary-light hover:text-brand-primary-hover-light"
                        }
					`}
                >
                    ← Back to login
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            {/* Back button */}
            <button
                type="button"
                onClick={onBack}
                className={`
					flex items-center gap-2 mb-6 text-sm transition-colors duration-200
					${isDark
                        ? "text-text-secondary-dark hover:text-text-primary-dark"
                        : "text-text-secondary-light hover:text-text-primary-light"
                    }
				`}
            >
                <FaArrowLeft size={12} />
                Back to login
            </button>

            <h2
                className={`text-2xl font-bold mb-2 ${isDark ? "text-text-primary-dark" : "text-text-primary-light"
                    }`}
            >
                Forgot Password?
            </h2>
            <p
                className={`mb-6 ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"
                    }`}
            >
                Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                            onChange={(e) => setEmail(e.target.value)}
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

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isLoading || !email || !EmailService.isValidEmail(email)}
                    className={`
						w-full py-3 px-4 rounded-xl font-medium transition-all duration-200
						${isLoading || !email || !EmailService.isValidEmail(email)
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-brand-primary-light hover:bg-brand-primary-hover-light dark:bg-brand-primary-dark dark:hover:bg-brand-primary-hover-dark text-white shadow-lg hover:shadow-xl"
                        }
					`}
                >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
            </form>
        </motion.div>
    );
};
