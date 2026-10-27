import React from 'react';
import { SolarTrajectoryView } from '../components/solar/SolarTrajectoryView';

export const TrajectoryPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <SolarTrajectoryView />
    </div>
  );
};
