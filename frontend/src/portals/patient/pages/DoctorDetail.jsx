import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Mail, Phone, ArrowLeft, Calendar } from 'lucide-react';
import { Card, Button, SkeletonCard } from '../../../design-system';
import { useDoctor } from '../../../api/queries';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorDetailPage() {
  const { id } = useParams();
  const { data: doctor, isLoading } = useDoctor(id);

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!doctor) {
    return (
      <Card className="max-w-3xl text-center py-10">
        <p className="text-neutral-500">Doctor not found.</p>
        <Link to="/patient/doctors">
          <Button variant="secondary" size="sm" className="mt-3">Back to search</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/patient/doctors" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700">
        <ArrowLeft className="w-4 h-4" />
        Back to search
      </Link>

      {/* Doctor header */}
      <Card>
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-patient-100 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-patient-600">
              {doctor.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-neutral-800">{doctor.name}</h1>
            <p className="text-sm text-patient-600 font-medium mt-0.5">{doctor.specialisation}</p>
            {doctor.bio && (
              <p className="text-sm text-neutral-600 mt-3 leading-relaxed">{doctor.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {doctor.slotDurationMinutes} min per appointment
              </span>
              {doctor.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {doctor.email}
                </span>
              )}
              {doctor.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {doctor.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Working hours */}
      {doctor.workingHours?.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-neutral-800 mb-4">Working Hours</h2>
          <div className="space-y-2">
            {doctor.workingHours.map((wh) => (
              <div
                key={wh.dayOfWeek}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-50"
              >
                <span className="text-sm font-medium text-neutral-700">
                  {wh.dayName || dayNames[wh.dayOfWeek]}
                </span>
                <span className="text-sm text-neutral-600">
                  {wh.startTime} — {wh.endTime}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Book CTA */}
      <Link to={`/patient/book/${doctor.doctorProfileId}`}>
        <Button className="w-full" size="lg" icon={Calendar}>
          Book Appointment
        </Button>
      </Link>
    </div>
  );
}
