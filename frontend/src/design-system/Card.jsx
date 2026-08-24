import React from 'react';

export default function Card({ children, className = '', padding = 'p-5', ...props }) {
  return (
    <div
      className={`bg-white rounded-xl border border-neutral-200 shadow-card ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-neutral-800 ${className}`}>
      {children}
    </h3>
  );
}
