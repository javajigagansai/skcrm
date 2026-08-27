import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Bell } from 'lucide-react';

export const showToast = (message, type = 'success', title = '') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: {
        id: Date.now() + Math.random(),
        message: typeof message === 'string' ? message : JSON.stringify(message),
        type, // 'success' | 'error' | 'info' | 'warning'
        title
      }
    }));
  }
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      if (!e.detail || !e.detail.message) return;
      const newToast = e.detail;
      setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts at a time

      // Auto dismiss after 3.8 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3800);
    };

    window.addEventListener('app:toast', handleToast);
    return () => window.removeEventListener('app:toast', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => {
        const isError = toast.type === 'error' || toast.message.toLowerCase().includes('failed') || toast.message.toLowerCase().includes('error');
        const isWarning = toast.type === 'warning';
        const isSuccess = !isError && !isWarning;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-slide-in ${
              isError
                ? 'bg-rose-950/90 border-rose-700/80 text-rose-100'
                : isWarning
                ? 'bg-amber-950/90 border-amber-700/80 text-amber-100'
                : 'bg-slate-900/95 border-emerald-500/40 text-slate-100'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                isError
                  ? 'bg-rose-600 text-white'
                  : isWarning
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {isError ? (
                <AlertCircle className="h-4 w-4" />
              ) : isWarning ? (
                <Info className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-xs font-black tracking-wide uppercase mb-0.5 text-white">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs font-semibold leading-relaxed break-words">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer shrink-0"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
