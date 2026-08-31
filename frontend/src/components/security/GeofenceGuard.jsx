import React from 'react';
import { useGeofence } from '../../context/GeofenceContext';
import { useAuth } from '../../context/AuthContext';
import { GeofenceLockScreen } from './GeofenceLockScreen';

export const GeofenceGuard = ({ children }) => {
  const { isAccessAllowed, gpsStatus } = useGeofence();
  const { user } = useAuth();

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Admins have unrestricted remote access from anywhere
  if (isAdmin) {
    return <>{children}</>;
  }

  // Staff, Managers, Employees: Must be verified inside office perimeter or have single-use OTP
  if (isAccessAllowed) {
    return <>{children}</>;
  }

  // Strictly block any access - Do NOT render any CRM views or data behind it
  return <GeofenceLockScreen />;
};
