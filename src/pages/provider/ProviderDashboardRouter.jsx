import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import VetDashboard from './VetDashboard';
import TrainerDashboard from './TrainerDashboard';
import GroomerDashboard from './GroomerDashboard';
import PetSitterDashboard from './PetSitterDashboard';

/**
 * Router component that renders the appropriate dashboard based on service type
 */
const ProviderDashboardRouter = () => {
  const { serviceType } = useParams();

  // Map service types to their respective dashboard components
  const dashboardMap = {
    vet: VetDashboard,
    trainer: TrainerDashboard,
    groomer: GroomerDashboard,
    petsitter: PetSitterDashboard,
  };

  const DashboardComponent = dashboardMap[serviceType];

  // If service type is not recognized, redirect to vet dashboard as fallback
  if (!DashboardComponent) {
    console.warn(`Unknown service type: ${serviceType}, redirecting to vet dashboard`);
    return <Navigate to="/provider/vet/dashboard" replace />;
  }

  return <DashboardComponent />;
};

export default ProviderDashboardRouter;