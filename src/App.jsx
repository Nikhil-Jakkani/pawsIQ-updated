import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard.jsx';
import Home from './pages/Home.jsx';
import UserLogin from './pages/user/UserLogin.jsx';
import UserDashboard from './pages/user/UserDashboard.jsx';
import UserSignIn from './pages/user/UserSignIn.jsx';
import UserForgotPassword from './pages/user/UserForgotPassword.jsx';
import OTPVerification from './pages/auth/OTPVerification.jsx';
import UserResetPassword from './pages/user/UserResetPassword.jsx';
import UserPets from './pages/user/UserPets.jsx';
import UserHealthRecords from './pages/user/UserHealthRecords.jsx';
import UserPetProfile from './pages/user/UserPetProfile.jsx';
import UserAddPet from './pages/user/UserAddPet.jsx';
import UserEditPet from './pages/user/UserEditPet.jsx';
import UserAppointments from './pages/user/UserAppointments.jsx';
import UserBookAppointment from './pages/user/UserBookAppointment.jsx';
import UserAppointmentConfirmation from './pages/user/UserAppointmentConfirmation.jsx';
import UserRescheduleAppointment from './pages/user/UserRescheduleAppointment.jsx';
import UserAppointmentDetails from './pages/user/UserAppointmentDetails.jsx';
import AIPetCare from './pages/user/AIPetCare.jsx';

import UserMarketplace from './pages/user/UserMarketplace.jsx';
import UserOrders from './pages/user/UserOrders.jsx';
import UserPayments from './pages/user/UserPayments.jsx';
import UserSettings from './pages/user/UserSettings.jsx';
import UserAddPaymentMethod from './pages/user/UserAddPaymentMethod.jsx';
import UserNotifications from './pages/user/UserNotifications.jsx';
import UserHelp from './pages/user/UserHelp.jsx';
import UserCommunity from './pages/user/UserCommunity.jsx';
import Users from './pages/Users.jsx';
import UserProfiles from './pages/users/UserProfiles.jsx';
import UserRoles from './pages/users/UserRoles.jsx';
import UserActivity from './pages/users/UserActivity.jsx';
import Providers from './pages/Providers.jsx';
import ProviderOnboardingVeterinarian from './pages/providers/ProviderOnboardingVeterinarian.jsx';
import ProviderOnboardingGroomer from './pages/providers/ProviderOnboardingGroomer.jsx';
import ProviderOnboardingTrainer from './pages/providers/ProviderOnboardingTrainer.jsx';
import ProviderOnboardingBoarder from './pages/providers/ProviderOnboardingBoarder.jsx';
import ProviderOnboardingDiagnostic from './pages/providers/ProviderOnboardingDiagnostic.jsx';
import ProviderOnboardingPhysicalActivity from './pages/providers/ProviderOnboardingPhysicalActivity.jsx';
import ProviderVerification from './pages/providers/ProviderVerification.jsx';
import ProviderCommission from './pages/providers/ProviderCommission.jsx';
import ProviderPerformance from './pages/providers/ProviderPerformance.jsx';
import ProviderFlags from './pages/providers/ProviderFlags.jsx';
// Provider onboarding flow
import ProviderSignUp from './pages/provider/ProviderSignUp.jsx';
import ProfessionalInfo from './pages/provider/ProfessionalInfo.jsx';
import VeterinarianDetails from './pages/provider/VeterinarianDetails.jsx';
import TrainerDetails from './pages/provider/TrainerDetails.jsx';
import GroomerDetails from './pages/provider/GroomerDetails.jsx';
import PetSitterDetails from './pages/provider/PetSitterDetails.jsx';
import DocumentUpload from './pages/provider/DocumentUpload.jsx';
import TermsAgreement from './pages/provider/TermsAgreement.jsx';
import PaymentInfo from './pages/provider/PaymentInfo.jsx';
import ReviewSubmission from './pages/provider/ReviewSubmission.jsx';
import ApplicationStatus from './pages/provider/ApplicationStatus.jsx';
import ProviderLogin from './pages/provider/ProviderLogin.jsx';
import ProviderForgotPassword from './pages/provider/ProviderForgotPassword.jsx';
import ProviderOTPVerification from './pages/provider/ProviderOTPVerification.jsx';
import ProviderOnboarding from './pages/provider/ProviderOnboarding.jsx';
import ProviderDashboardRouter from './pages/provider/ProviderDashboardRouter.jsx';
import VetDashboard from './pages/provider/VetDashboard.jsx';
import TrainerDashboard from './pages/provider/TrainerDashboard.jsx';
import GroomerDashboard from './pages/provider/GroomerDashboard.jsx';
import PetSitterDashboard from './pages/provider/PetSitterDashboard.jsx';
import VetAppointments from './pages/provider/VetAppointments.jsx';
import VetClients from './pages/provider/VetClients.jsx';
import VetServices from './pages/provider/VetServices.jsx';
import VetPrescriptions from './pages/provider/VetPrescriptions.jsx';
import VetLabReports from './pages/provider/VetLabReports.jsx';
import VetAnalytics from './pages/provider/VetAnalytics.jsx';
import VetNotifications from './pages/provider/VetNotifications.jsx';
import VetSettings from './pages/provider/VetSettings.jsx';
import VetProfile from './pages/provider/VetProfile.jsx';
import VetPortfolio from './pages/provider/VetPortfolio.jsx';
import VetReviews from './pages/provider/VetReviews.jsx';
import ServiceForm from './pages/provider/ServiceForm.jsx';

