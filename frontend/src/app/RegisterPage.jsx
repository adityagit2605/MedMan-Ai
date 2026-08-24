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

const registerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone:    z.string().optional(),
});

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const {
    register: reg, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data) => {
    try {
      const response = await authApi.register({ ...data, role: 'PATIENT' });
      login(response.user, response.accessToken, response.refreshToken);
      navigate('/patient');
      toast.success('Account created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-patient-700 via-patient-600 to-patient-800 text-white flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-white/15 rounded-2xl flex items-center justify-center">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-3">MedMan AI</h1>
          <p className="text-patient-200 text-lg leading-relaxed">
            Create your patient account to book appointments, describe symptoms, and receive AI-powered visit summaries.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-patient-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-neutral-800">MedMan AI</h1>
          </div>

          <h2 className="text-2xl font-bold text-neutral-800 mb-1">Create account</h2>
          <p className="text-neutral-500 mb-8">Register as a new patient</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="register-name"
              label="Full name"
              placeholder="John Doe"
              error={errors.name?.message}
              {...reg('name')}
            />
            <Input
              id="register-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...reg('email')}
            />
            <div className="relative">
              <Input
                id="register-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                error={errors.password?.message}
                {...reg('password')}
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
            <Input
              id="register-phone"
              label="Phone (optional)"
              placeholder="+1 234 567 8900"
              {...reg('phone')}
            />

            <Button type="submit" loading={isSubmitting} className="w-full">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-patient-600 hover:text-patient-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
