'use client';

import { useModal } from '@/modules/modal';
import { ApiResponsePayload } from 'api/client';
import { useEnhancedReducer } from 'hooks/useEnhancedReducer';
import { ReactNode, useEffect } from 'react';
import { AppStateProvider } from 'state/context';
import reducer, { defaultState } from 'state/reducer';
import localStorageHelpers from 'utils/localStorageHelpers';
import { v4 as uuidv4 } from 'uuid';
import { usePathname } from 'next/navigation';

export default function TempAppStateWrapper({
  children,
  requireAuth = true,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const [appState, dispatch, getAppState] = useEnhancedReducer(reducer, defaultState);
  const modal = useModal();
  const pathname = usePathname();

  // Generate or get CID
  useEffect(() => {
    const channel = new BroadcastChannel('provider-auth');
    function handleMessage(e: MessageEvent) {
      if (e.data === 'autologin') {
        if (modal.modals?.primary.type === 'prompt-provider-login') {
          modal.closeAll();
        }
      }
    }

    channel.addEventListener('message', handleMessage);

    const existingCid = localStorageHelpers.get('cid');
    if (!existingCid) {
      const newCid = uuidv4();
      dispatch({ type: 'SET_CID', payload: newCid });
      localStorageHelpers.set('cid', newCid);
    } else {
      dispatch({ type: 'SET_CID', payload: existingCid });
    }

    return () => channel.removeEventListener('message', handleMessage);
  }, [modal]);

  function handlePostSuccess(path: string, data: ApiResponsePayload) {
    return data;
  }

  async function handleApiError(error: any) {
    if (
      requireAuth &&
      pathname !== '/schedule/provider/login' &&
      error.response &&
      [401, 403].includes(error.response.status)
    ) {
      modal.openPrimary({
        type: 'prompt-provider-login',
      });
    }
    throw error;
  }

  return (
    <AppStateProvider.Provider
      value={{ appState, dispatch, getAppState, handleApiError, handlePostSuccess }}
    >
      {children}
    </AppStateProvider.Provider>
  );
}
