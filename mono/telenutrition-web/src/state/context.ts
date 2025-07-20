import React, { useContext } from 'react';
import { AppStateContext } from './types';

const AppStateProvider = React.createContext<AppStateContext | null>(null);

function useAppStateContext() {
  const context = useContext(AppStateProvider);
  if (!context) throw new Error('Developer Error: Context must be initialized');

  return context;
}

export { AppStateProvider, useAppStateContext };
