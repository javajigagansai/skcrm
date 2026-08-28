import React, { useState } from 'react';
import { useGeofence } from '../../context/GeofenceContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Navigation, Lock, RefreshCw, Key, MapPin, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const GeofenceLockScreen = () => {
  const { geofenceConfig, userLocation, distanceFromOffice, gpsStatus, gpsError, verifyLocation, bypassGeofence } = useGeofence();
  const { user } = useAuth();

  const [passcode, setPasscode] = useState('');
  const [bypassError, setBypassError] = useState('');
  const [showBypassModal, setShowBypassModal] = useState(false);

  const handleBypassSubmit = (e) => {
    e.preventDefault();
    setBypassError('');
    const res = bypassGeofence(passcode);
    if (!res.success) {
      setBypassError(res.message);
    }
  };

  const targetLat = Number(geofenceConfig.latitude) || 0;
  const targetLon = Number(geofenceConfig.longitude) || 0;
  const radius = Number(geofenceConfig.radiusMeters) || 1.52;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center space-y-6 animate-fadeIn relative overflow-hidden">
        {/* Glow backdrop accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Security Icon Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-inner">
            {gpsStatus === 'CHECKING' ? (
              <RefreshCw className="h-10 w-10 animate-spin text-blue-400" />
            ) : (
              <ShieldAlert className="h-10 w-10 text-rose-500" />
            )}
          </div>
        </div>

        {/* Header & Status Title */}
        <div className="space-y-2">
          <span className="badge bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider px-3 py-1">
            🔒 GPS Geofence Security Enforcement
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">
            {gpsStatus === 'CHECKING'
              ? 'Acquiring GPS Office Coordinates...'
              : gpsStatus === 'DENIED'
              ? 'Location Permission Required'
              : gpsStatus === 'OUTSIDE_FENCE'
              ? 'Access Blocked: Outside Office Perimeter'
              : 'Geofence Security Check'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            {gpsStatus === 'CHECKING'
              ? 'Please wait while we verify that your device is located within the authorized office location.'
              : gpsStatus === 'DENIED'
              ? 'To protect confidential financial data, access is restricted to authorized office premises. Please enable location permissions in your browser.'
              : gpsStatus === 'OUTSIDE_FENCE'
              ? `You are currently outside the authorized boundary for ${geofenceConfig.officeName || 'Office HQ'}.`
              : gpsError || 'Location verification is required to access the CRM portal.'}
          </p>
        </div>

        {/* Metrics Grid */}
        {userLocation && (
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 text-left text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center space-x-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                <span>Authorized Location</span>
              </span>
              <span className="font-mono text-slate-300 font-bold text-[11px]">
                {targetLat.toFixed(5)}, {targetLon.toFixed(5)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center space-x-1.5">
                <Navigation className="h-3.5 w-3.5 text-emerald-400" />
                <span>Your Detected GPS</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold text-[11px]">
                {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
              </span>
            </div>

            {distanceFromOffice !== null && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-extrabold uppercase text-slate-400">Distance from Office:</span>
                <div className="text-right">
                  <span className={`font-black font-mono text-sm block ${distanceFromOffice <= radius ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(distanceFromOffice * 3.28084).toFixed(1)} Feet ({distanceFromOffice < 1000 ? `${distanceFromOffice.toFixed(1)}m` : `${(distanceFromOffice / 1000).toFixed(2)}km`})
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Max allowed: {(radius * 3.28084).toFixed(0)} Feet ({radius}m)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => verifyLocation(true)}
            disabled={gpsStatus === 'CHECKING'}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${gpsStatus === 'CHECKING' ? 'animate-spin' : ''}`} />
            <span>{gpsStatus === 'CHECKING' ? 'Verifying GPS...' : 'Re-verify GPS Location'}</span>
          </button>

          {(geofenceConfig.allowAdminBypass || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setShowBypassModal(true)}
              className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Key className="h-3.5 w-3.5 text-amber-400" />
              <span>Admin Emergency Security Bypass</span>
            </button>
          )}
        </div>

        {/* Emergency Bypass Modal */}
        {showBypassModal && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-left space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center space-x-2">
                  <Key className="h-4 w-4 text-amber-400" />
                  <span>Admin Emergency Bypass</span>
                </h3>
                <button onClick={() => setShowBypassModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleBypassSubmit} className="space-y-3 text-xs">
                <p className="text-slate-400">Enter the Master Security Passcode to override geofencing for this session:</p>
                <div>
                  <input
                    type="password"
                    placeholder="Enter Emergency Passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs outline-none focus:border-amber-400"
                    autoFocus
                  />
                  {bypassError && (
                    <p className="text-[11px] text-rose-400 font-bold mt-1.5 flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 inline" />
                      <span>{bypassError}</span>
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBypassModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow"
                  >
                    Authorize Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
