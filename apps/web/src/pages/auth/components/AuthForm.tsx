import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

import {
    useCheckUserExistsMutation,
    useLoginMutation,
    useLoginWithGoogleMutation,
    useSendOtpToEmailMutation,
    useUpdateUserPasswordMutation,
    useVerifyUserOtpMutation,
} from "../redux_usecases/authApi";
import { EmailService } from "../../../services/email-handling/emailService";
import type { RootState } from "../../../store";

// Import steps components
import { EmailStep } from "./EmailStep";
import { OtpStep } from "./OtpStep";
import { PasswordStep } from "./PasswordStep";
import { LoginStep } from "./LoginStep";
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
    // Get auth state from RTK Query
    const authState = useSelector((state: RootState) => state.auth);

    // Local state
    const [mode, setMode] = useState<AuthMode>(initialMode);
    const [email, setLocalEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");

    const [skipPassword, setSkipPassword] = useState(false);

    // API mutations
    const [sendOtpToEmail, { isLoading: isSendingOtp }] =
        useSendOtpToEmailMutation();
    const [verifyUserOtp, { isLoading: isVerifyingOtp }] =
        useVerifyUserOtpMutation();
    const [updateUserPassword, { isLoading: isUpdatingPassword }] =
        useUpdateUserPasswordMutation();
    const [login, { isLoading: isLoggingIn }] = useLoginMutation();
    const [loginWithGoogle, { isLoading: isGoogleLoading }] =
        useLoginWithGoogleMutation();
    const [checkUserExists] = useCheckUserExistsMutation();

    // Handle email step
    const handleEmailSubmit = async (emailValue: string) => {
        if (!EmailService.isValidEmail(emailValue)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setLocalEmail(emailValue);

        if (mode === "signup") {
            try {
                const data = await checkUserExists({
                    email: emailValue,
                }).unwrap();
                console.log("This is the response : ");
                console.log(data);
                if (data.exists) {
                    toast.success("Email already exists, try another !");
                    return;
                } else {
                    await sendOtpToEmail({ email: emailValue }).unwrap();
                    toast.success("OTP sent successfully");
                }
            } catch (error) {
                console.log(error);
                const err = error as { data?: string; message?: string };
                toast.error(err.data || "Failed to send OTP");
            }
        } else {
            // For signin, we just move to the password step
            toast.success("Email verified");
        }
    };

    // Handle OTP verification
    const handleOtpSubmit = async () => {
        if (!otp || otp.length !== 8) {
            toast.error("Please enter a valid 8-digit OTP");
            return;
        }

        const currentEmail = authState?.email || email;

        try {
            await verifyUserOtp({
                email: currentEmail,
                token: otp,
            }).unwrap();
            toast.success("OTP verified successfully");
        } catch (error) {
            const err = error as { data?: string; message?: string };
            toast.error(err.data || "Invalid OTP");
        }
    };

    // Handle password/setup step
    const handlePasswordSubmit = async () => {
        if (skipPassword) {
            onClose("success");
        } else {
            try {
                const result = await updateUserPassword({
                    newPassword: password,
                }).unwrap();
                if (result) toast.success("Password Updated Successfully!!");
                setTimeout(() => {
                    onClose("success");
                }, 1000);
            } catch (error) {
                const err = error as { data?: string; message?: string };
                toast.error(err.data || "Failed to complete signup");
            }
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
            const err = error as { data?: string; message?: string };
            toast.error(err.data || "Login failed");
        }
    };

    // Handle Google login
    const handleGoogleLogin = async () => {
        try {
            localStorage.setItem(
                "post_auth_redirect",
                window.location.pathname + window.location.search
            );
            await loginWithGoogle().unwrap();
            // if (data) toast.success("Successfully Logged In !!!");
        } catch (error) {
            const err = error as { data?: string; message?: string };
            toast.error(err.data || "Google login failed");
        }
    };

    // Handle mode switch
    const switchMode = () => {
        setMode(mode === "signin" ? "signup" : "signin");
        setLocalEmail("");
        setPassword("");
        setOtp("");
    };

    const signupStep = authState?.signupStep ?? 1;
    const isSignupStep1 = signupStep === 1;
    const isSignupStep2 = signupStep === 2;
    const isSignupStep3 = signupStep === 3;

    const isLoading =
        isSendingOtp ||
        isVerifyingOtp ||
        isUpdatingPassword ||
        isLoggingIn ||
        isGoogleLoading;
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
                {isSignin && (
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
                        isLoading={isLoading}
                        error={authState?.error || null}
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
                        onBack={() => {
                            // Use manual state management for step navigation
                            setMode("signup");
                        }}
                        isLoading={isLoading}
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
                        onBack={() => {
                            // Use manual state management for step navigation
                            setMode("signup");
                        }}
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
