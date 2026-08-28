import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGeofence, calculateDistanceMeters } from '../context/GeofenceContext';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Building2, Save, Key, UserCheck, ShieldCheck, MapPin, Navigation, Compass, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const { geofenceConfig, updateGeofenceConfig, userLocation } = useGeofence();
  const navigate = useNavigate();
  const isAdminOrHigher = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const [settings, setSettings] = useState({
    companyName: 'SK SMART INVESTMENTS',
    tagline: 'Insurance and Investments Specialist',
    branchName: 'Kanchipuram Master Office HQ',
    branchCode: 'BR-KNM-001',
    theme: 'Light Clean',
    defaultCurrency: 'INR (₹)'
  });

  const [geoForm, setGeoForm] = useState({
    enabled: false,
    officeName: 'SK Smart Investments Head Office',
    latitude: 12.8342,
    longitude: 79.7036,
    radiusMeters: 500,
    allowAdminBypass: true,
    customBypassCode: 'SK@GEO2026'
  });

  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsCaptureMsg, setGpsCaptureMsg] = useState('');
  const [liveTestDistance, setLiveTestDistance] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (geofenceConfig) {
      setGeoForm({
        enabled: geofenceConfig.enabled || false,
        officeName: geofenceConfig.officeName || 'SK Smart Investments Head Office',
        latitude: geofenceConfig.latitude !== undefined ? geofenceConfig.latitude : 12.8342,
        longitude: geofenceConfig.longitude !== undefined ? geofenceConfig.longitude : 79.7036,
        radiusMeters: geofenceConfig.radiusMeters !== undefined ? geofenceConfig.radiusMeters : 500,
        allowAdminBypass: geofenceConfig.allowAdminBypass !== undefined ? geofenceConfig.allowAdminBypass : true,
        customBypassCode: geofenceConfig.customBypassCode || 'SK@GEO2026'
      });
    }
  }, [geofenceConfig]);

  const handleCaptureCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsCapturingGPS(true);
    setGpsCaptureMsg('Acquiring high-precision GPS coordinates from your device...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lon = parseFloat(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy);

        setGeoForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon
        }));

        setIsCapturingGPS(false);
        setGpsCaptureMsg(`✓ Captured coordinates: ${lat}, ${lon} (Accuracy: ±${acc}m)`);
      },
      (err) => {
        setIsCapturingGPS(false);
        setGpsCaptureMsg(`⚠️ Failed to capture GPS: ${err.message}. Please ensure location permissions are granted in browser.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleTestDistance = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = calculateDistanceMeters(pos.coords.latitude, pos.coords.longitude, Number(geoForm.latitude), Number(geoForm.longitude));
        setLiveTestDistance(d);
      },
      (err) => alert('Could not get current location: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    setSaveStatus('Saving...');

    try {
      await updateGeofenceConfig({
        enabled: geoForm.enabled,
        officeName: geoForm.officeName,
        latitude: Number(geoForm.latitude),
        longitude: Number(geoForm.longitude),
        radiusMeters: Number(geoForm.radiusMeters),
        allowAdminBypass: geoForm.allowAdminBypass,
        customBypassCode: geoForm.customBypassCode
      });

      setSaveStatus('Saved!');
      alert('System Settings & Geofence Security updated successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      alert('Error saving settings: ' + err.message);
      setSaveStatus('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <SettingsIcon className="h-7 w-7 text-blue-600" />
          <span>System Settings &amp; Security Controls</span>
        </h1>
        <p className="text-xs text-slate-500 font-semibold">Workspace metadata, office location geofencing, and security perimeter rules.</p>
      </div>

      {isAdminOrHigher && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-6 rounded-3xl text-white shadow-xl space-y-3 border border-blue-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black shadow">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Admin Master Passwords &amp; Staff Access Vault</h3>
                <p className="text-[11px] text-blue-200">View passwords, edit all user details, change roles, and reset credentials</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/users')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Key className="h-3.5 w-3.5" />
              <span>Open Password Vault</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= GEOFENCING SECURITY PERIMETER SECTION ================= */}
      {isAdminOrHigher && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-2xl font-black ${geoForm.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-black text-slate-900">GPS Location Geofence Protection</h3>
                  <span className={`badge text-[10px] font-black uppercase ${geoForm.enabled ? 'badge-green' : 'badge-red'}`}>
                    {geoForm.enabled ? 'ENFORCED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold">Restrict CRM access strictly to authorized office coordinates (Latitude / Longitude perimeter)</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer select-none self-start sm:self-auto">
              <input
                type="checkbox"
                checked={geoForm.enabled}
                onChange={(e) => setGeoForm({ ...geoForm, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-xs font-black text-slate-800">
                {geoForm.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">Office / Branch Location Name</label>
              <input
                type="text"
                value={geoForm.officeName}
                onChange={(e) => setGeoForm({ ...geoForm, officeName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. SK Smart Investments Head Office"
              />
            </div>

            {/* GPS Latitude & Longitude Input Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1 flex items-center space-x-1">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  <span>Authorized Latitude (e.g. 12.834200) *</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={geoForm.latitude}
                  onChange={(e) => setGeoForm({ ...geoForm, latitude: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12.834200"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1 flex items-center space-x-1">
                  <Compass className="h-3.5 w-3.5 text-blue-600" />
                  <span>Authorized Longitude (e.g. 79.703600) *</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={geoForm.longitude}
                  onChange={(e) => setGeoForm({ ...geoForm, longitude: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="79.703600"
                />
              </div>
            </div>

            {/* 1-Click GPS Capture Helper */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-slate-800 block">Auto-Configure from Current Device Location</span>
                <p className="text-[11px] text-slate-500 font-medium">Click to instantly populate latitude and longitude using your current device's GPS</p>
                {gpsCaptureMsg && (
                  <p className="text-[11px] font-bold text-blue-700 mt-1">{gpsCaptureMsg}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCaptureCurrentGPS}
                disabled={isCapturingGPS}
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-extrabold text-xs transition cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
              >
                <Navigation className={`h-3.5 w-3.5 ${isCapturingGPS ? 'animate-spin' : ''}`} />
                <span>{isCapturingGPS ? 'Detecting GPS...' : '📍 Detect Current GPS'}</span>
              </button>
            </div>

            {/* Allowable Radius and Bypass Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  Allowed Perimeter Radius
                </label>
                <select
                  value={geoForm.radiusMeters}
                  onChange={(e) => setGeoForm({ ...geoForm, radiusMeters: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={50}>50 Meters (Immediate Office Room / Building)</option>
                  <option value={100}>100 Meters (Office Complex)</option>
                  <option value={250}>250 Meters (Office Campus &amp; Surroundings)</option>
                  <option value={500}>500 Meters (Standard Office Vicinity - Recommended)</option>
                  <option value={1000}>1 Kilometer (Office Neighborhood)</option>
                  <option value={5000}>5 Kilometers (City Zone)</option>
                  <option value={15000}>15 Kilometers (Metropolitan Area)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  Admin Emergency Bypass Passcode
                </label>
                <input
                  type="text"
                  value={geoForm.customBypassCode}
                  onChange={(e) => setGeoForm({ ...geoForm, customBypassCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SK@GEO2026"
                />
              </div>
            </div>

            {/* Test Location Distance Tool */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-black text-blue-900">Perimeter Verification Tester</h4>
                <p className="text-[11px] text-blue-700">Check how far your current device is from the configured office coordinates</p>
                {liveTestDistance !== null && (
                  <div className="mt-1.5 flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700">Calculated Distance:</span>
                    <span className={`font-mono font-black text-sm ${liveTestDistance <= geoForm.radiusMeters ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {liveTestDistance > 1000 ? `${(liveTestDistance / 1000).toFixed(2)} km` : `${liveTestDistance} meters`}
                    </span>
                    <span className={`badge text-[10px] font-black ${liveTestDistance <= geoForm.radiusMeters ? 'badge-green' : 'badge-red'}`}>
                      {liveTestDistance <= geoForm.radiusMeters ? '✓ INSIDE GEOFENCE' : '✗ OUTSIDE GEOFENCE'}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleTestDistance}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                Test My Current Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= GENERAL WORKSPACE PREFERENCES ================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card">
        <form onSubmit={handleSaveAll} className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 border-b pb-2">Workspace &amp; Company Branding</h3>
          <div>
            <label className="block text-xs font-black uppercase text-slate-600 mb-1">Company Name</label>
            <input 
              type="text" 
              value={settings.companyName}
              onChange={(e) => setSettings({...settings, companyName: e.target.value})}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">Branch Name</label>
              <input 
                type="text" 
                value={settings.branchName}
                onChange={(e) => setSettings({...settings, branchName: e.target.value})}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">Branch Code (Master Branch)</label>
              <input 
                type="text" 
                disabled
                value={settings.branchCode}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-100 text-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-3">
            <button 
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save System Settings &amp; Geofence Rules</span>
            </button>
            {saveStatus && (
              <span className="text-xs font-bold text-emerald-600 animate-fadeIn">✓ {saveStatus}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

