import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoldenSKLogo } from '../components/common/GoldenSKLogo';
import { Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0a0d14] flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
      {/* Low-Poly Geometric Background SVG Overlay matching user reference image */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90">
        <svg className="w-full h-full object-cover" preserveAspectRatio="none" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
          {/* Dark Navy & Rust Orange Geometric Facets */}
          <polygon points="0,0 350,0 200,280" fill="#0d1b2a" />
          <polygon points="350,0 650,0 480,220" fill="#14263d" />
          <polygon points="650,0 1000,0 760,180" fill="#a03c09" />
          <polygon points="1000,0 1000,320 760,180" fill="#c44908" />

          <polygon points="0,0 200,280 0,420" fill="#09131f" />
          <polygon points="200,280 480,220 320,480" fill="#8c3305" />
          <polygon points="480,220 760,180 620,440" fill="#a83f09" />
          <polygon points="760,180 1000,320 820,520" fill="#112238" />
          <polygon points="1000,320 1000,600 820,520" fill="#0d1b2a" />

          <polygon points="0,420 320,480 0,600" fill="#752a04" />
          <polygon points="320,480 620,440 450,600" fill="#14273e" />
          <polygon points="620,440 820,520 780,600" fill="#b84308" />
          <polygon points="450,600 780,600 620,440" fill="#193352" />
          <polygon points="0,600 450,600 320,480" fill="#5c2002" />
          <polygon points="780,600 1000,600 820,520" fill="#0a1424" />
        </svg>
      </div>




      {/* Main Login Center Card (White Background) */}
      <div className="w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md rounded-[28px] border border-slate-100 shadow-2xl p-7 sm:p-9 space-y-6 relative z-10 text-slate-900">
        
        {/* SK Logo & Title Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mx-auto mb-1">
            <GoldenSKLogo className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xl" />
          </div>
          <div>
            <h1 className="text-2.5xl font-black text-slate-900 tracking-tight">
              SK Smart
            </h1>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* Login Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Email Input Field */}
          <div className="space-y-1">
            <input 
              type="email" 
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-slate-300 focus:border-orange-600 py-3 text-sm text-slate-900 outline-none font-semibold placeholder-slate-400 transition"
              placeholder="Enter your email address"
            />
          </div>

          {/* Password Input Field */}
          <div className="relative flex items-center border-b border-slate-300 focus-within:border-orange-600 transition">
            <input 
              type={showPassword ? "text" : "password"} 
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent py-3 pr-8 text-sm text-slate-900 outline-none font-semibold placeholder-slate-400 tracking-wider"
              placeholder="Enter your password"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-orange-600 transition cursor-pointer shrink-0"
              title={showPassword ? "Hide Password" : "Show Password"}
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5 text-orange-600" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>

          {/* Primary Orange Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#e65100] hover:bg-[#d84b00] active:scale-[0.99] text-white font-black text-sm shadow-xl shadow-orange-600/30 transition-all cursor-pointer flex items-center justify-center space-x-1 pt-3.5 pb-3.5 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <span className="text-base leading-none">→</span>
          </button>
        </form>

        {/* Secure Login Footer Divider */}
        <div className="pt-3 flex items-center justify-center">
          <div className="w-full border-t border-slate-200 relative text-center">
            <span className="bg-white px-3 text-[10px] font-black text-slate-400 tracking-widest uppercase absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              SECURE LOGIN
            </span>
          </div>
        </div>

      </div>

      {/* Bottom Page Copyright Footer */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-[11px] font-semibold text-slate-300 z-10">
        © SK Smart Investments 2026
      </div>
    </div>
  );
};

