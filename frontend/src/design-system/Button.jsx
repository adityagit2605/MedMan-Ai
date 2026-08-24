import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-patient-600 text-white hover:bg-patient-700 focus-visible:ring-patient-500',
  secondary: 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 focus-visible:ring-neutral-400',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost:     'bg-transparent text-neutral-600 hover:bg-neutral-100 focus-visible:ring-neutral-400',
  success:   'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}
