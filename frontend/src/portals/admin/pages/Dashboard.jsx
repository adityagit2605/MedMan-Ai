import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldAlert, MailWarning, ArrowRight, Activity } from 'lucide-react';
import { Card } from '../../../design-system';
import { useAdminDoctors, useNotifications } from '../../../api/queries';

export default function AdminDashboard() {
  const { data: doctors = [] } = useAdminDoctors();
  const { data: notifications = [] } = useNotifications();
  const failedNotifs = notifications.filter(n => n.status === 'FAILED');

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Admin Dashboard</h1>
        <p className="text-neutral-500 mt-1">System overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-admin-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-admin-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{doctors.length}</p>
              <p className="text-xs text-neutral-500">Total Doctors</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
              <MailWarning className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">{failedNotifs.length}</p>
              <p className="text-xs text-neutral-500">Failed Notifications</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">Active</p>
              <p className="text-xs text-neutral-500">System Status</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/admin/doctors">
          <Card className="hover:shadow-card-hover transition-shadow duration-200 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-admin-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-admin-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-800">Manage Doctors</p>
                <p className="text-xs text-neutral-500">Create, edit, and manage doctor profiles</p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-admin-600 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link to="/admin/conflicts">
          <Card className="hover:shadow-card-hover transition-shadow duration-200 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-800">Conflict Monitor</p>
                <p className="text-xs text-neutral-500">Leave conflicts awaiting reschedule</p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-orange-600 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link to="/admin/notifications">
          <Card className="hover:shadow-card-hover transition-shadow duration-200 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                <MailWarning className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-800">Notifications</p>
                <p className="text-xs text-neutral-500">Monitor failed email/calendar jobs</p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-red-600 transition-colors" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
