import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import type { RootState, AppDispatch } from '../../../store';
import { useSendOtpEmailMutation, useVerifyOtpMutation, useFinalizeSignupMutation, useLoginMutation, useLoginWithGoogleMutation } from '../redux_usecases/authApi';
import {
  setEmail,
  nextSignupStep,
  previousSignupStep,
  resetSignupFlow,
  setEmailVerified,
  setConfirmationToken,
  setError,
  clearError,
  setUser,
} from '../redux_usecases/authSlice';
import { EmailService } from '../../../services/email_handling/emailService';

// Import steps components
import { EmailStep } from './EmailStep';
import { OtpStep } from './OtpStep';
import { PasswordStep } from './PasswordStep';
import { LoginStep } from './LoginStep';

interface AuthFormProps {
  isDark: boolean;
  initialMode: 'signin' | 'signup';
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup';

export const AuthForm: React.FC<AuthFormProps> = ({ isDark, initialMode, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.auth);
  
  // Local state
  const [email, setLocalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // API mutations
  const [sendOtpEmail, { isLoading: isSendingOtp }] = useSendOtpEmailMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  const [finalizeSignup, { isLoading: isFinalizing }] = useFinalizeSignupMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [loginWithGoogle, { isLoading: isGoogleLoading }] = useLoginWithGoogleMutation();

  // Initialize form mode using useMemo to avoid setState in effect
  const defaultMode = useMemo(() => {
    return initialMode === 'signup' ? 'signup' : 'signin';
  }, [initialMode]);
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  // Reset signup flow when needed
  useEffect(() => {
    if (initialMode === 'signup') {
      dispatch(resetSignupFlow());
    }
  }, [initialMode, dispatch]);

  // Handle email step
  const handleEmailSubmit = async (emailValue: string) => {
    if (!EmailService.isValidEmail(emailValue)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLocalEmail(emailValue);
    dispatch(setEmail(emailValue));
    dispatch(clearError());
    
    if (mode === 'signup') {
      try {
      const result = await sendOtpEmail({ email: emailValue }).unwrap();
      dispatch(nextSignupStep());
      toast.success(result.message);
    } catch (error) {
      const err = error as { data?: string; message?: string };
      dispatch(setError(err.data || 'Failed to send OTP'));
      toast.error(err.data || 'Failed to send OTP');
    }
    } else {
      // For signin, we just move to the password step
      toast.success('Email verified');
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    dispatch(clearError());
    
    try {
      const result = await verifyOtp({ email: authState.email, otp }).unwrap();
      dispatch(setEmailVerified(true));
      dispatch(setConfirmationToken(result.token));
      dispatch(nextSignupStep());
      toast.success(result.message);
    } catch (error) {
      const err = error as { data?: string; message?: string };
      dispatch(setError(err.data || 'Invalid OTP'));
      toast.error(err.data || 'Invalid OTP');
    }
  };

  // Handle password/setup step
  const handlePasswordSubmit = async () => {
    dispatch(clearError());
    
    try {
      const result = await finalizeSignup({ 
        email: authState.email, 
        password: password || undefined 
      }).unwrap();
      
      dispatch(setUser(result.user));
      toast.success(result.message);
      onClose();
    } catch (error) {
      const err = error as { data?: string; message?: string };
      dispatch(setError(err.data || 'Failed to complete signup'));
      toast.error(err.data || 'Failed to complete signup');
    }
  };

  // Handle traditional login
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    if (!EmailService.isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    dispatch(clearError());
    
    try {
      await login({ email, password }).unwrap();
      toast.success('Logged in successfully!');
      onClose();
    } catch (error) {
      const err = error as { data?: string; message?: string };
      dispatch(setError(err.data || 'Login failed'));
      toast.error(err.data || 'Login failed');
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    dispatch(clearError());
    
    try {
      await loginWithGoogle().unwrap();
      // Google OAuth will redirect
    } catch (error) {
      const err = error as { data?: string; message?: string };
      dispatch(setError(err.data || 'Google login failed'));
      toast.error(err.data || 'Google login failed');
    }
  };

  // Handle mode switch
  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    dispatch(resetSignupFlow());
    setLocalEmail('');
    setPassword('');
    setOtp('');
    dispatch(clearError());
  };

  const isLoading = isSendingOtp || isVerifyingOtp || isFinalizing || isLoggingIn || isGoogleLoading;
  const isSignupStep1 = mode === 'signup' && authState.signupStep === 1;
  const isSignupStep2 = mode === 'signup' && authState.signupStep === 2;
  const isSignupStep3 = mode === 'signup' && authState.signupStep === 3;
  const isSignin = mode === 'signin';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className={`
          text-2xl font-bold mb-2
          ${isDark ? 'text-text-primary-dark' : 'text-text-primary-light'}
        `}>
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className={`
          text-sm
          ${isDark ? 'text-text-secondary-dark' : 'text-text-secondary-light'}
        `}>
          {mode === 'signin' 
            ? 'Sign in to access your account' 
            : 'Join our community in 3 simple steps'
          }
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
            error={authState.error}
          />
        )}

        {isSignupStep1 && (
          <EmailStep
            key="signup-step1"
            isDark={isDark}
            email={email}
            onEmailChange={setLocalEmail}
            onSubmit={handleEmailSubmit}
            isLoading={isLoading}
            error={authState.error}
          />
        )}

        {isSignupStep2 && (
          <OtpStep
            key="signup-step2"
            isDark={isDark}
            otp={otp}
            onOtpChange={setOtp}
            onSubmit={handleOtpSubmit}
            onBack={() => dispatch(previousSignupStep())}
            isLoading={isLoading}
            error={authState.error}
          />
        )}

        {isSignupStep3 && (
          <PasswordStep
            key="signup-step3"
            isDark={isDark}
            password={password}
            onPasswordChange={setPassword}
            onSubmit={handlePasswordSubmit}
            onBack={() => dispatch(previousSignupStep())}
            isLoading={isLoading}
            error={authState.error}
          />
        )}
      </AnimatePresence>
    </div>
  );
};