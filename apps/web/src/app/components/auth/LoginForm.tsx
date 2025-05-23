'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormData {
  username: string;
  pin: string;
}

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const success = await login(data.username, data.pin);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid username or PIN. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your username and PIN to access your Kanora account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <div
            className="p-3 mb-4 text-sm text-destructive bg-destructive/10 rounded-md"
            role="alert"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Your username"
              autoComplete="username"
              {...register('username', {
                required: 'Username is required',
              })}
              aria-invalid={errors.username ? 'true' : 'false'}
            />
            {errors.username && (
              <p className="text-sm text-destructive" role="alert">
                {errors.username.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              placeholder="Your PIN"
              {...register('pin', {
                required: 'PIN is required',
                minLength: {
                  value: 4,
                  message: 'PIN must be at least 4 digits',
                },
              })}
              aria-invalid={errors.pin ? 'true' : 'false'}
            />
            {errors.pin && (
              <p className="text-sm text-destructive" role="alert">
                {errors.pin.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
