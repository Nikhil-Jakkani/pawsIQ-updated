import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';

const ProviderProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!currentUser || currentUser.role !== 'provider') {
    return <Navigate to="/provider/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProviderProtectedRoute;