// Auth pages
import Login from './pages/auth/Login.jsx';
import Appointments from './pages/Appointments.jsx';
import Marketplace from './pages/Marketplace.jsx';
import Transactions from './pages/Transactions.jsx';
import ContentModeration from './pages/ContentModeration.jsx';
import Analytics from './pages/Analytics.jsx';
import UserMetrics from './pages/analytics/UserMetrics.jsx';
import ServiceMetrics from './pages/analytics/ServiceMetrics.jsx';
import RevenueMetrics from './pages/analytics/RevenueMetrics.jsx';
import PerformanceDashboard from './pages/analytics/PerformanceDashboard.jsx';
import Notifications from './pages/Notifications.jsx';
import Settings from './pages/Settings.jsx';
import Security from './pages/Security.jsx';
import Support from './pages/Support.jsx';
import PetProfiles from './pages/pets/PetProfiles.jsx';
import PetModeration from './pages/pets/PetModeration.jsx';
import PetLostReports from './pages/pets/PetLostReports.jsx';
import BookingOverview from './pages/appointments/BookingOverview.jsx';
import AppointmentScheduler from './pages/appointments/AppointmentScheduler.jsx';
import DisputeResolution from './pages/appointments/DisputeResolution.jsx';
import PaymentManagement from './pages/transactions/PaymentManagement.jsx';
import FinancialReports from './pages/transactions/FinancialReports.jsx';
import ProductManagement from './pages/marketplace/ProductManagement.jsx';
import SellerManagement from './pages/marketplace/SellerManagement.jsx';
// Support pages
import TicketManagement from './pages/support/TicketManagement.jsx';
import LiveChat from './pages/support/LiveChat.jsx';
import KnowledgeBase from './pages/support/KnowledgeBase.jsx';
import SupportDisputeResolution from './pages/support/DisputeResolution.jsx';
import TicketAssignment from './pages/support/TicketAssignment.jsx';
import { useAuth } from './context/AuthContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdateNotification from './components/PWAUpdateNotification';
import OfflineStatus from './components/OfflineStatus';
import ProviderProtectedRoute from './components/common/ProviderProtectedRoute';

import './App.css'; 

// Protected route component for admin
const AdminProtectedRoute = ({ children }) => {
  const { currentUser, loading, tokens } = useAuth();
  if (loading) return null; // wait until auth check completes
  if (!currentUser || !tokens?.access?.token) {
    return <Navigate to="/" replace />;
  }
  if (currentUser.role !== 'admin') {
    // Redirect logged-in non-admins to their dashboards instead of login to avoid loops
    let fallback = '/';
    
    if (currentUser.role === 'user') {
      fallback = '/user/dashboard';
    } else if (currentUser.role === 'provider') {
      // Get provider type from user object first, fallback to localStorage
      let providerType = currentUser.providerType;
      
      if (!providerType) {
        const registration = localStorage.getItem('provider_registration');
        providerType = localStorage.getItem('selectedService');
        
        if (!providerType && registration) {
          try {
            const parsedData = JSON.parse(registration);
            providerType = parsedData.providerType;
          } catch (e) {
            console.error('Error parsing provider registration:', e);
          }
        }
      }
      
      // Map provider types to route-friendly names
      const typeMap = {
        'Veterinarian': 'vet',
        'Trainer': 'trainer',
        'Groomer': 'groomer',
        'Pet Sitter': 'petsitter',
        'vet': 'vet',
        'trainer': 'trainer',
        'groomer': 'groomer',
        'petsitter': 'petsitter'
      };
      
      const routeType = typeMap[providerType] || 'vet';
      fallback = `/provider/${routeType}/dashboard`;
    }
    
    return <Navigate to={fallback} replace />;
  }
  return children;
};

