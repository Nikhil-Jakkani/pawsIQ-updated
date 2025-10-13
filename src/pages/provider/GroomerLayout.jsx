import React from 'react';
import ProviderLayout from '../../components/provider/ProviderLayout';

const navItems = [
  { to: '/provider/groomer/dashboard', label: 'Dashboard' },
  { to: '/provider/groomer/appointments', label: 'Appointments' },
  { to: '/provider/groomer/clients', label: 'Clients' },
  { to: '/provider/groomer/services', label: 'Services & Pricing' },
  { to: '/provider/groomer/grooming-packages', label: 'Grooming Packages' },
  { to: '/provider/groomer/gallery', label: 'Gallery' },
  { to: '/provider/groomer/analytics', label: 'Analytics' },
  { to: '/provider/groomer/reviews', label: 'Reviews' },
  { to: '/provider/groomer/notifications', label: 'Notifications' },
  { to: '/provider/groomer/settings', label: 'Settings' },
];

const GroomerLayout = ({ title = 'Groomer Dashboard', children }) => {
  return (
    <ProviderLayout 
      title={title} 
      providerType="groomer" 
      navItems={navItems}
    >
      {children}
    </ProviderLayout>
  );
};

export default GroomerLayout;