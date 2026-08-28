import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GeofenceProvider } from './context/GeofenceContext';
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
          <GeofenceProvider>
            <NotificationProvider>
              <DataProvider>
                <Customer360Provider>
                  <AppRoutes />
                  <ToastContainer />
                </Customer360Provider>
              </DataProvider>
            </NotificationProvider>
          </GeofenceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

