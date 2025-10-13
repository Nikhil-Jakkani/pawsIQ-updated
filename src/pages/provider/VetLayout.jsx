import React from 'react';
import ProviderLayout from '../../components/provider/ProviderLayout';

const navItems = [
  { to: '/provider/vet/dashboard', label: 'Dashboard' },
  { to: '/provider/vet/appointments', label: 'Appointments' },
  { to: '/provider/vet/clients', label: 'Clients' },
  { to: '/provider/vet/services', label: 'Services & Pricing' },
  { to: '/provider/vet/prescriptions', label: 'Prescriptions' },
  { to: '/provider/vet/labs', label: 'Lab Reports' },
  { to: '/provider/vet/analytics', label: 'Analytics' },
  { to: '/provider/vet/reviews', label: 'Reviews' },
  { to: '/provider/vet/notifications', label: 'Notifications' },
  { to: '/provider/vet/settings', label: 'Settings' },
];

const VetLayout = ({ title = 'Veterinarian Dashboard', children }) => {
  return (
    <ProviderLayout 
      title={title} 
      providerType="vet" 
      navItems={navItems}
    >
      {children}
    </ProviderLayout>
  );
};

export default VetLayout;