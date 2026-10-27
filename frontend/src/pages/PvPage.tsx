import React from 'react';
import { PvSimulatorView } from '../components/solar/PvSimulatorView';

export const PvPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PvSimulatorView />
    </div>
  );
};
