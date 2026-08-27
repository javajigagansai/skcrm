import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Customer360Provider } from './context/Customer360Context';
import { NotificationProvider } from './context/NotificationContext';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer, showToast } from './components/common/ToastContainer';
import './index.css';

// Override native window.alert to prevent disruptive "sk-crm-1.web.app says" popups
if (typeof window !== 'undefined') {
  window.showToast = showToast;
  window.alert = (msg) => {
    if (!msg) return;
    const msgStr = typeof msg === 'string' ? msg : JSON.stringify(msg);
    const isError = msgStr.toLowerCase().includes('failed') || msgStr.toLowerCase().includes('error') || msgStr.toLowerCase().includes('please');
    const isWarning = msgStr.toLowerCase().includes('single') || msgStr.toLowerCase().includes('confirm') || msgStr.toLowerCase().includes('already');
    showToast(msgStr, isError ? 'error' : isWarning ? 'warning' : 'success');
  };
}

// Sanitize residual demo keys from browser localStorage
try {
  const sanitizeKeys = ['crm_v2_staff_celebrations', 'crm_v2_client_followup_hubs', 'crm_v2_spreadsheet_followups', 'crm_v2_admin_manager_notifications', 'crm_v2_team_chat_messages', 'crm_v2_daily_greetings_status'];
  sanitizeKeys.forEach(k => {
    const raw = localStorage.getItem(k);
    if (raw && (raw.includes('Rahul Dravid') || raw.includes('Priya Sharma') || raw.includes('Kavita Menon') || raw.includes('STF-001'))) {
    }
  });
} catch (e) {}

// Catch Vite dynamic import chunk loading failures (e.g. after deployment updates)
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

window.addEventListener('error', (event) => {
  if (event?.message && event.message.includes('Failed to fetch dynamically imported module')) {
    const hasReloaded = window.sessionStorage.getItem('chunk_reload_done');
    if (!hasReloaded) {
      window.sessionStorage.setItem('chunk_reload_done', 'true');
      window.location.reload();
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <DataProvider>
              <Customer360Provider>
                <AppRoutes />
                <ToastContainer />
              </Customer360Provider>
            </DataProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

