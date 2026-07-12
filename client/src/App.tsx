import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FleetPage from './pages/FleetPage';
import DriversPage from './pages/DriversPage';
import TripsPage from './pages/TripsPage';
import MaintenancePage from './pages/MaintenancePage';
import FuelPage from './pages/FuelPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10000 },
  }
});

function AppLayout() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent-amber" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-dark-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={
                <ProtectedRoute module="Dashboard"><DashboardPage /></ProtectedRoute>
              } />
              <Route path="/fleet" element={
                <ProtectedRoute module="Fleet"><FleetPage /></ProtectedRoute>
              } />
              <Route path="/drivers" element={
                <ProtectedRoute module="Drivers"><DriversPage /></ProtectedRoute>
              } />
              <Route path="/trips" element={
                <ProtectedRoute module="Trips"><TripsPage /></ProtectedRoute>
              } />
              <Route path="/maintenance" element={
                <ProtectedRoute module="Maintenance"><MaintenancePage /></ProtectedRoute>
              } />
              <Route path="/fuel" element={
                <ProtectedRoute module="Fuel"><FuelPage /></ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute module="Analytics"><AnalyticsPage /></ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute module="Settings"><SettingsPage /></ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
