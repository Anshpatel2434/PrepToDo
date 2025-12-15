import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  useGetAuthStateQuery,
  useSendOtpEmailMutation, 
  useVerifyOtpMutation, 
  useFinalizeSignupMutation, 
  useLoginMutation, 
  useLoginWithGoogleMutation 
} from '../redux_usecases/authApi';
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
  // Get auth state from RTK Query
  const { data: authState, refetch } = useGetAuthStateQuery();
  
  // Local state
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setLocalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // API mutations
  const [sendOtpEmail, { isLoading: isSendingOtp }] = useSendOtpEmailMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  const [finalizeSignup, { isLoading: isFinalizing }] = useFinalizeSignupMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [loginWithGoogle, { isLoading: isGoogleLoading }] = useLoginWithGoogleMutation();

  // Handle email step
  const handleEmailSubmit = async (emailValue: string) => {
    if (!EmailService.isValidEmail(emailValue)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLocalEmail(emailValue);
    
    if (mode === 'signup') {
      try {
        const result = await sendOtpEmail({ email: emailValue }).unwrap();
        toast.success(result.message);
        refetch(); // Refresh auth state
      } catch (error) {
        const err = error as { data?: string; message?: string };
        toast.error(err.data || 'Failed to send OTP');
        refetch(); // Refresh auth state to show error
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
    
    const currentEmail = authState?.email || email;
    
    try {
      const result = await verifyOtp({ email: currentEmail, otp }).unwrap();
      toast.success(result.message);
      refetch(); // Refresh auth state
    } catch (error) {
      const err = error as { data?: string; message?: string };
      toast.error(err.data || 'Invalid OTP');
      refetch(); // Refresh auth state to show error
    }
  };

  // Handle password/setup step
  const handlePasswordSubmit = async () => {
    const currentEmail = authState?.email || email;
    
    try {
      const result = await finalizeSignup({ 
        email: currentEmail, 
        password: password || undefined 
      }).unwrap();
      
      toast.success(result.message);
      refetch(); // Refresh auth state
      onClose();
    } catch (error) {
      const err = error as { data?: string; message?: string };
      toast.error(err.data || 'Failed to complete signup');
      refetch(); // Refresh auth state to show error
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
    
    try {
      await login({ email, password }).unwrap();
      toast.success('Logged in successfully!');
      refetch(); // Refresh auth state
      onClose();
    } catch (error) {
      const err = error as { data?: string; message?: string };
      toast.error(err.data || 'Login failed');
      refetch(); // Refresh auth state to show error
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle().unwrap();
      // Google OAuth will redirect
      refetch(); // Refresh auth state
    } catch (error) {
      const err = error as { data?: string; message?: string };
      toast.error(err.data || 'Google login failed');
      refetch(); // Refresh auth state to show error
    }
  };

  // Handle mode switch
  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setLocalEmail('');
    setPassword('');
    setOtp('');
    refetch(); // Refresh auth state
  };

  const isLoading = isSendingOtp || isVerifyingOtp || isFinalizing || isLoggingIn || isGoogleLoading;
  const isSignupStep1 = mode === 'signup' && (authState?.signupStep || 1) === 1;
  const isSignupStep2 = mode === 'signup' && (authState?.signupStep || 1) === 2;
  const isSignupStep3 = mode === 'signup' && (authState?.signupStep || 1) === 3;
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
            error={authState?.error || null}
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
            error={authState?.error || null}
          />
        )}

        {isSignupStep2 && (
          <OtpStep
            key="signup-step2"
            isDark={isDark}
            otp={otp}
            onOtpChange={setOtp}
            onSubmit={handleOtpSubmit}
            onBack={() => {
              // Use manual state management for step navigation
              setMode('signup');
            }}
            isLoading={isLoading}
            error={authState?.error || null}
          />
        )}

        {isSignupStep3 && (
          <PasswordStep
            key="signup-step3"
            isDark={isDark}
            password={password}
            onPasswordChange={setPassword}
            onSubmit={handlePasswordSubmit}
            onBack={() => {
              // Use manual state management for step navigation
              setMode('signup');
            }}
            isLoading={isLoading}
            error={authState?.error || null}
          />
        )}
      </AnimatePresence>
    </div>
  );
};