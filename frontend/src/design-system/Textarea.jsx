import React, { forwardRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
  id,
  className = '',
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={`
          w-full px-3 py-2 bg-white border rounded-lg text-sm text-neutral-800
          placeholder:text-neutral-400 resize-vertical
          transition-colors duration-150
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-neutral-300 focus:border-patient-500 focus:ring-1 focus:ring-patient-500'
          }
          focus:outline-none
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
