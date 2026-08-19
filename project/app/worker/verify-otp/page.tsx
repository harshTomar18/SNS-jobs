'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowRight, RotateCw } from 'lucide-react';
import { authApi } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function VerifyOTPContent() {
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const phone = searchParams.get('phone') || '';
  const email = searchParams.get('email') || '';
  const targetAddress = email || phone || 'your email address';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.verifyWorkerOtp(phone, otp);
      setSession(result.token, result.user, '/worker/onboarding');
      toast.success('Email verified. Welcome to SCN Jobs.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Invalid OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const result = await authApi.resendWorkerOtp(phone);
      toast.success(result.devOtp ? `OTP resent. Dev OTP: ${result.devOtp}` : 'OTP resent to your email');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to resend OTP'));
      return;
    }
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) clearInterval(interval);
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${targetAddress}`}
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={handleVerify}
          className="w-full"
          size="lg"
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify & Continue'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">Didn&apos;t receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:text-muted-foreground"
          >
            <RotateCw className="h-3.5 w-3.5" />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function WorkerVerifyOTPPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Verify your email" subtitle="Preparing verification">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </AuthLayout>
      }
    >
      <VerifyOTPContent />
    </Suspense>
  );
}
