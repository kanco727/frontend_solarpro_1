// Contexte temps réel pour SCADA SolarPro
import React, { createContext, useContext } from 'react';

export interface RealtimeData {
  timestamp: string;
  miniGridId: number;
  production: number;
  consumption: number;
  batteryLevel: number;
  alerts: any[];
  sites: any[];
}

interface RealtimeContextType {
  isConnected: boolean;
  realtimeData: Map<number, RealtimeData>;
  subscribeToMiniGrid: (id: number) => void;
  unsubscribeFromMiniGrid: (id: number) => void;
  sendCommand: (miniGridId: number, command: string, params?: any) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: RealtimeContextType = {
    isConnected: false,
    realtimeData: new Map(),
    subscribeToMiniGrid: () => {},
    unsubscribeFromMiniGrid: () => {},
    sendCommand: async () => {}
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
