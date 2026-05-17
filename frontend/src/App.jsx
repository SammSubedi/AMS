import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AssignmentDetailPage from './pages/AssignmentDetailPage';
import CreateAssignmentPage from './pages/CreateAssignmentPage';
import EditAssignmentPage from './pages/EditAssignmentPage';
import SubmissionsPage from './pages/SubmissionsPage';
import MySubmissionsPage from './pages/MySubmissionsPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

// Route guard
const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      }
    />

    {/* Protected */}
    <Route
      path="/"
      element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }
    >
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="assignments" element={<AssignmentsPage />} />
      <Route path="assignments/:id" element={<AssignmentDetailPage />} />
      <Route
        path="assignments/new"
        element={
          <PrivateRoute role="teacher">
            <CreateAssignmentPage />
          </PrivateRoute>
        }
      />
      <Route
        path="assignments/:id/edit"
        element={
          <PrivateRoute role="teacher">
            <EditAssignmentPage />
          </PrivateRoute>
        }
      />
      <Route
        path="assignments/:id/submissions"
        element={
          <PrivateRoute role="teacher">
            <SubmissionsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="my-submissions"
        element={
          <PrivateRoute role="student">
            <MySubmissionsPage />
          </PrivateRoute>
        }
      />
      <Route path="profile" element={<ProfilePage />} />
    </Route>

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