// Protected route component for users
const UserProtectedRoute = ({ children }) => {
  const { currentUser, loading, tokens } = useAuth();
  if (loading) return null; // wait until auth check completes
  if (!currentUser || !tokens?.access?.token) {
    return <Navigate to="/user/login" replace />;
  }
  return children;
};


// Landing route: if authenticated, redirect to appropriate dashboard; else show Home
const Landing = () => {
  const { currentUser, tokens, loading } = useAuth();
  if (loading) return null;
  if (currentUser && tokens?.access?.token) {
    let dest = '/user/dashboard';
    
    if (currentUser.role === 'admin') {
      dest = '/dashboard';
    } else if (currentUser.role === 'provider') {
      // Get provider type from localStorage or user data
      const registration = localStorage.getItem('provider_registration');
      let providerType = localStorage.getItem('selectedService');
      
      if (!providerType && registration) {
        try {
          const parsedData = JSON.parse(registration);
          providerType = parsedData.providerType;
        } catch (e) {
          console.error('Error parsing provider registration:', e);
        }
      }
      
      // Map provider types to route-friendly names
      const typeMap = {
        'Veterinarian': 'vet',
        'Trainer': 'trainer',
        'Groomer': 'groomer',
        'Pet Sitter': 'petsitter',
        'vet': 'vet',
        'trainer': 'trainer',
        'groomer': 'groomer',
        'petsitter': 'petsitter'
      };
      
      const routeType = typeMap[providerType] || 'vet';
      dest = `/provider/${routeType}/dashboard`;
    }
    
    return <Navigate to={dest} replace />;
  }
  return <Home />;
};


