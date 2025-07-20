'use client';

import React, { ReactNode, useContext, useState } from 'react';
import { DeveloperError } from 'utils/errors';
import { DrawerData, DrawerState, ExampleDrawerData, OpenDrawerState, PatientQuickViewDrawerData } from './types';
import ExampleDrawer from './drawers/example';
import PatientQuickViewDrawer from './drawers/patient-quick-view';

const DrawerContext = React.createContext<DrawerState | null>(null);

function DrawerProvider({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function openDrawer(d: DrawerData) {
    setDrawer(d);
    setTimeout(() => {
      setIsOpen(true);
    }, 1);
  }

  function closeDrawer() {
    setIsOpen(false);
    setTimeout(() => {
      setDrawer(null);
    }, 300);
  }
  return (
    <DrawerContext.Provider value={{ closeDrawer, openDrawer, drawer, isOpen }}>
      {children}
    </DrawerContext.Provider>
  );
}

function DrawerManager() {
  const drawerState = useDrawer();
  if (!drawerState.drawer) return null;

  if (drawerState.drawer.type === 'example') {
    return <ExampleDrawer {...(drawerState as OpenDrawerState<ExampleDrawerData>)} />;
  }

  if (drawerState.drawer.type === 'patient-quick-view') {
    return <PatientQuickViewDrawer {...(drawerState as OpenDrawerState<PatientQuickViewDrawerData>)} />
  }

  return null;
}

function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) throw new DeveloperError('Must have Drawer Provider to use this hook');
  return context;
}

export { DrawerProvider, useDrawer, DrawerManager };
