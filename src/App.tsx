// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MiniGridProvider } from './contexts/MiniGridContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import RealtimeNotifications from './components/RealtimeNotifications';
import LoginForm from './components/Auth/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import MiniGridsList from './components/MiniGrids/MiniGridsList';
import SHSList from './components/SHS/SHSList';
import MapView from './components/Cartographie/MapView';
import MonitoringView from './components/Monitoring/MonitoringView';
import AlertesView from './components/Alertes/AlertesView';
import MaintenanceView from './components/Maintenance/MaintenanceView';
import StatistiqueView from './components/statistique/statistiqueView';
import ParametresView from './views/ParametresView';
import NotificationView from './components/notifications/notificationView';
import EquipementsView from "./components/Equipements/EquipementsView";


// ✅ Route privée standard (connexion requise)
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-green-600 mx-auto mb-4"
            viewBox="0 0 24 24"
          />
          <p className="text-gray-600">Chargement de SolarPro...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// ✅ Route privée ADMIN uniquement
function AdminRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}


// ✅ Routes principales
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <>
              <RealtimeNotifications />
              <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/minigrids" element={<MiniGridsList />} />
                    <Route path="/shs" element={<SHSList />} />
                    <Route path="/cartographie" element={<MapView />} />
                    <Route path="/monitoring" element={<MonitoringView />} />
                    <Route path="/alertes" element={<AlertesView />} />
                    <Route path="/maintenance" element={<MaintenanceView />} />
                    <Route path="/statistiques" element={<StatistiqueView />} />
                    <Route path="/parametres" element={<ParametresView />} />
                    <Route path="/notifications" element={<NotificationView />} />

                    {/* ✅ Page Équipements protégée (Admin uniquement) */}
                    <Route
                      path="/equipements"
                      element={
                        <AdminRoute>
                          <EquipementsView />
                        </AdminRoute>
                      }
                    />

                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
              </div>
            </>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

// ✅ App globale avec Providers
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MiniGridProvider>
          <RealtimeProvider>
            <AppRoutes />
          </RealtimeProvider>
        </MiniGridProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
