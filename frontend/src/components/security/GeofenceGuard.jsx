import React from 'react';
import { useGeofence } from '../../context/GeofenceContext';
import { useAuth } from '../../context/AuthContext';
import { GeofenceLockScreen } from './GeofenceLockScreen';

export const GeofenceGuard = ({ children }) => {
  const { geofenceConfig, isAccessAllowed } = useGeofence();
  const { user } = useAuth();

  // If geofencing is not enabled, or access is verified/bypassed, render normal content
  if (!geofenceConfig.enabled || isAccessAllowed) {
    return <>{children}</>;
  }

  // Otherwise, lock the screen with the Geofence Security Screen
  return (
    <>
      <GeofenceLockScreen />
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
    </>
  );
};
