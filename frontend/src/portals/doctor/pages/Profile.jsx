import React from 'react';
import { Stethoscope, Mail, Clock, Calendar } from 'lucide-react';
import { Card, SkeletonCard } from '../../../design-system';
import { useDoctorProfile } from '../../../api/queries';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorProfilePage() {
  const { data: profile, isLoading } = useDoctorProfile();

  if (isLoading) {
    return <div className="max-w-2xl space-y-4"><SkeletonCard /><SkeletonCard /></div>;
  }

  if (!profile) {
    return <Card className="max-w-2xl text-center py-10"><p className="text-neutral-500">Profile not found.</p></Card>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">My Profile</h1>
        <p className="text-neutral-500 mt-1">Your professional information</p>
      </div>

      <Card>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-doctor-100 flex items-center justify-center">
            <Stethoscope className="w-7 h-7 text-doctor-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">{profile.name}</h2>
            <p className="text-sm text-doctor-600 font-medium">{profile.specialisation}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
            <Mail className="w-4 h-4 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-500">Email</p>
              <p className="text-sm text-neutral-800">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
            <Clock className="w-4 h-4 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-500">Slot Duration</p>
              <p className="text-sm text-neutral-800">{profile.slotDurationMinutes} minutes</p>
            </div>
          </div>
          {profile.bio && (
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 mb-1">Bio</p>
              <p className="text-sm text-neutral-700">{profile.bio}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
