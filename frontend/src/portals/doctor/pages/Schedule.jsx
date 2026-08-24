import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Clock, User } from 'lucide-react';
import { Card, Button, SkeletonCard } from '../../../design-system';
import { StatusBadge, UrgencyBadge } from '../../../design-system/Badge';
import { useDoctorSchedule } from '../../../api/queries';

export default function SchedulePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const [currentDate, setCurrentDate] = useState(
    dateParam ? new Date(dateParam) : new Date()
  );

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const { data: appointments = [], isLoading } = useDoctorSchedule(dateStr);

  const navigateDate = (direction) => {
    const newDate = direction === 'next'
      ? addDays(currentDate, 1)
      : subDays(currentDate, 1);
    setCurrentDate(newDate);
    setSearchParams({ date: format(newDate, 'yyyy-MM-dd') });
  };

  // Sort by start time
  const sorted = [...appointments].sort((a, b) =>
    (a.startTime || '').localeCompare(b.startTime || '')
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Schedule</h1>
        <p className="text-neutral-500 mt-1">Your appointment schedule</p>
      </div>

      {/* Date navigator */}
      <Card padding="p-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-lg font-semibold text-neutral-800">
              {format(currentDate, 'EEEE')}
            </p>
            <p className="text-sm text-neutral-500">
              {format(currentDate, 'MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </Card>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <Card className="text-center py-10">
          <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No appointments scheduled for this day</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((appt) => (
            <Link key={appt.id} to={`/doctor/appointments/${appt.id}`}>
              <Card className="hover:shadow-card-hover transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center gap-4">
                  {/* Time column */}
                  <div className="w-20 flex-shrink-0 text-center">
                    <p className="text-sm font-semibold text-doctor-700">
                      {appt.startTime?.slice(0, 5)}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {appt.endTime?.slice(0, 5)}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="w-1 h-12 bg-doctor-200 rounded-full flex-shrink-0" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-neutral-800">
                        {appt.patientName || 'Patient'}
                      </p>
                      {appt.symptomSummary?.urgencyLevel && (
                        <UrgencyBadge level={appt.symptomSummary.urgencyLevel} />
                      )}
                    </div>
                    {appt.symptomSummary?.chiefComplaint && (
                      <p className="text-xs text-neutral-500 truncate">
                        {appt.symptomSummary.chiefComplaint}
                      </p>
                    )}
                  </div>

                  <StatusBadge status={appt.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
