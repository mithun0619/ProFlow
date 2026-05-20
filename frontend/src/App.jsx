import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Toast from './components/Toast';

// Pages Import
import Login from './pages/Login';
import Register from './pages/Register';
import AcceptInvite from './pages/AcceptInvite';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import Profile from './pages/Profile';
import Team from './pages/Team';
import Tasks from './pages/Tasks';
import MyTasks from './pages/MyTasks';
import Notifications from './pages/Notifications';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toast />
        <Routes>
          {/* PUBLIC PATHS */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />

          {/* SECURE DASHBOARD PATHS */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Nested Sub-routes inside DashboardLayout */}
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="team" element={<Team />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="my-tasks" element={<MyTasks />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* CATCH-ALL REDIRECT */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
