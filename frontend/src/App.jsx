import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './app/AuthGuard';
import AppShell from './app/AppShell';
import LoginPage from './app/LoginPage';
import RegisterPage from './app/RegisterPage';

// Patient pages
import PatientDashboard from './portals/patient/pages/Dashboard';
import DoctorSearch from './portals/patient/pages/DoctorSearch';
import DoctorDetail from './portals/patient/pages/DoctorDetail';
import BookAppointment from './portals/patient/pages/BookAppointment';
import SymptomForm from './portals/patient/pages/SymptomForm';
import AppointmentList from './portals/patient/pages/AppointmentList';
import AppointmentDetail from './portals/patient/pages/AppointmentDetail';
import Medications from './portals/patient/pages/Medications';
import PatientProfile from './portals/patient/pages/Profile';

// Doctor pages
import DoctorSchedule from './portals/doctor/pages/Schedule';
import DoctorAppointmentDetail from './portals/doctor/pages/AppointmentDetail';
import NotesEditor from './portals/doctor/pages/NotesEditor';
import DoctorProfile from './portals/doctor/pages/Profile';

// Admin pages
import AdminDashboard from './portals/admin/pages/Dashboard';
import DoctorList from './portals/admin/pages/DoctorList';
import DoctorEdit from './portals/admin/pages/DoctorEdit';
import Conflicts from './portals/admin/pages/Conflicts';
import Notifications from './portals/admin/pages/Notifications';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Patient portal */}
      <Route
        path="/patient"
        element={
          <AuthGuard allowedRoles={['patient']}>
            <AppShell portal="patient" />
          </AuthGuard>
        }
      >
        <Route index element={<PatientDashboard />} />
        <Route path="doctors" element={<DoctorSearch />} />
        <Route path="doctors/:id" element={<DoctorDetail />} />
        <Route path="book/:doctorId" element={<BookAppointment />} />
        <Route path="appointments/:id/symptoms" element={<SymptomForm />} />
        <Route path="appointments" element={<AppointmentList />} />
        <Route path="appointments/:id" element={<AppointmentDetail />} />
        <Route path="medications" element={<Medications />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      {/* Doctor portal */}
      <Route
        path="/doctor"
        element={
          <AuthGuard allowedRoles={['doctor']}>
            <AppShell portal="doctor" />
          </AuthGuard>
        }
      >
        <Route index element={<DoctorSchedule />} />
        <Route path="appointments/:id" element={<DoctorAppointmentDetail />} />
        <Route path="appointments/:id/notes" element={<NotesEditor />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>

      {/* Admin portal */}
      <Route
        path="/admin"
        element={
          <AuthGuard allowedRoles={['admin']}>
            <AppShell portal="admin" />
          </AuthGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="doctors" element={<DoctorList />} />
        <Route path="doctors/:id" element={<DoctorEdit />} />
        <Route path="conflicts" element={<Conflicts />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
