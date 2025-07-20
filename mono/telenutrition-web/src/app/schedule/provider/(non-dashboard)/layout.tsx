'use client';

import { ReactNode } from 'react';
import useIntercom from 'hooks/useIntercom';
import { useProviderContext } from '../provider-context';

export default function ProviderLayout({ children }: { children: ReactNode }) {
  const {
    providerData: { provider, intercomHash },
  } = useProviderContext();
  useIntercom({ provider, intercomHash });

  return children;
}
