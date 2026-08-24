import React from 'react';
import { ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { Card, SkeletonTable } from '../../../design-system';
import { StatusBadge, UrgencyBadge } from '../../../design-system/Badge';
import { useMyAppointments } from '../../../api/queries';

export default function ConflictsPage() {
  // In a real app, this would be a dedicated admin endpoint.
  // For now, we'll show a placeholder since the admin conflicts endpoint
  // would need to be added to the backend.

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Conflict Monitor</h1>
        <p className="text-neutral-500 mt-1">
          Appointments in leave-conflict status awaiting patient reschedule
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Doctor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Original Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center">
                  <ShieldAlert className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">No active conflicts</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Leave conflicts will appear here when a doctor is marked on leave over existing bookings.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
