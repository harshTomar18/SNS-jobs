'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RotateCw,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { authApi } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';

const emailSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

const resetSchema = z
  .object({
    otp: z.string().min(6, 'Enter the 6-digit OTP code').max(6, 'Enter the 6-digit OTP code'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'otp_and_reset' | 'success'>('email');
  const [targetEmail, setTargetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Reset form
  const {
    handleSubmit: handleResetSubmit,
    setValue: setResetValue,
    watch: watchReset,
    register: registerReset,
    formState: { errors: resetErrors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const otpValue = watchReset('otp');

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP
  const onEmailSubmit = async (data: EmailFormData) => {
    setLoading(true);
    try {
      const email = data.email.trim().toLowerCase();
      await authApi.forgotPassword(email);
      setTargetEmail(email);
      setStep('otp_and_reset');
      setResendCooldown(60);
      toast.success('6-digit OTP sent to your email');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No account found with this email'));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending || !targetEmail) return;
    setResending(true);
    try {
      await authApi.forgotPassword(targetEmail);
      setResendCooldown(60);
      toast.success('New OTP sent to your email');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to resend OTP'));
    } finally {
      setResending(false);
    }
  };

  // Step 2: Submit Reset Password with OTP
  const onResetSubmit = async (data: ResetFormData) => {
    setLoading(true);
    try {
      await authApi.resetPassword({
        email: targetEmail,
        otp: data.otp.trim(),
        newPassword: data.newPassword,
      });
      setStep('success');
      toast.success('Password reset successful');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Invalid or expired OTP'));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Success Screen
  if (step === 'success') {
    return (
      <AuthLayout
        title="Password Reset Complete"
        subtitle="Your password has been successfully updated. You can now sign in with your new credentials."
        backLink="/login"
        backLabel="Back to Sign In"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 shadow-sm animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="h-10 w-10" />
            <div className="absolute inset-0 rounded-3xl bg-emerald-400/20 animate-ping pointer-events-none" />
          </div>

          <div className="space-y-2 max-w-sm">
            <h3 className="text-lg font-bold text-foreground">You&apos;re All Set!</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account security has been updated. Please use your new password next time you log in.
            </p>
          </div>

          <Button className="w-full" size="lg" asChild>
            <Link href="/login">
              Proceed to Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Step 2: OTP + Set New Password Screen
  if (step === 'otp_and_reset') {
    return (
      <AuthLayout
        title="Reset Password"
        subtitle={`Enter the 6-digit verification code sent to ${targetEmail} and your new password.`}
        backLink="/login"
        backLabel="Cancel"
      >
        <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-6">
          {/* Target email badge with change button */}
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-3 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate font-medium text-foreground">{targetEmail}</span>
            </div>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-primary hover:underline font-semibold ml-2 shrink-0"
            >
              Change
            </button>
          </div>

          {/* 6-Digit OTP input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="otp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Verification Code (OTP) *
              </Label>
              <span className="text-[11px] text-muted-foreground">Valid for 10 minutes</span>
            </div>
            <div className="flex justify-center py-1">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={(val) => setResetValue('otp', val, { shouldValidate: true })}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="h-11 w-11 text-base font-bold sm:h-12 sm:w-12" />
                  <InputOTPSlot index={1} className="h-11 w-11 text-base font-bold sm:h-12 sm:w-12" />
                  <InputOTPSlot index={2} className="h-11 w-11 text-base font-bold sm:h-12 sm:w-12" />
                  <InputOTPSlot index={3} className="h-11 w-11 text-base font-bold sm:h-12 sm:w-12" />
                  <InputOTPSlot index={4} className="h-11 w-11 text-base font-bold sm:h-12 sm:w-12" />
                  <InputOTPSlot index={5} className="h-11 w-11 text-base font-bold sm:h-12 sm:w-12" />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {resetErrors.otp && (
              <p className="text-center text-xs text-destructive font-medium">{resetErrors.otp.message}</p>
            )}
          </div>

          {/* Resend OTP button with cooldown timer */}
          <div className="flex items-center justify-center text-xs text-muted-foreground gap-1.5">
            <span>Didn&apos;t receive the code?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || resending}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                `Resend code (${resendCooldown}s)`
              ) : (
                <>
                  <RotateCw className="h-3.5 w-3.5" />
                  Resend code
                </>
              )}
            </button>
          </div>

          {/* New Password input */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              New Password *
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className="pl-10 pr-10 h-11"
                {...registerReset('newPassword')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {resetErrors.newPassword && (
              <p className="text-xs text-destructive font-medium">{resetErrors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password input */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Confirm New Password *
            </Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                className="pl-10 pr-10 h-11"
                {...registerReset('confirmPassword')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {resetErrors.confirmPassword && (
              <p className="text-xs text-destructive font-medium">{resetErrors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full h-11 text-sm font-bold" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting Password...
              </>
            ) : (
              <>
                Reset Password
                <KeyRound className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Email
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  // Step 1: Request OTP Screen
  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter the email address registered with your account and we will send you a 6-digit OTP code to reset your password."
      backLink="/login"
      backLabel="Back to Sign In"
    >
      <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Registered Email Address *
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              className="pl-10 h-11"
              {...registerEmail('email')}
              disabled={loading}
            />
          </div>
          {emailErrors.email && (
            <p className="text-xs text-destructive font-medium">{emailErrors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-11 text-sm font-bold" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Code...
            </>
          ) : (
            <>
              Send Verification Code
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground pt-3">
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
