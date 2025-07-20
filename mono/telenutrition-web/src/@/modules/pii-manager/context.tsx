'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import localStorageHelpers from 'utils/localStorageHelpers';
import { useFeatureFlags } from '../feature-flag';

interface IPiiManagerContext {
  isPiiHidden: boolean;
  setIsPiiHidden: (isHidden: boolean) => void;
}

export const PiiDisplayContext = createContext<IPiiManagerContext | null>(null);

export function usePiiManagerContext() {
  const context = useContext(PiiDisplayContext);
  if (!context) {
    throw new Error('usePiiContext must be used within a PiiProvider');
  }
  return context;
}

export function PiiManagerProvider({ children }: { children: ReactNode }) {
  const [isPiiHidden, _setIsPiiHidden] = useState(false);
  const featureFlags = useFeatureFlags();

  function setIsPiiHidden(value: boolean) {
    localStorageHelpers.set('pii-hidden', String(value));
    _setIsPiiHidden(value);
  }

  useEffect(() => {
    const piiHidden = localStorageHelpers.get('pii-hidden');
    if (
      featureFlags.hasFeature('provider_dashboard_0_9_improvements_DEV_16908') &&
      piiHidden === 'true'
    ) {
      _setIsPiiHidden(true);
    }
  }, []);

  const values = {
    isPiiHidden,
    setIsPiiHidden,
  };

  return <PiiDisplayContext.Provider value={values}>{children}</PiiDisplayContext.Provider>;
}
