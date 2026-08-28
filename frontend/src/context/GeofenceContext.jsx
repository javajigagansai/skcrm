import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseClient';
import { useAuth } from './AuthContext';

// Earth's radius in meters for Haversine distance calculation
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return Infinity;
  const R = 6371e3; // meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const DEFAULT_GEOFENCE_CONFIG = {
  enabled: false,
  officeName: 'SK Smart Investments Head Office',
  latitude: 12.8342, // Default Office Lat (e.g. Kanchipuram / Chennai HQ)
  longitude: 79.7036, // Default Office Lon
  radiusMeters: 50, // 50 meters tight office room / building perimeter
  allowAdminBypass: true,
  customBypassCode: 'SK@GEO2026'
};

const GeofenceContext = createContext(null);

export const GeofenceProvider = ({ children }) => {
  const { user } = useAuth();

  const [geofenceConfig, setGeofenceConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_v2_geofence_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_GEOFENCE_CONFIG;
  });

  const [userLocation, setUserLocation] = useState(null);
  const [distanceFromOffice, setDistanceFromOffice] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('IDLE'); // 'IDLE' | 'CHECKING' | 'GRANTED' | 'DENIED' | 'OUTSIDE_FENCE' | 'ERROR' | 'BYPASSED'
  const [gpsError, setGpsError] = useState('');
  const [isBypassed, setIsBypassed] = useState(() => {
    return sessionStorage.getItem('crm_geofence_bypassed') === 'true';
  });

  // Listen to live updates from Firestore settings/geofence_security
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'geofence_security'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const merged = { ...DEFAULT_GEOFENCE_CONFIG, ...data };
        setGeofenceConfig(merged);
        try {
          localStorage.setItem('crm_v2_geofence_config', JSON.stringify(merged));
        } catch (e) {}
      }
    }, (err) => {
      console.warn("Geofence config sync warning:", err.message);
    });

    return () => unsub();
  }, []);

  // Verification function with High Accuracy GPS
  const verifyLocation = useCallback((force = false) => {
    if (!geofenceConfig.enabled && !force) {
      setGpsStatus('GRANTED');
      return;
    }

    if (isBypassed) {
      setGpsStatus('BYPASSED');
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('ERROR');
      setGpsError('Geolocation is not supported by your browser or device.');
      return;
    }

    setGpsStatus('CHECKING');
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        const locObj = {
          latitude: userLat,
          longitude: userLon,
          accuracy: Math.round(accuracy),
          timestamp: position.timestamp
        };
        setUserLocation(locObj);

        if (geofenceConfig.enabled) {
          const targetLat = Number(geofenceConfig.latitude);
          const targetLon = Number(geofenceConfig.longitude);
          const allowedRadius = Number(geofenceConfig.radiusMeters) || 50;

          const distance = calculateDistanceMeters(userLat, userLon, targetLat, targetLon);
          setDistanceFromOffice(distance);

          if (distance <= allowedRadius) {
            setGpsStatus('GRANTED');
          } else {
            setGpsStatus('OUTSIDE_FENCE');
          }
        } else {
          setGpsStatus('GRANTED');
        }
      },
      (error) => {
        let msg = 'Failed to obtain GPS location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser to verify that you are within the authorized office location.';
          setGpsStatus('DENIED');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'GPS location information is currently unavailable on this device/network.';
          setGpsStatus('ERROR');
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please click retry to verify again.';
          setGpsStatus('ERROR');
        } else {
          setGpsStatus('ERROR');
        }
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, [geofenceConfig, isBypassed]);

  // Continuous live GPS tracking & Auto-verification
  useEffect(() => {
    if (!geofenceConfig.enabled || isBypassed) {
      setGpsStatus('GRANTED');
      return;
    }

    // Initial check
    verifyLocation();

    // Continuous watchPosition for live movement tracking
    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          const locObj = {
            latitude: userLat,
            longitude: userLon,
            accuracy: Math.round(accuracy),
            timestamp: position.timestamp
          };
          setUserLocation(locObj);

          const targetLat = Number(geofenceConfig.latitude);
          const targetLon = Number(geofenceConfig.longitude);
          const allowedRadius = Number(geofenceConfig.radiusMeters) || 50;

          const distance = calculateDistanceMeters(userLat, userLon, targetLat, targetLon);
          setDistanceFromOffice(distance);

          if (distance <= allowedRadius) {
            setGpsStatus('GRANTED');
          } else {
            setGpsStatus('OUTSIDE_FENCE');
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setGpsStatus('DENIED');
            setGpsError('Location permission denied. You must enable GPS to access the CRM.');
          }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }

    // Periodic check every 30 seconds
    const interval = setInterval(() => {
      verifyLocation();
    }, 30000);

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(interval);
    };
  }, [geofenceConfig.enabled, geofenceConfig.latitude, geofenceConfig.longitude, geofenceConfig.radiusMeters, isBypassed, verifyLocation]);

  // Update config in Firestore & local state
  const updateGeofenceConfig = async (newConfig) => {
    const updated = { ...geofenceConfig, ...newConfig };
    setGeofenceConfig(updated);
    try {
      localStorage.setItem('crm_v2_geofence_config', JSON.stringify(updated));
      await setDoc(doc(db, 'settings', 'geofence_security'), updated, { merge: true });
    } catch (e) {
      console.warn("Save geofence settings warning:", e.message);
    }
    return updated;
  };

  // Bypass passcode handler
  const bypassGeofence = (passcode) => {
    const code = (passcode || '').trim();
    const validCode = (geofenceConfig.customBypassCode || 'SK@GEO2026').trim();

    if (code === validCode || (user?.role === 'SUPER_ADMIN' && code === 'SUPERADMIN@2026')) {
      setIsBypassed(true);
      setGpsStatus('BYPASSED');
      sessionStorage.setItem('crm_geofence_bypassed', 'true');
      return { success: true };
    }
    return { success: false, message: 'Invalid Emergency Passcode. Access denied.' };
  };

  const isAccessAllowed = !geofenceConfig.enabled || isBypassed || gpsStatus === 'GRANTED';

  return (
    <GeofenceContext.Provider
      value={{
        geofenceConfig,
        userLocation,
        distanceFromOffice,
        gpsStatus,
        gpsError,
        isBypassed,
        isAccessAllowed,
        verifyLocation,
        updateGeofenceConfig,
        bypassGeofence
      }}
    >
      {children}
    </GeofenceContext.Provider>
  );
};

export const useGeofence = () => {
  const context = useContext(GeofenceContext);
  if (!context) {
    throw new Error('useGeofence must be used within a GeofenceProvider');
  }
  return context;
};
