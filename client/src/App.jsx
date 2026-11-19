import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import { wakeServer } from './utils/api';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Authenticated pages are code-split: visitors on the landing page don't download charting code
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ResumeUpload = lazy(() => import('./pages/ResumeUpload'));
const Interview = lazy(() => import('./pages/Interview'));
const Analytics = lazy(() => import('./pages/Analytics'));
const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));

const AppLayout = ({ children }) => (
  <div className="page-layout">
    <Navbar />
    <main className="main-content">
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner message="Loading..." />}>{children}</Suspense>
      </ErrorBoundary>
    </main>
  </div>
);

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />

      <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
      <Route path="/resume" element={<PrivateRoute><AppLayout><ResumeUpload /></AppLayout></PrivateRoute>} />
      <Route path="/interview" element={<PrivateRoute><AppLayout><Interview /></AppLayout></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><AppLayout><Analytics /></AppLayout></PrivateRoute>} />
      <Route path="/history" element={<PrivateRoute><AppLayout><History /></AppLayout></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  useEffect(() => { wakeServer(); }, []);
  return (
  <BrowserRouter>
    <AuthProvider>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a26',
            color: '#e8e8f0',
            border: '1px solid #2a2a3d',
            borderRadius: '12px',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#00e676', secondary: '#0a0a0f' } },
          error: { iconTheme: { primary: '#ff5252', secondary: '#0a0a0f' } },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
  );
};

export default App;
