import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Menu, X, LogOut, Bell, User,
  Search, Calendar, Pill, UserCircle,
  LayoutDashboard, Users, ShieldAlert, MailWarning,
  Stethoscope, ClipboardList, UserCog
} from 'lucide-react';

/**
 * App Shell — left sidebar + top bar + content area.
 * Portal variant (patient/doctor/admin) drives accent color and nav items.
 */

const navConfig = {
  patient: {
    accent: 'patient',
    accentBg: 'bg-patient-600',
    accentHover: 'hover:bg-patient-700',
    accentLight: 'bg-patient-50 text-patient-700',
    label: 'Patient Portal',
    icon: UserCircle,
    items: [
      { to: '/patient',              icon: LayoutDashboard, label: 'Dashboard',     end: true },
      { to: '/patient/doctors',      icon: Search,          label: 'Find Doctors' },
      { to: '/patient/appointments', icon: Calendar,        label: 'Appointments' },
      { to: '/patient/medications',  icon: Pill,            label: 'Medications' },
      { to: '/patient/profile',      icon: User,            label: 'Profile' },
    ],
  },
  doctor: {
    accent: 'doctor',
    accentBg: 'bg-doctor-700',
    accentHover: 'hover:bg-doctor-800',
    accentLight: 'bg-doctor-50 text-doctor-700',
    label: 'Doctor Portal',
    icon: Stethoscope,
    items: [
      { to: '/doctor',               icon: LayoutDashboard, label: 'Schedule',       end: true },
      { to: '/doctor/profile',       icon: UserCog,         label: 'Profile' },
    ],
  },
  admin: {
    accent: 'admin',
    accentBg: 'bg-admin-700',
    accentHover: 'hover:bg-admin-800',
    accentLight: 'bg-admin-50 text-admin-700',
    label: 'Admin Portal',
    icon: ShieldAlert,
    items: [
      { to: '/admin',               icon: LayoutDashboard,  label: 'Dashboard',      end: true },
      { to: '/admin/doctors',       icon: Users,            label: 'Doctors' },
      { to: '/admin/conflicts',     icon: ShieldAlert,      label: 'Conflicts' },
      { to: '/admin/notifications', icon: MailWarning,      label: 'Notifications' },
    ],
  },
};

export default function AppShell({ portal = 'patient' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const config = navConfig[portal];
  const PortalIcon = config.icon;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* ── Sidebar ─────────────────────────────────────── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-neutral-900/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 flex flex-col
          bg-white border-r border-neutral-200 shadow-sidebar
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 px-5 py-4 ${config.accentBg}`}>
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <PortalIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">MedMan AI</h1>
            <p className="text-[11px] text-white/70 font-medium">{config.label}</p>
          </div>
          <button
            className="ml-auto lg:hidden p-1 rounded text-white/80 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {config.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100
                ${isActive
                  ? config.accentLight
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-neutral-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="text-xs font-semibold text-neutral-600">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">{user?.name}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 px-4 lg:px-6 py-3 flex items-center gap-4">
          <button
            className="lg:hidden p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <button className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 relative">
            <Bell className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
            <span className="text-xs font-semibold text-neutral-600">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
