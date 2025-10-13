import React from 'react';
import ProviderLayout from '../../components/provider/ProviderLayout';

const navItems = [
  { to: '/provider/petsitter/dashboard', label: 'Dashboard' },
  { to: '/provider/petsitter/bookings', label: 'Bookings' },
  { to: '/provider/petsitter/clients', label: 'Clients' },
  { to: '/provider/petsitter/services', label: 'Services & Pricing' },
  { to: '/provider/petsitter/availability', label: 'Availability' },
  { to: '/provider/petsitter/pet-profiles', label: 'Pet Profiles' },
  { to: '/provider/petsitter/analytics', label: 'Analytics' },
  { to: '/provider/petsitter/reviews', label: 'Reviews' },
  { to: '/provider/petsitter/notifications', label: 'Notifications' },
  { to: '/provider/petsitter/settings', label: 'Settings' },
];

const PetSitterLayout = ({ title = 'Pet Sitter Dashboard', children }) => {
  return (
    <ProviderLayout 
      title={title} 
      providerType="petsitter" 
      navItems={navItems}
    >
      {children}
    </ProviderLayout>
  );
};

export default PetSitterLayout;