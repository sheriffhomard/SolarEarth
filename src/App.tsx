import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { MapPage } from './pages/MapPage';
import { PvPage } from './pages/PvPage';
import { TrajectoryPage } from './pages/TrajectoryPage';
import { HistoryPage } from './pages/HistoryPage';
import { ScientificLabPage } from './pages/ScientificLabPage';
import { ActivityPage } from './pages/ActivityPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="pv" element={<PvPage />} />
          <Route path="trajectory" element={<TrajectoryPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="lab" element={<ScientificLabPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
