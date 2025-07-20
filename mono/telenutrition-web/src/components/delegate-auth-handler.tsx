import { useEffect } from 'react';
import useAppUser from '../hooks/useAppUser';
import localStorageHelpers from '../utils/localStorageHelpers';

export default function DelegateAuthHandler() {
  const appUser = useAppUser({ required: false });

  useEffect(() => {
    if (appUser.loading) return;

    // If logged in as a delegate, we want to log them out when the window is closed.
    if (appUser.data?.isDelegate) {
      const logout = () => {
        localStorageHelpers.set('auto-logout', 'true');
      };
      window.onpagehide = logout;
    }
  }, [appUser.data, appUser.loading]);

  return <></>;
}
