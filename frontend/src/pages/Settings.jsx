import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGeofence, calculateDistanceMeters, generateNewOTP } from '../context/GeofenceContext';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, Building2, Save, Key, UserCheck, ShieldCheck, 
  MapPin, Navigation, Compass, AlertTriangle, CheckCircle2, RefreshCw, Copy, Sparkles, Lock 
} from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const { geofenceConfig, updateGeofenceConfig, rotateOTP, userLocation } = useGeofence();
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
    enabled: true,
    officeName: 'SK Smart Investments Head Office',
    latitude: 12.8342,
    longitude: 79.7036,
    radiusMeters: 50,
    allowAdminBypass: true,
    currentOtp: '849201',
    customBypassCode: '849201'
  });

  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsCaptureMsg, setGpsCaptureMsg] = useState('');
  const [liveTestDistance, setLiveTestDistance] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [isRotatingOtp, setIsRotatingOtp] = useState(false);

  useEffect(() => {
    if (geofenceConfig) {
      setGeoForm({
        enabled: geofenceConfig.enabled !== undefined ? geofenceConfig.enabled : true,
        officeName: geofenceConfig.officeName || 'SK Smart Investments Head Office',
        latitude: geofenceConfig.latitude !== undefined ? geofenceConfig.latitude : 12.8342,
        longitude: geofenceConfig.longitude !== undefined ? geofenceConfig.longitude : 79.7036,
        radiusMeters: geofenceConfig.radiusMeters !== undefined ? geofenceConfig.radiusMeters : 50,
        allowAdminBypass: geofenceConfig.allowAdminBypass !== undefined ? geofenceConfig.allowAdminBypass : true,
        currentOtp: geofenceConfig.currentOtp || geofenceConfig.customBypassCode || '849201',
        customBypassCode: geofenceConfig.currentOtp || geofenceConfig.customBypassCode || '849201'
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
        setGpsCaptureMsg(`✓ Captured coordinates: ${lat}, ${lon} (Device Accuracy: ±${acc}m)`);
      },
      (err) => {
        setIsCapturingGPS(false);
        setGpsCaptureMsg(`⚠️ Failed to capture GPS: ${err.message}. Please ensure location permissions are granted.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleManualRotateOTP = async () => {
    setIsRotatingOtp(true);
    try {
      const nextCode = await rotateOTP();
      setGeoForm(prev => ({ ...prev, currentOtp: nextCode, customBypassCode: nextCode }));
      alert(`New Single-Use Emergency Passcode generated: ${nextCode}`);
    } catch (e) {
      alert('Error rotating OTP: ' + e.message);
    } finally {
      setIsRotatingOtp(false);
    }
  };

  const handleCopyOTP = () => {
    const code = geoForm.currentOtp || geoForm.customBypassCode || '849201';
    navigator.clipboard.writeText(code);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2500);
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
        currentOtp: geoForm.currentOtp,
        customBypassCode: geoForm.currentOtp
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
        <p className="text-xs text-slate-500 font-semibold">Workspace metadata, office location geofencing, and rotating single-use security perimeter rules.</p>
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
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-2xl font-black ${geoForm.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-black text-slate-900">GPS Location Geofence Protection</h3>
                  <span className={`badge text-[10px] font-black uppercase ${geoForm.enabled ? 'badge-green' : 'badge-red'}`}>
                    {geoForm.enabled ? 'STRICTLY ENFORCED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold">
                  Restricts CRM access strictly to authorized office coordinates (Staff &amp; Managers outside the perimeter are blocked)
                </p>
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
                {geoForm.enabled ? 'Enforced' : 'Disabled'}
              </span>
            </label>
          </div>

          {/* ================= DYNAMIC ROTATING OTP PASSCODE CARD ================= */}
          <div className="bg-gradient-to-br from-amber-50 via-amber-100/40 to-yellow-50 p-5 rounded-2xl border border-amber-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Emergency Single-Use OTP Passcode
                  </h4>
                  <p className="text-[11px] text-amber-800 font-semibold">
                    Automatically rotates to a new secret OTP every time any staff member authorizes with it
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyOTP}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-amber-300 font-extrabold text-xs shadow-2xs transition cursor-pointer flex items-center space-x-1"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-600" />
                  <span>{copiedOtp ? 'Copied!' : 'Copy OTP'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleManualRotateOTP}
                  disabled={isRotatingOtp}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-2xs transition cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRotatingOtp ? 'animate-spin' : ''}`} />
                  <span>Roll New OTP</span>
                </button>
              </div>
            </div>

            <div className="bg-white/90 p-4 rounded-xl border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Active Single-Use Secret Passcode:
                </span>
                <span className="text-2xl font-black font-mono tracking-widest text-slate-900">
                  {geoForm.currentOtp || '849201'}
                </span>
              </div>
              <div className="text-right">
                <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Auto-Rotation Active
                </span>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Burns immediately upon use</p>
              </div>
            </div>
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

            {/* Allowable Radius */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Allowed Perimeter Radius
              </label>
              <select
                value={geoForm.radiusMeters}
                onChange={(e) => setGeoForm({ ...geoForm, radiusMeters: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={1.52}>5 Feet (~1.5 Meters - Immediate Desk / Chair Zone)</option>
                <option value={3.05}>10 Feet (~3.0 Meters - Single Cabin / Workspace)</option>
                <option value={7.62}>25 Feet (~7.6 Meters - Office Room)</option>
                <option value={15.24}>50 Feet (~15.2 Meters - Office Floor / Section)</option>
                <option value={30.48}>100 Feet (~30.5 Meters - Entire Office Suite)</option>
                <option value={50}>50 Meters (~164 Feet - Entire Office Building - Recommended)</option>
                <option value={100}>100 Meters (Office Complex)</option>
                <option value={500}>500 Meters (Standard Office Vicinity)</option>
                <option value={1000}>1 Kilometer (Office Neighborhood)</option>
              </select>
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
                      {(liveTestDistance * 3.28084).toFixed(1)} Feet ({liveTestDistance < 1000 ? `${liveTestDistance.toFixed(2)}m` : `${(liveTestDistance / 1000).toFixed(2)}km`})
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
