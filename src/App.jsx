import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Courses from './pages/Courses';
import Profile from './pages/Profile';
import Community from './pages/Community';
import Admin from './pages/Admin';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Лендинг только для незалогиненных */}
      <Route path="/" element={user ? <Navigate to="/courses" replace /> : <Landing />} />

      {/* Защищённые страницы */}
      <Route path="/courses" element={
        <PrivateRoute>
          <Layout><Courses /></Layout>
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <Layout><Profile /></Layout>
        </PrivateRoute>
      } />
      <Route path="/community" element={
        <PrivateRoute>
          <Layout><Community /></Layout>
        </PrivateRoute>
      } />
      <Route path="/admin" element={
        <PrivateRoute>
          <Layout><Admin /></Layout>
        </PrivateRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
