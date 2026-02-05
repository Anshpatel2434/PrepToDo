import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";

import {
    useCheckEmailMutation,
    useSendOtpMutation,
    useVerifyOtpMutation,
    useCompleteSignupMutation,
    useLoginMutation,
    useResendOtpMutation,
    useCheckPendingSignupMutation,
    initiateGoogleLogin,
} from "../redux_usecases/authApi";
import { resetAuth, restoreSignupState, clearError } from "../redux_usecases/authSlice";
import { EmailService } from "../../../services/email-handling/emailService";
import type { RootState } from "../../../store";

// Import steps components
import { EmailStep } from "./EmailStep";
import { OtpStep } from "./OtpStep";
import { PasswordStep } from "./PasswordStep";
import { LoginStep } from "./LoginStep";
import { ForgotPasswordStep } from "./ForgotPasswordStep";
import type { AuthPopupCloseReason } from "./AuthPopup";

interface AuthFormProps {
    isDark: boolean;
    initialMode: "signin" | "signup";
    onClose: (reason?: AuthPopupCloseReason) => void;
}

type AuthMode = "signin" | "signup";

export const AuthForm: React.FC<AuthFormProps> = ({
    isDark,
    initialMode,
    onClose,
}) => {
    const dispatch = useDispatch();

    // Get auth state from Redux
    const authState = useSelector((state: RootState) => state.auth);

    // Local state
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [email, setLocalEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [skipPassword, setSkipPassword] = useState(false);
    const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    // API mutations
    const [checkEmail] = useCheckEmailMutation();
    const [sendOtp, { isLoading: isSendingOtp }] = useSendOtpMutation();
    const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
    const [completeSignup, { isLoading: isCompletingSignup }] = useCompleteSignupMutation();
    const [login, { isLoading: isLoggingIn }] = useLoginMutation();
    const [resendOtp, { isLoading: isResendingOtp }] = useResendOtpMutation();
    const [checkPendingSignup] = useCheckPendingSignupMutation();

    // Restore signup state from localStorage on mount (fixes refresh bug)
    useEffect(() => {
        const pendingSignupId = localStorage.getItem('pendingSignupId');
        const pendingSignupEmail = localStorage.getItem('pendingSignupEmail');

        if (pendingSignupId && pendingSignupEmail) {
            // Verify the pending signup is still valid
            checkPendingSignup({ pendingSignupId })
                .unwrap()
                .then((result) => {
                    if (result.valid) {
                        dispatch(restoreSignupState({
                            signupStep: 2, // OTP step
                            email: result.email,
                            pendingSignup: {
                                id: pendingSignupId,
                                email: result.email,
                                expiresAt: result.expires_at,
                            },
                        }));
                        setLocalEmail(result.email);
                        setMode("signup");
                    } else {
                        // Clear invalid pending signup
                        localStorage.removeItem('pendingSignupId');
                        localStorage.removeItem('pendingSignupEmail');
                    }
                })
                .catch(() => {
                    // Clear invalid pending signup
                    localStorage.removeItem('pendingSignupId');
                    localStorage.removeItem('pendingSignupEmail');
                });
        }
    }, [checkPendingSignup, dispatch]);

    // Handle email step for signup
    const handleEmailSubmit = async (emailValue: string, captchaToken?: string) => {
        if (!EmailService.isValidEmail(emailValue)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setLocalEmail(emailValue);
        dispatch(clearError());

        try {
            // First check if email exists
            const checkResult = await checkEmail({ email: emailValue, captchaToken }).unwrap();

            if (checkResult.exists) {
                toast.error("An account with this email already exists. Please sign in instead.");
                return;
            }

            // Send OTP for new user
            await sendOtp({ email: emailValue, captchaToken }).unwrap();
            toast.success("Verification code sent to your email!");
        } catch (error) {
            const err = error as { data?: { error?: { message?: string } }; message?: string };
            toast.error(err.data?.error?.message || "Failed to send verification code");
        }
    };

    // Handle OTP verification
    const handleOtpSubmit = async () => {
        if (!otp || otp.length !== 6) {
            toast.error("Please enter a valid 6-digit code");
            return;
        }

        const currentEmail = authState?.email || email;
        const pendingSignupId = authState?.pendingSignup?.id;

        try {
            await verifyOtp({
                email: currentEmail,
                otp,
                pendingSignupId,
            }).unwrap();
            toast.success("Email verified successfully!");
            setOtp("");
        } catch (error) {
            const err = error as { data?: { error?: { message?: string } }; message?: string };
            toast.error(err.data?.error?.message || "Invalid verification code");
        }
    };

    // Handle OTP resend
    const handleResendOtp = async () => {
        const currentEmail = authState?.email || email;
        const pendingSignupId = authState?.pendingSignup?.id;

        if (!pendingSignupId) {
            toast.error("Session expired. Please start over.");
            dispatch(resetAuth());
            return;
        }

        try {
            await resendOtp({ email: currentEmail, pendingSignupId }).unwrap();
            toast.success("New verification code sent!");
        } catch (error) {
            const err = error as { data?: { error?: { message?: string; retryAfterSeconds?: number } }; message?: string };
            toast.error(err.data?.error?.message || "Failed to resend code");
        }
    };

    // Handle password/setup step completion
    const handlePasswordSubmit = async () => {
        const currentEmail = authState?.email || email;
        const pendingSignupId = authState?.pendingSignup?.id;

        if (!pendingSignupId) {
            toast.error("Session expired. Please start over.");
            dispatch(resetAuth());
            return;
        }

        try {
            await completeSignup({
                email: currentEmail,
                pendingSignupId,
                password: skipPassword ? undefined : password,
                skipPassword,
            }).unwrap();

            toast.success(skipPassword ? "Account created!" : "Account created with password!");
            setTimeout(() => {
                onClose("success");
            }, 500);
        } catch (error) {
            const err = error as { data?: { error?: { message?: string } }; message?: string };
            toast.error(err.data?.error?.message || "Failed to create account");
        }
    };

    // Handle traditional login
    const handleLogin = async () => {
        if (!email || !password) {
            toast.error("Please enter both email and password");
            return;
        }

        if (!EmailService.isValidEmail(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        try {
            await login({ email, password }).unwrap();
            toast.success("Logged in successfully!");
            onClose("success");
        } catch (error) {
            const err = error as { data?: { error?: { message?: string } }; message?: string };
            toast.error(err.data?.error?.message || "Login failed");
        }
    };

    // Handle Google login
    const handleGoogleLogin = () => {
        setIsGoogleRedirecting(true);
        // Always redirect to dashboard after successful OAuth, not back to auth page
        initiateGoogleLogin('/dashboard');
    };

    // Handle mode switch
    const switchMode = () => {
        setMode(mode === "signin" ? "signup" : "signin");
        setLocalEmail("");
        setPassword("");
        setOtp("");
        setShowForgotPassword(false);
        dispatch(resetAuth());
    };

    // Handle back from OTP step
    const handleBackFromOtp = () => {
        dispatch(resetAuth());
        localStorage.removeItem('pendingSignupId');
        localStorage.removeItem('pendingSignupEmail');
    };

    const signupStep = authState?.signupStep ?? 1;
    const isSignupStep1 = signupStep === 1;
    const isSignupStep2 = signupStep === 2;
    const isSignupStep3 = signupStep === 3;

    const isLoading =
        isSendingOtp ||
        isVerifyingOtp ||
        isCompletingSignup ||
        isLoggingIn ||
        isGoogleRedirecting;
    const isSignin = mode === "signin";

    return (
        <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
                <h2
                    className={`
          text-2xl font-bold mb-2
          ${isDark ? "text-text-primary-dark" : "text-text-primary-light"}
        `}
                >
                    {mode === "signin" ? "Welcome Back" : "Create Account"}
                </h2>
                <p
                    className={`
          text-sm
          ${isDark ? "text-text-secondary-dark" : "text-text-secondary-light"}
        `}
                >
                    {mode === "signin"
                        ? "Sign in to access your account"
                        : "Join our community in 3 simple steps"}
                </p>
            </div>

            {/* Form Steps */}
            <AnimatePresence mode="wait">
                {isSignin && !showForgotPassword && (
                    <LoginStep
                        key="login"
                        isDark={isDark}
                        email={email}
                        password={password}
                        onEmailChange={setLocalEmail}
                        onPasswordChange={setPassword}
                        onSubmit={handleLogin}
                        onGoogleLogin={handleGoogleLogin}
                        onSwitchMode={switchMode}
                        onForgotPassword={() => setShowForgotPassword(true)}
                        isLoading={isLoading}
                        isGoogleLoading={isGoogleRedirecting}
                        error={authState?.error || null}
                    />
                )}

                {isSignin && showForgotPassword && (
                    <ForgotPasswordStep
                        key="forgot-password"
                        isDark={isDark}
                        onBack={() => setShowForgotPassword(false)}
                    />
                )}

                {mode === "signup" && isSignupStep1 && (
                    <EmailStep
                        key="signup-step1"
                        isDark={isDark}
                        email={email}
                        onEmailChange={setLocalEmail}
                        onSubmit={handleEmailSubmit}
                        onGoogleLogin={handleGoogleLogin}
                        isLoading={isLoading}
                        isGoogleLoading={isGoogleRedirecting}
                        error={authState?.error || null}
                        onSwitchMode={switchMode}
                    />
                )}

                {mode === "signup" && isSignupStep2 && (
                    <OtpStep
                        key="signup-step2"
                        isDark={isDark}
                        otp={otp}
                        onOtpChange={setOtp}
                        onSubmit={handleOtpSubmit}
                        onBack={handleBackFromOtp}
                        onResendOtp={handleResendOtp}
                        isLoading={isLoading}
                        isResending={isResendingOtp}
                        error={authState?.error || null}
                    />
                )}

                {mode === "signup" && isSignupStep3 && (
                    <PasswordStep
                        key="signup-step3"
                        isDark={isDark}
                        password={password}
                        onPasswordChange={setPassword}
                        onSubmit={handlePasswordSubmit}
                        onBack={handleBackFromOtp}
                        isLoading={isLoading}
                        error={authState?.error || null}
                        skipPassword={skipPassword}
                        setSkipPassword={setSkipPassword}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
