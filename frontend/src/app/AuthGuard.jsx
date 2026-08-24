import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Role-gated route wrapper. Redirects to /login if unauthenticated,
 * or to the user's own portal if wrong role.
 */
export default function AuthGuard({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.role?.replace('ROLE_', '')?.toLowerCase();

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect wrong-role users to their own home
    const homeMap = { patient: '/patient', doctor: '/doctor', admin: '/admin' };
    return <Navigate to={homeMap[userRole] || '/login'} replace />;
  }

  return children;
}
