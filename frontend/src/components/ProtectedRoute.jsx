import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading message="Verifying authentication & role permissions..." />;
  }

  // 1. Unauthenticated users: Can only access Login and Register -> redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role-based routing validation
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // STUDENT attempting /admin or /admin/books -> redirect to /student
    if (role === 'STUDENT') {
      return <Navigate to="/student" replace />;
    }
    // ADMIN attempting /student -> redirect to /admin
    else if (role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
