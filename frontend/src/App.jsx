import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Books from './pages/Books';
import AdminBooks from './pages/AdminBooks';
import Borrowings from './pages/Borrowings';
import Fines from './pages/Fines';
import Profile from './pages/Profile';

// Styles
import './styles/global.css';

// Public Route Guard (prevents logged in users from seeing login/register)
const PublicAuthRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isStudent, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isStudent) return <Navigate to="/student" replace />;
  }
  return children;
};

// Root redirector based on authenticated role
const RootRedirector = () => {
  const { isAuthenticated, isAdmin, isStudent, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isStudent) return <Navigate to="/student" replace />;
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Unauthenticated-only Routes: Login & Register */}
          <Route path="/" element={<RootRedirector />} />
          <Route
            path="/login"
            element={
              <PublicAuthRoute>
                <Login />
              </PublicAuthRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicAuthRoute>
                <Register />
              </PublicAuthRoute>
            }
          />

          {/* Student Protected Route */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <AppLayout>
                  <StudentDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          {/* Alias /dashboard redirects to /student */}
          <Route path="/dashboard" element={<Navigate to="/student" replace />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/books"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AppLayout>
                  <AdminBooks />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Shared Authenticated Routes: Accessible to STUDENT and ADMIN */}
          <Route
            path="/books"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <AppLayout>
                  <Books />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/borrowings"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <AppLayout>
                  <Borrowings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fines"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <AppLayout>
                  <Fines />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 / Unknown Route */}
          <Route path="*" element={<RootRedirector />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
