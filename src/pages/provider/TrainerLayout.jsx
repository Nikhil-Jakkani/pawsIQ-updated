import React from 'react';
import ProviderLayout from '../../components/provider/ProviderLayout';

const navItems = [
  { to: '/provider/trainer/dashboard', label: 'Dashboard' },
  { to: '/provider/trainer/appointments', label: 'Appointments' },
  { to: '/provider/trainer/clients', label: 'Clients' },
  { to: '/provider/trainer/services', label: 'Services & Pricing' },
  { to: '/provider/trainer/training-plans', label: 'Training Plans' },
  { to: '/provider/trainer/progress', label: 'Progress Tracking' },
  { to: '/provider/trainer/analytics', label: 'Analytics' },
  { to: '/provider/trainer/reviews', label: 'Reviews' },
  { to: '/provider/trainer/notifications', label: 'Notifications' },
  { to: '/provider/trainer/settings', label: 'Settings' },
];

const TrainerLayout = ({ title = 'Trainer Dashboard', children }) => {
  return (
    <ProviderLayout 
      title={title} 
      providerType="trainer" 
      navItems={navItems}
    >
      {children}
    </ProviderLayout>
  );
};

export default TrainerLayout;