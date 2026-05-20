import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MockDataProvider } from './context/MockDataContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AdminLayout from './pages/admin/AdminLayout';
import Overview from './pages/admin/Overview';
import Approvals from './pages/admin/Approvals';
import Operations from './pages/admin/Operations';
import Schedule from './pages/admin/Schedule';
import Menu from './pages/admin/Menu';
import Plans from './pages/admin/Plans';
import Settings from './pages/admin/Settings';

function App() {
  return (
    <MockDataProvider>
      <BrowserRouter>
        <Routes>
          {/* Customer Facing Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Administrative Console Routes (Wrapped in AdminLayout) */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/overview" replace />}
          />
          <Route
            path="/admin/overview"
            element={
              <AdminLayout>
                <Overview />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/approvals"
            element={
              <AdminLayout>
                <Approvals />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/operations"
            element={
              <AdminLayout>
                <Operations />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/schedule"
            element={
              <AdminLayout>
                <Schedule />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <AdminLayout>
                <Menu />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <AdminLayout>
                <Plans />
              </AdminLayout>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminLayout>
                <Settings />
              </AdminLayout>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MockDataProvider>
  );
}

export default App;
