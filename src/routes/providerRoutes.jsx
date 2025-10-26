import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProviderProtectedRoute from '../components/common/ProviderProtectedRoute';

// Provider Auth Pages
import ProviderSignUp from '../pages/provider/ProviderSignUp';
import ProviderLogin from '../pages/provider/ProviderLogin';
import ProviderForgotPassword from '../pages/provider/ProviderForgotPassword';
import ProviderOTPVerification from '../pages/provider/ProviderOTPVerification';

// Provider Onboarding Flow
import ProviderOnboardingFlow from '../pages/provider/ProviderOnboardingFlow';

// Provider Dashboard & Main Pages
import ProviderDashboard from '../pages/provider/ProviderDashboard';
import ProviderAppointments from '../pages/provider/ProviderAppointments';
import ProviderClients from '../pages/provider/ProviderClients';
import ProviderServices from '../pages/provider/ProviderServices';
import ProviderAnalytics from '../pages/provider/ProviderAnalytics';
import ProviderPrescriptions from '../pages/provider/ProviderPrescriptions';
import ProviderLabReports from '../pages/provider/ProviderLabReports';
import ProviderNotifications from '../pages/provider/ProviderNotifications';
import ProviderSettings from '../pages/provider/ProviderSettings';

// Vet Specific Pages
import VetDashboard from '../pages/provider/VetDashboard';
import VetAppointments from '../pages/provider/VetAppointments';
import VetClients from '../pages/provider/VetClients';
import VetServices from '../pages/provider/VetServices';
import VetPrescriptions from '../pages/provider/VetPrescriptions';
import VetLabReports from '../pages/provider/VetLabReports';
import VetAnalytics from '../pages/provider/VetAnalytics';
import VetNotifications from '../pages/provider/VetNotifications';
import VetSettings from '../pages/provider/VetSettings';

/**
 * Provider Routes Configuration
 * Organizes all provider-related routes with proper protection
 */
const ProviderRoutes = () => {
  return (
    <Routes>
      {/* Provider Auth Routes (Public) */}
      <Route path="/signup" element={<ProviderSignUp />} />
      <Route path="/login" element={<ProviderLogin />} />
      <Route path="/forgot-password" element={<ProviderForgotPassword />} />
      <Route path="/otp-verification" element={<ProviderOTPVerification />} />

      {/* Provider Onboarding Flow (Protected) */}
      <Route
        path="/onboarding"
        element={
          <ProviderProtectedRoute>
            <ProviderOnboardingFlow />
          </ProviderProtectedRoute>
        }
      />

      {/* Provider Dashboard Routes (Protected) */}
      <Route
        path="/dashboard"
        element={
          <ProviderProtectedRoute>
            <ProviderDashboard />
          </ProviderProtectedRoute>
        }
      />

      {/* Provider Core Pages (Protected) */}
      <Route
        path="/appointments"
        element={
          <ProviderProtectedRoute>
            <ProviderAppointments />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProviderProtectedRoute>
            <ProviderClients />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProviderProtectedRoute>
            <ProviderServices />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProviderProtectedRoute>
            <ProviderAnalytics />
          </ProviderProtectedRoute>
        }
      />

      {/* Veterinarian Specific Routes (Protected) */}
      <Route
        path="/prescriptions"
        element={
          <ProviderProtectedRoute>
            <ProviderPrescriptions />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/lab-reports"
        element={
          <ProviderProtectedRoute>
            <ProviderLabReports />
          </ProviderProtectedRoute>
        }
      />

      {/* Notifications & Settings (Protected) */}
      <Route
        path="/notifications"
        element={
          <ProviderProtectedRoute>
            <ProviderNotifications />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProviderProtectedRoute>
            <ProviderSettings />
          </ProviderProtectedRoute>
        }
      />

      {/* Vet Specific Routes (Alternative dashboard for vets) */}
      <Route
        path="/vet/dashboard"
        element={
          <ProviderProtectedRoute>
            <VetDashboard />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/vet/appointments"
        element={
          <ProviderProtectedRoute>
            <VetAppointments />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/vet/clients"
        element={
          <ProviderProtectedRoute>
            <VetClients />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/vet/services"
        element={
          <ProviderProtectedRoute>
            <VetServices />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/vet/prescriptions"
        element={
          <ProviderProtectedRoute>
            <VetPrescriptions />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/vet/lab-reports"
        element={
          <ProviderProtectedRoute>
            <VetLabReports />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/vet/analytics"
        element={
          <ProviderProtectedRoute>
            <VetAnalytics />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/vet/notifications"
        element={
          <ProviderProtectedRoute>
            <VetNotifications />
          </ProviderProtectedRoute>
        }
      />
      <Route
        path="/vet/settings"
        element={
          <ProviderProtectedRoute>
            <VetSettings />
          </ProviderProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/provider/dashboard" replace />} />
    </Routes>
  );
};

export default ProviderRoutes;