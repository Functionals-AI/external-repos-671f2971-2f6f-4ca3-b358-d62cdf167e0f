import { ReactNode, useEffect } from 'react';
import { useAppStateContext } from '../state/context';
import { useModalManager } from '../modules/modal/manager';

export default function RequireAppConsent({ children }: { children: ReactNode }) {
  const { appState } = useAppStateContext();
  const modalManager = useModalManager();

  // Although we allow rendering children, we will check if user needs to consent before having app-access.
  // If they do, it will show a non-closable modal.
  useEffect(() => {
    if (appState.auth?.loggedIn && appState.auth.appUser && !appState.auth.appUser.hasAppConsent) {
      if (appState.modal.isOpen) {
        if (appState.modal.modal?.type !== 'RequireAppConsent') {
          modalManager.closeModal();
        } else {
          return;
        }
      }
      modalManager.openModal({ type: 'RequireAppConsent', prohibitClose: true });
    }
  }, [appState.auth]);
  return <>{children}</>;
}
