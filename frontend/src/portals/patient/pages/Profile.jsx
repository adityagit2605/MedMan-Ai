import React from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { Card } from '../../../design-system';
import { useAuthStore } from '../../../store/authStore';

export default function PatientProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Profile</h1>
        <p className="text-neutral-500 mt-1">Your account information</p>
      </div>

      <Card>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-patient-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-patient-600">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">{user?.name}</h2>
            <p className="text-sm text-patient-600 font-medium">Patient</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
            <Mail className="w-4 h-4 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-500">Email</p>
              <p className="text-sm text-neutral-800">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
            <User className="w-4 h-4 text-neutral-400" />
            <div>
              <p className="text-xs text-neutral-500">Role</p>
              <p className="text-sm text-neutral-800 capitalize">
                {user?.role?.replace('ROLE_', '')?.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
