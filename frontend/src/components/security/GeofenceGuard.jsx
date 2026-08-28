import React from 'react';
import { useGeofence } from '../../context/GeofenceContext';
import { useAuth } from '../../context/AuthContext';
import { GeofenceLockScreen } from './GeofenceLockScreen';

export const GeofenceGuard = ({ children }) => {
  const { geofenceConfig, isAccessAllowed } = useGeofence();
  const { user } = useAuth();

  // If geofence is disabled, or location is verified inside the perimeter, or session is bypassed
  if (geofenceConfig?.enabled === false || isAccessAllowed) {
    return <>{children}</>;
  }

  // Strictly block any access - Do NOT render any CRM views or data behind it
  return <GeofenceLockScreen />;
};
