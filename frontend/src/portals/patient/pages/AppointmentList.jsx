import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Filter } from 'lucide-react';
import { Card, Button, SkeletonCard } from '../../../design-system';
import { StatusBadge, UrgencyBadge } from '../../../design-system/Badge';
import { useMyAppointments } from '../../../api/queries';
import { format } from 'date-fns';

export default function AppointmentListPage() {
  const { data: appointments = [], isLoading } = useMyAppointments();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter(a => {
        if (filter === 'upcoming') return ['CONFIRMED', 'HELD'].includes(a.status);
        if (filter === 'past') return ['COMPLETED', 'CANCELLED'].includes(a.status);
        if (filter === 'conflict') return a.status === 'LEAVE_CONFLICT';
        return true;
      });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">My Appointments</h1>
          <p className="text-neutral-500 mt-1">{appointments.length} total appointments</p>
        </div>
        <Link to="/patient/doctors">
          <Button icon={Calendar} size="sm">New Booking</Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past', label: 'Past' },
          { key: 'conflict', label: 'Needs Reschedule' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-100
              ${filter === tab.key
                ? 'bg-patient-100 text-patient-700'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-10">
          <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No appointments found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => (
            <Link key={appt.id} to={`/patient/appointments/${appt.id}`}>
              <Card className="hover:shadow-card-hover transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-patient-50 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-patient-600">
                      {appt.date ? format(new Date(appt.date), 'dd') : '--'}
                    </span>
                    <span className="text-[10px] text-patient-500">
                      {appt.date ? format(new Date(appt.date), 'MMM') : '--'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-800">{appt.doctorName}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {appt.specialisation} • {appt.startTime?.slice(0, 5)} – {appt.endTime?.slice(0, 5)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {appt.symptomSummary?.urgencyLevel && (
                      <UrgencyBadge level={appt.symptomSummary.urgencyLevel} />
                    )}
                    <StatusBadge status={appt.status} />
                  </div>
                </div>

                {/* Leave conflict notice */}
                {appt.status === 'LEAVE_CONFLICT' && (
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    <p className="text-xs text-orange-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Your appointment needs to be rescheduled — your doctor is unavailable on this date.
                    </p>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
