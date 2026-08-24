import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Stethoscope, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../design-system';
import { authApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    try {
      const response = await authApi.login(data);
      login(response.user, response.accessToken, response.refreshToken);

      const role = response.user.role?.replace('ROLE_', '')?.toLowerCase();
      const homeMap = { patient: '/patient', doctor: '/doctor', admin: '/admin' };
      navigate(homeMap[role] || '/');
      toast.success(`Welcome back, ${response.user.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-patient-700 via-patient-600 to-patient-800 text-white flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-white/15 rounded-2xl flex items-center justify-center">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-3">MedMan AI</h1>
          <p className="text-patient-200 text-lg leading-relaxed">
            Healthcare Appointment & Follow-up Manager with AI-powered clinical intelligence.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold">AI</p>
              <p className="text-xs text-patient-200 mt-1">Pre-visit Summary</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-patient-200 mt-1">Online Booking</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-patient-200 mt-1">Portals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-patient-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-neutral-800">MedMan AI</h1>
          </div>

          <h2 className="text-2xl font-bold text-neutral-800 mb-1">Sign in</h2>
          <p className="text-neutral-500 mb-8">Access your healthcare portal</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="login-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                id="login-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-neutral-400 hover:text-neutral-600"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            New patient?{' '}
            <Link to="/register" className="text-patient-600 hover:text-patient-700 font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
