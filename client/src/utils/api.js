import axios from 'axios';
import toast from 'react-hot-toast';

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_ROOT}/api`,
  headers: { 'Content-Type': 'application/json' },
  // The free hosting tier sleeps when idle; the first request can take ~50 s to wake it
  timeout: 75000,
});

// Requests whose 401 means "wrong credentials", not "session expired"
const AUTH_FORMS = ['/auth/login', '/auth/register'];

const SLOW_MS = 6000;
let pending = 0;
let slowTimer = null;
const WAKE_TOAST = 'server-waking';

const begin = () => {
  pending += 1;
  if (!slowTimer) {
    slowTimer = setTimeout(() => {
      toast.loading('Waking up the server (free hosting sleeps when idle). This can take up to a minute...', { id: WAKE_TOAST });
    }, SLOW_MS);
  }
};

const finish = () => {
  pending = Math.max(0, pending - 1);
  if (pending === 0) {
    clearTimeout(slowTimer);
    slowTimer = null;
    toast.dismiss(WAKE_TOAST);
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    begin();
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    finish();
    return response;
  },
  (error) => {
    finish();
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !AUTH_FORMS.some((p) => url.includes(p))) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    if (!error.response) {
      error.response = {
        data: {
          message: error.code === 'ECONNABORTED'
            ? 'The server took too long to respond. Please try again.'
            : 'Cannot reach the server. Check your connection and try again.',
        },
      };
    }
    return Promise.reject(error);
  }
);

// Fire-and-forget ping so a sleeping backend starts waking while the user reads the landing page
export const wakeServer = () => {
  fetch(`${API_ROOT}/api/health`, { cache: 'no-store' }).catch(() => {});
};

export default api;
