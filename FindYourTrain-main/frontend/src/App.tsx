import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { EntryPage } from './pages/EntryPage';
import { PassengerPage } from './pages/PassengerPage';
import { PassengerDashboard } from './pages/PassengerDashboard';
import { AdminPage } from './pages/AdminPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { useThemeStore } from './store/themeStore';

function ThemeInitializer() {
  const { setTheme } = useThemeStore();
  useEffect(() => {
    setTheme('dark');
  }, []);
  return null;
}

import { useTrainStore } from './store/trainStore';

function DataInitializer() {
  const { loadInitialData } = useTrainStore();
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeInitializer />
      <DataInitializer />
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/passenger" element={<PassengerPage />} />
        <Route path="/passenger/:trainNumber" element={<PassengerDashboard />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/:trainNumber" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
