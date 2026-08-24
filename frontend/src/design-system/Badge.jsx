import React from 'react';
import {
  CheckCircle2, Clock, XCircle, CircleDot, AlertTriangle,
  Send, AlertCircle, Minus
} from 'lucide-react';

// ── Status Badge ────────────────────────────────────────
const statusConfig = {
  HELD:           { label: 'Held',           color: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Clock },
  CONFIRMED:      { label: 'Confirmed',      color: 'bg-green-50 text-green-700 border-green-200',    icon: CheckCircle2 },
  CANCELLED:      { label: 'Cancelled',      color: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle },
  COMPLETED:      { label: 'Completed',      color: 'bg-neutral-50 text-neutral-600 border-neutral-200', icon: CircleDot },
  LEAVE_CONFLICT: { label: 'Needs Reschedule', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle },
  PENDING:        { label: 'Pending',        color: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Clock },
  SENT:           { label: 'Sent',           color: 'bg-green-50 text-green-700 border-green-200',    icon: Send },
  FAILED:         { label: 'Failed',         color: 'bg-red-50 text-red-700 border-red-200',          icon: AlertCircle },
};

export function StatusBadge({ status, className = '' }) {
  const config = statusConfig[status] || {
    label: status,
    color: 'bg-neutral-50 text-neutral-600 border-neutral-200',
    icon: Minus,
  };
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
        rounded-full border ${config.color} ${className}
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

// ── Urgency Badge ───────────────────────────────────────
const urgencyConfig = {
  LOW:    { label: 'Low',    color: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  MEDIUM: { label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200',  icon: AlertTriangle },
  HIGH:   { label: 'High',   color: 'bg-red-50 text-red-700 border-red-200',        icon: AlertCircle },
};

export function UrgencyBadge({ level, className = '' }) {
  const config = urgencyConfig[level?.toUpperCase()] || urgencyConfig.LOW;
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
        rounded-full border ${config.color} ${className}
      `}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label} Urgency
    </span>
  );
}
