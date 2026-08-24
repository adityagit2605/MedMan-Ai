import React from 'react';

/**
 * Skeleton loaders for various content shapes.
 */
export function SkeletonLine({ width = 'w-full', height = 'h-4', className = '' }) {
  return <div className={`skeleton ${width} ${height} ${className}`} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-neutral-200 p-5 space-y-3 ${className}`}>
      <SkeletonLine width="w-2/3" height="h-5" />
      <SkeletonLine width="w-full" height="h-4" />
      <SkeletonLine width="w-1/2" height="h-4" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-neutral-200 overflow-hidden ${className}`}>
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width="w-24" height="h-3" />
        ))}
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <SkeletonLine key={j} width="w-24" height="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonSlotGrid({ slots = 8 }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {Array.from({ length: slots }).map((_, i) => (
        <div key={i} className="skeleton h-12 rounded-lg" />
      ))}
    </div>
  );
}
