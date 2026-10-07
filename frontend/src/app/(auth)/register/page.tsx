'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { referralService } from '@/services/referral.service';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      referralCode: refCode,
    }
  });

  const enteredCode = (watch('referralCode') || '').trim();
  const { data: refCheck, isFetching: isCheckingRef } = useQuery({
    queryKey: ['referral-validate', enteredCode],
    queryFn: () => referralService.validateCode(enteredCode),
    enabled: enteredCode.length >= 4,
    staleTime: 60_000,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      // Redirect to login after successful registration
      router.push('/login?registered=true');
    },
    onError: (error: any) => {
      setServerError(
        error.response?.data?.message || error.response?.data?.error || 'Registration failed. Please try again.'
      );
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    setServerError(null);
    const { confirmPassword, ...submitData } = values;
    mutation.mutate(submitData);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
        <CardDescription>Enter your details to register.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {serverError}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
            <Input
              id="referralCode"
              type="text"
              placeholder="Enter referral code if you have one"
              {...register('referralCode')}
            />
            {enteredCode.length >= 4 && !isCheckingRef && refCheck && (
              refCheck.valid ? (
                <p id="referral-valid" className="text-sm text-green-600">✓ Valid code — you were invited by {refCheck.referrer}</p>
              ) : (
                <p id="referral-invalid" className="text-sm text-amber-600">This referral code was not recognised. You can still register without it.</p>
              )
            )}
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Registering...' : 'Register'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t p-4 mt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
