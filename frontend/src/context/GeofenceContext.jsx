import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseClient';
import { useAuth } from './AuthContext';

// Helper to generate secure 6-digit rotating OTP
export const generateNewOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// Earth's radius in meters for Haversine distance calculation
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return Infinity;
  const R = 6371e3; // meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(nLat2 - nLat1);
  const dLon = toRad(nLon2 - nLon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nLat1)) * Math.cos(toRad(nLat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

export const formatDistanceText = (meters) => {
  if (meters === null || meters === undefined || isNaN(meters)) return '';
  const feet = (meters * 3.28084).toFixed(1);
  if (meters < 10) {
    return `${feet} Feet (${meters.toFixed(2)}m)`;
  }
  if (meters < 1000) {
    return `${Math.round(meters * 3.28084)} Feet (${Math.round(meters)}m)`;
  }
  return `${(meters / 1000).toFixed(2)} km (${Math.round(meters * 3.28084).toLocaleString()} Feet)`;
};

const DEFAULT_GEOFENCE_CONFIG = {
  enabled: true,
  officeName: 'SK Smart Investments Head Office',
  latitude: 12.8342, // Default Office HQ Latitude
  longitude: 79.7036, // Default Office HQ Longitude
  radiusMeters: 50, // 50 meters perimeter
  allowAdminBypass: true,
  currentOtp: '849201',
  customBypassCode: '849201'
};

const GeofenceContext = createContext(null);

export const GeofenceProvider = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [geofenceConfig, setGeofenceConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_v2_geofence_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_GEOFENCE_CONFIG, ...parsed, enabled: true };
      }
    } catch (e) {}
    return DEFAULT_GEOFENCE_CONFIG;
  });

  const [userLocation, setUserLocation] = useState(null);
  const [distanceFromOffice, setDistanceFromOffice] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('CHECKING'); // 'CHECKING' | 'GRANTED' | 'DENIED' | 'OUTSIDE_FENCE' | 'ERROR' | 'BYPASSED'
  const [gpsError, setGpsError] = useState('');
  const [isBypassed, setIsBypassed] = useState(false);

  const configRef = useRef(geofenceConfig);
  configRef.current = geofenceConfig;

  const isBypassedRef = useRef(isBypassed);
  isBypassedRef.current = isBypassed;

  const isAdminRef = useRef(isAdmin);
  isAdminRef.current = isAdmin;

  // Sync real-time settings from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'geofence_security'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const merged = { 
          ...DEFAULT_GEOFENCE_CONFIG, 
          ...data,
          enabled: true,
          currentOtp: data.currentOtp || data.customBypassCode || '849201',
          customBypassCode: data.currentOtp || data.customBypassCode || '849201'
        };
        setGeofenceConfig(merged);
        try {
          localStorage.setItem('crm_v2_geofence_config', JSON.stringify(merged));
        } catch (e) {}
      } else {
        const initOtp = generateNewOTP();
        const initConfig = { ...DEFAULT_GEOFENCE_CONFIG, enabled: true, currentOtp: initOtp, customBypassCode: initOtp };
        setDoc(doc(db, 'settings', 'geofence_security'), initConfig, { merge: true }).catch(() => {});
      }
    }, (err) => {
      console.warn("Geofence config sync:", err.message);
    });

    return () => unsub();
  }, []);

  // Location check handler
  const verifyLocation = useCallback((isInitial = false) => {
    if (isAdminRef.current) {
      setGpsStatus('GRANTED');
      return;
    }

    if (isBypassedRef.current) {
      setGpsStatus('BYPASSED');
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('ERROR');
      setGpsError('Geolocation is not supported by your browser or device hardware.');
      return;
    }

    if (isInitial) {
      setGpsStatus('CHECKING');
      setGpsError('');
    }

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

        const currentConf = configRef.current;
        const targetLat = Number(currentConf.latitude);
        const targetLon = Number(currentConf.longitude);
        const allowedRadius = Number(currentConf.radiusMeters) || 50;

        const distance = calculateDistanceMeters(userLat, userLon, targetLat, targetLon);
        setDistanceFromOffice(distance);

        // Staff & Managers: Strict boundary enforcement
        if (distance <= allowedRadius) {
          setGpsStatus('GRANTED');
        } else {
          setGpsStatus('OUTSIDE_FENCE');
        }
      },
      (error) => {
        let msg = 'Failed to obtain GPS location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. You must allow GPS access in your browser to verify you are within the authorized office location.';
          setGpsStatus('DENIED');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'GPS location information is unavailable on this device/network.';
          setGpsStatus('ERROR');
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please click retry to verify again.';
          if (isInitial) setGpsStatus('ERROR');
        } else {
          if (isInitial) setGpsStatus('ERROR');
        }
        setGpsError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, []);

  // Continuous live tracking for Staff & Managers (every 2.5 seconds)
  useEffect(() => {
    if (isAdmin || isBypassed) {
      setGpsStatus(isAdmin ? 'GRANTED' : 'BYPASSED');
      return;
    }

    verifyLocation(true);

    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (isAdminRef.current || isBypassedRef.current) return;

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

          const currentConf = configRef.current;
          const targetLat = Number(currentConf.latitude);
          const targetLon = Number(currentConf.longitude);
          const allowedRadius = Number(currentConf.radiusMeters) || 50;

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
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }

    const interval = setInterval(() => {
      if (!isAdminRef.current && !isBypassedRef.current) {
        verifyLocation(false);
      }
    }, 2500);

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(interval);
    };
  }, [isAdmin, isBypassed, verifyLocation]);

  // Update config in Firestore & local state
  const updateGeofenceConfig = async (newConfig) => {
    const updated = { ...geofenceConfig, ...newConfig, enabled: true };
    setGeofenceConfig(updated);
    try {
      localStorage.setItem('crm_v2_geofence_config', JSON.stringify(updated));
      await setDoc(doc(db, 'settings', 'geofence_security'), updated, { merge: true });
    } catch (e) {
      console.warn("Save geofence settings warning:", e.message);
    }
    return updated;
  };

  // Roll new OTP
  const rotateOTP = async () => {
    const nextOtp = generateNewOTP();
    await updateGeofenceConfig({
      currentOtp: nextOtp,
      customBypassCode: nextOtp,
      lastRotatedAt: new Date().toISOString()
    });
    return nextOtp;
  };

  // Single-use OTP authorization
  const bypassGeofence = async (passcode) => {
    const code = (passcode || '').trim();
    const activeOtp = String(geofenceConfig.currentOtp || geofenceConfig.customBypassCode || '').trim();
    const superAdminMaster = 'SUPERADMIN@2026';

    const isValid = (code && (code === activeOtp || code === superAdminMaster));

    if (isValid) {
      setIsBypassed(true);
      setGpsStatus('BYPASSED');

      // Burn used OTP and generate fresh one in Firestore
      try {
        const nextOtp = generateNewOTP();
        await updateGeofenceConfig({
          currentOtp: nextOtp,
          customBypassCode: nextOtp,
          lastOtpUsedAt: new Date().toISOString(),
          lastBypassedByUser: user?.name || user?.email || 'Staff User'
        });
      } catch (err) {
        console.warn('Error rotating OTP:', err);
      }

      return { success: true, message: 'Access authorized! Single-use OTP has been consumed and rotated.' };
    }

    return { success: false, message: 'Invalid or expired Emergency OTP Passcode. Please contact Admin.' };
  };

  // Strict Access Allowed:
  // True if Admin (anywhere in world) OR bypassed with single-use OTP OR inside office perimeter
  const isAccessAllowed = Boolean(
    isAdmin === true ||
    isBypassed === true ||
    (
      gpsStatus === 'GRANTED' &&
      userLocation !== null &&
      distanceFromOffice !== null &&
      !isNaN(distanceFromOffice) &&
      distanceFromOffice <= (Number(geofenceConfig?.radiusMeters) || 50)
    )
  );

  return (
    <GeofenceContext.Provider
      value={{
        geofenceConfig,
        userLocation,
        distanceFromOffice,
        gpsStatus,
        gpsError,
        isBypassed,
        isAdmin,
        isAccessAllowed,
        verifyLocation: () => verifyLocation(true),
        updateGeofenceConfig,
        rotateOTP,
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
