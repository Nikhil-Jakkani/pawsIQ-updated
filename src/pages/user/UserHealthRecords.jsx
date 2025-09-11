import React from 'react';
import UserLayout from '../../components/layout/UserLayout';
import HealthRecords from '../../components/health/HealthRecords';

const UserHealthRecords = () => {
  return (
    <UserLayout>
      <div className="space-y-6">
        <HealthRecords />
      </div>
    </UserLayout>
  );
};

export default UserHealthRecords;