function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="app-container w-full h-full">
        <PWAInstallPrompt />
        <PWAUpdateNotification />
        <OfflineStatus />
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            

            {/* Admin Routes */}
            <Route path="/dashboard" element={<AdminProtectedRoute><Dashboard /></AdminProtectedRoute>} />
            <Route path="/users" element={<AdminProtectedRoute><Users /></AdminProtectedRoute>} />
            <Route path="/users/profiles" element={<AdminProtectedRoute><UserProfiles /></AdminProtectedRoute>} />
            <Route path="/users/roles" element={<AdminProtectedRoute><UserRoles /></AdminProtectedRoute>} />
            <Route path="/users/activity" element={<AdminProtectedRoute><UserActivity /></AdminProtectedRoute>} />
            <Route path="/providers" element={<AdminProtectedRoute><Providers /></AdminProtectedRoute>} />
            <Route path="/providers/onboarding/veterinarian" element={<AdminProtectedRoute><ProviderOnboardingVeterinarian /></AdminProtectedRoute>} />
            <Route path="/providers/onboarding/groomer" element={<AdminProtectedRoute><ProviderOnboardingGroomer /></AdminProtectedRoute>} />
            <Route path="/providers/onboarding/trainer" element={<AdminProtectedRoute><ProviderOnboardingTrainer /></AdminProtectedRoute>} />
            <Route path="/providers/onboarding/boarder" element={<AdminProtectedRoute><ProviderOnboardingBoarder /></AdminProtectedRoute>} />
            <Route path="/providers/onboarding/diagnostic" element={<AdminProtectedRoute><ProviderOnboardingDiagnostic /></AdminProtectedRoute>} />
            <Route path="/providers/onboarding/physical-activity" element={<AdminProtectedRoute><ProviderOnboardingPhysicalActivity /></AdminProtectedRoute>} />
            <Route path="/providers/verification" element={<AdminProtectedRoute><ProviderVerification /></AdminProtectedRoute>} />
            <Route path="/providers/commission" element={<AdminProtectedRoute><ProviderCommission /></AdminProtectedRoute>} />
            <Route path="/providers/performance" element={<AdminProtectedRoute><ProviderPerformance /></AdminProtectedRoute>} />
            <Route path="/providers/flags" element={<AdminProtectedRoute><ProviderFlags /></AdminProtectedRoute>} />
            <Route path="/pets" element={<AdminProtectedRoute><Dashboard /></AdminProtectedRoute>} />
            <Route path="/pets/profiles" element={<AdminProtectedRoute><PetProfiles /></AdminProtectedRoute>} />
            <Route path="/pets/moderation" element={<AdminProtectedRoute><PetModeration /></AdminProtectedRoute>} />
            <Route path="/pets/lost" element={<AdminProtectedRoute><PetLostReports /></AdminProtectedRoute>} />
            <Route path="/appointments" element={<AdminProtectedRoute><Appointments /></AdminProtectedRoute>} />
            <Route path="/appointments/overview" element={<AdminProtectedRoute><BookingOverview /></AdminProtectedRoute>} />
            <Route path="/appointments/scheduler" element={<AdminProtectedRoute><AppointmentScheduler /></AdminProtectedRoute>} />
            <Route path="/appointments/disputes" element={<AdminProtectedRoute><DisputeResolution /></AdminProtectedRoute>} />
            <Route path="/marketplace" element={<AdminProtectedRoute><Marketplace /></AdminProtectedRoute>} />
            <Route path="/marketplace/products" element={<AdminProtectedRoute><ProductManagement /></AdminProtectedRoute>} />
            <Route path="/marketplace/sellers" element={<AdminProtectedRoute><SellerManagement /></AdminProtectedRoute>} />
            <Route path="/transactions" element={<AdminProtectedRoute><Transactions /></AdminProtectedRoute>} />
            <Route path="/transactions/payments" element={<AdminProtectedRoute><PaymentManagement /></AdminProtectedRoute>} />
            <Route path="/transactions/reports" element={<AdminProtectedRoute><FinancialReports /></AdminProtectedRoute>} />
            <Route path="/content" element={<AdminProtectedRoute><ContentModeration /></AdminProtectedRoute>} />
            <Route path="/analytics" element={<AdminProtectedRoute><Analytics /></AdminProtectedRoute>} />
            <Route path="/analytics/users" element={<AdminProtectedRoute><UserMetrics /></AdminProtectedRoute>} />
            <Route path="/analytics/services" element={<AdminProtectedRoute><ServiceMetrics /></AdminProtectedRoute>} />
            <Route path="/analytics/revenue" element={<AdminProtectedRoute><RevenueMetrics /></AdminProtectedRoute>} />
            <Route path="/analytics/performance" element={<AdminProtectedRoute><PerformanceDashboard /></AdminProtectedRoute>} />
            <Route path="/notifications" element={<AdminProtectedRoute><Notifications /></AdminProtectedRoute>} />
            <Route path="/settings" element={<AdminProtectedRoute><Settings /></AdminProtectedRoute>} />
            <Route path="/security" element={<AdminProtectedRoute><Security /></AdminProtectedRoute>} />
            <Route path="/support" element={<AdminProtectedRoute><Support /></AdminProtectedRoute>} />
            <Route path="/support/tickets" element={<AdminProtectedRoute><TicketManagement /></AdminProtectedRoute>} />
            <Route path="/support/chat" element={<AdminProtectedRoute><LiveChat /></AdminProtectedRoute>} />
            <Route path="/support/knowledge" element={<AdminProtectedRoute><KnowledgeBase /></AdminProtectedRoute>} />
            <Route path="/support/disputes" element={<AdminProtectedRoute><SupportDisputeResolution /></AdminProtectedRoute>} />
            <Route path="/support/assignment" element={<AdminProtectedRoute><TicketAssignment /></AdminProtectedRoute>} />

            {/* User Routes */}
            {/* Top-level aliases for SEO/direct links */}
            <Route path="/signup" element={<UserSignIn />} />
            <Route path="/register" element={<UserSignIn />} />
            <Route path="/user/forgot-password" element={<UserForgotPassword />} />
            <Route path="/otp-verification" element={<OTPVerification />} />
            <Route path="/reset-password" element={<UserResetPassword />} />

            {/* Scoped user routes */}
            <Route path="/user/signin" element={<UserSignIn />} />
            <Route path="/user/signup" element={<UserSignIn />} />
            <Route path="/user/forgot-password" element={<React.Suspense fallback={null}><UserForgotPassword /></React.Suspense>} />
            <Route path="/user/reset-password" element={<React.Suspense fallback={null}><UserResetPassword /></React.Suspense>} />
            <Route
              path="/user/login"
              element={
                <UserLogin />
              }
            />
            <Route path="/user/dashboard" element={<UserProtectedRoute><UserDashboard /></UserProtectedRoute>} />
            
            {/* Provider Routes */}
            <Route path="/provider/login" element={<ProviderLogin />} />
            <Route path="/provider/forgot-password" element={<ProviderForgotPassword />} />
            <Route path="/provider/otp-verification" element={<ProviderOTPVerification />} />
            {/* Provider Dashboard Routes - Dynamic routing based on service type */}
            <Route path="/provider/:serviceType/dashboard" element={<ProviderProtectedRoute><ProviderDashboardRouter /></ProviderProtectedRoute>} />
            <Route path="/provider/:serviceType/appointments" element={<ProviderProtectedRoute><VetAppointments /></ProviderProtectedRoute>} />
            <Route path="/provider/:serviceType/clients" element={<ProviderProtectedRoute><VetClients /></ProviderProtectedRoute>} />
            <Route path="/provider/vet/services" element={<ProviderProtectedRoute><VetServices /></ProviderProtectedRoute>} />
            <Route path="/provider/vet/services/new" element={<ProviderProtectedRoute><ServiceForm /></ProviderProtectedRoute>} />
            <Route path="/provider/vet/services/:id/edit" element={<ProviderProtectedRoute><ServiceForm /></ProviderProtectedRoute>} />
            <Route path="/provider/vet/prescriptions" element={<ProviderProtectedRoute><VetPrescriptions /></ProviderProtectedRoute>} />
            <Route path="/provider/vet/labs" element={<ProviderProtectedRoute><VetLabReports /></ProviderProtectedRoute>} />
            <Route path="/provider/vet/analytics" element={<ProviderProtectedRoute><VetAnalytics /></ProviderProtectedRoute>} />
            <Route path="/provider/vet/reviews" element={<ProviderProtectedRoute><VetReviews /></ProviderProtectedRoute>} />
            <Route path="/provider/:serviceType/reviews" element={<ProviderProtectedRoute><VetReviews /></ProviderProtectedRoute>} />
            <Route path="/provider/vet/profile" element={<ProviderProtectedRoute><VetProfile /></ProviderProtectedRoute>} />
            <Route path="/provider/vet/portfolio" element={<ProviderProtectedRoute><VetPortfolio /></ProviderProtectedRoute>} />
            <Route path="/provider/vet/notifications" element={<ProviderProtectedRoute><VetNotifications /></ProviderProtectedRoute>} />
            <Route path="/provider/vet/settings" element={<ProviderProtectedRoute><VetSettings /></ProviderProtectedRoute>} />

            {/* Pet Management Routes */}
            <Route path="/user/pets" element={<UserProtectedRoute><UserPets /></UserProtectedRoute>} />
            <Route path="/user/pets/add" element={<UserProtectedRoute><UserAddPet /></UserProtectedRoute>} />
            <Route path="/user/pets/edit/:petId" element={<UserProtectedRoute><UserEditPet /></UserProtectedRoute>} />
            <Route path="/user/pets/profiles" element={<UserProtectedRoute><UserPets /></UserProtectedRoute>} />
            <Route path="/user/pets/health" element={<UserProtectedRoute><UserPets /></UserProtectedRoute>} />
            <Route path="/user/pets/:petId/health-records" element={<UserProtectedRoute><UserHealthRecords /></UserProtectedRoute>} />
            <Route path="/user/pets/:petId" element={<UserProtectedRoute><UserPetProfile /></UserProtectedRoute>} />
            
            {/* AI Pet Care */}
            <Route path="/user/ai-pet-care" element={<UserProtectedRoute><AIPetCare /></UserProtectedRoute>} />
            
            {/* Appointment Routes */}
            <Route path="/user/appointments" element={<UserProtectedRoute><UserAppointments /></UserProtectedRoute>} />
            <Route path="/user/appointments/new" element={<UserProtectedRoute><UserBookAppointment /></UserProtectedRoute>} />
            <Route path="/user/appointments/upcoming" element={<UserProtectedRoute><UserAppointments /></UserProtectedRoute>} />
            <Route path="/user/appointments/history" element={<UserProtectedRoute><UserAppointments /></UserProtectedRoute>} />
            <Route path="/user/appointments/reschedule/:id" element={<UserProtectedRoute><UserRescheduleAppointment /></UserProtectedRoute>} />
            
            
            <Route path="/user/appointments/:id" element={<UserProtectedRoute><UserAppointmentDetails /></UserProtectedRoute>} />
            <Route path="/user/appointments/confirmation" element={<UserProtectedRoute><UserAppointmentConfirmation /></UserProtectedRoute>} />
            
            {/* Marketplace Routes */}
            <Route path="/user/marketplace" element={<UserProtectedRoute><UserMarketplace /></UserProtectedRoute>} />
            <Route path="/user/marketplace/food" element={<UserProtectedRoute><UserMarketplace /></UserProtectedRoute>} />
            <Route path="/user/marketplace/toys" element={<UserProtectedRoute><UserMarketplace /></UserProtectedRoute>} />
            <Route path="/user/marketplace/health" element={<UserProtectedRoute><UserMarketplace /></UserProtectedRoute>} />
            
            {/* Order Routes */}
            <Route path="/user/orders" element={<UserProtectedRoute><UserOrders /></UserProtectedRoute>} />
            
            {/* Payment Routes */}
            <Route path="/user/payments" element={<UserProtectedRoute><UserPayments /></UserProtectedRoute>} />
            <Route path="/user/payments/methods" element={<UserProtectedRoute><UserPayments /></UserProtectedRoute>} />
            <Route path="/user/payments/history" element={<UserProtectedRoute><UserPayments /></UserProtectedRoute>} />
            
            {/* Community Routes */}
            <Route path="/user/community" element={<UserProtectedRoute><UserCommunity /></UserProtectedRoute>} />
            <Route path="/user/community/forum" element={<UserProtectedRoute><UserCommunity /></UserProtectedRoute>} />
            <Route path="/user/community/events" element={<UserProtectedRoute><UserCommunity /></UserProtectedRoute>} />
            
            {/* Notification Routes */}
            <Route path="/user/notifications" element={<UserProtectedRoute><UserNotifications /></UserProtectedRoute>} />
            
            {/* Settings Routes */}
            <Route path="/user/settings" element={<UserProtectedRoute><UserSettings /></UserProtectedRoute>} />
            <Route path="/user/settings/profile" element={<UserProtectedRoute><UserSettings /></UserProtectedRoute>} />
            <Route path="/user/settings/notifications" element={<UserProtectedRoute><UserSettings /></UserProtectedRoute>} />
            <Route path="/user/settings/security" element={<UserProtectedRoute><UserSettings /></UserProtectedRoute>} />
            <Route path="/user/settings/payment/add" element={<UserProtectedRoute><UserAddPaymentMethod /></UserProtectedRoute>} />
            
            {/* Help & Support Routes */}
            <Route path="/user/help" element={<UserProtectedRoute><UserHelp /></UserProtectedRoute>} />
            <Route path="/user/help/faq" element={<UserProtectedRoute><UserHelp /></UserProtectedRoute>} />
            <Route path="/user/help/contact" element={<UserProtectedRoute><UserHelp /></UserProtectedRoute>} />
            <Route path="/user/help/support" element={<UserProtectedRoute><UserHelp /></UserProtectedRoute>} />

            {/* Provider Routes */}
            <Route path="/provider/login" element={<ProviderLogin />} />
            {/* Provider Onboarding Flow */}
            <Route path="/provider/signup" element={<ProviderSignUp />} />
            <Route path="/provider/onboarding/professional-info" element={<ProfessionalInfo />} />
            <Route path="/provider/onboarding/veterinarian-details" element={<VeterinarianDetails />} />
            <Route path="/provider/onboarding/trainer-details" element={<TrainerDetails />} />
            <Route path="/provider/onboarding/groomer-details" element={<GroomerDetails />} />
            <Route path="/provider/onboarding/pet-sitter-details" element={<PetSitterDetails />} />
            <Route path="/provider/onboarding/document-upload" element={<DocumentUpload />} />
            <Route path="/provider/onboarding/terms" element={<TermsAgreement />} />
            <Route path="/provider/onboarding/payment-info" element={<PaymentInfo />} />
            <Route path="/provider/onboarding/review" element={<ReviewSubmission />} />
            <Route path="/provider/application-status" element={<ApplicationStatus />} />

            {/* Provider Onboarding */}
            <Route path="/provider/onboarding" element={<ProviderOnboarding />} />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-indigo-100">
                  <div className="bg-white p-8 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-indigo-700 mb-4">
                      Page Not Found
                    </h1>
                    <p className="text-gray-600">
                      The page you're looking for doesn't exist.
                    </p>
                    <a href="/" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded">
                      Go Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
      </div>
    </>
  );
}

export default App;
