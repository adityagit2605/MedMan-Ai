import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Search, Pill, Clock, ArrowRight } from 'lucide-react';
import { Card, Button } from '../../../design-system';
import { useMyAppointments } from '../../../api/queries';
import { StatusBadge } from '../../../design-system/Badge';
import { useAuthStore } from '../../../store/authStore';
import { format } from 'date-fns';

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const { data: appointments = [], isLoading } = useMyAppointments();

  const upcoming = appointments
    .filter((a) => ['CONFIRMED', 'HELD'].includes(a.status))
    .slice(0, 3);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">
          Welcome back, {firstName}
        </h1>
        <p className="text-neutral-500 mt-1">Manage your appointments and health records</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/patient/doctors">
          <Card className="hover:shadow-card-hover transition-shadow duration-200 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-patient-50 flex items-center justify-center">
                <Search className="w-5 h-5 text-patient-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-800">Find a Doctor</p>
                <p className="text-xs text-neutral-500">Browse by specialisation</p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-patient-600 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link to="/patient/appointments">
          <Card className="hover:shadow-card-hover transition-shadow duration-200 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-800">Appointments</p>
                <p className="text-xs text-neutral-500">View upcoming & past</p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-green-600 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link to="/patient/medications">
          <Card className="hover:shadow-card-hover transition-shadow duration-200 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Pill className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-800">Medications</p>
                <p className="text-xs text-neutral-500">Reminders & prescriptions</p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-600 transition-colors" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Upcoming appointments */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-800">Upcoming Appointments</h2>
          <Link to="/patient/appointments">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No upcoming appointments</p>
            <Link to="/patient/doctors">
              <Button variant="secondary" size="sm" className="mt-3">
                Book an appointment
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <Link key={appt.id} to={`/patient/appointments/${appt.id}`}>
                <div className="flex items-center gap-4 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-patient-50 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-patient-600">
                      {appt.date ? format(new Date(appt.date), 'dd') : '--'}
                    </span>
                    <span className="text-[10px] text-patient-500">
                      {appt.date ? format(new Date(appt.date), 'MMM') : '--'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800">{appt.doctorName}</p>
                    <p className="text-xs text-neutral-500">{appt.specialisation} • {appt.startTime}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
