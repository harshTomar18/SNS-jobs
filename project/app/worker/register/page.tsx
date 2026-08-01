'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, User, Mail, Phone, Lock } from 'lucide-react';
import { authApi } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  agree: z.boolean().refine((v) => v, 'You must agree to the terms'),
});

type FormData = z.infer<typeof schema>;

export default function WorkerRegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { agree: false },
  });

  const agreeValue = watch('agree');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await authApi.registerWorker({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      toast.success(
        result.devOtp
          ? `Account created. Dev OTP: ${result.devOtp}`
          : 'Account created! Verify your phone number.',
      );
      router.push(`/worker/verify-otp?phone=${encodeURIComponent(data.phone)}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join SCN Jobs and start your journey toward your next opportunity."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              placeholder="Rahul Verma"
              className="pl-10 transition-colors focus-visible:ring-primary/50"
              {...register('fullName')}
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="rahul@example.com"
              className="pl-10 transition-colors focus-visible:ring-primary/50"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-input bg-muted px-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              +91
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="98765 43210"
              className="flex-1 transition-colors focus-visible:ring-primary/50"
              {...register('phone')}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              className="pl-10 transition-colors focus-visible:ring-primary/50"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <Controller
            control={control}
            name="agree"
            render={({ field }) => (
              <Checkbox
                id="agree"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="agree" className="text-sm font-normal text-muted-foreground">
            I agree to the{' '}
            <a href="#" className="font-medium text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="font-medium text-primary hover:underline">
              Privacy Policy
            </a>
          </Label>
        </div>
        {errors.agree && (
          <p className="text-xs text-destructive">{errors.agree.message}</p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}
