import { useEffect, useState } from 'react';
import localStorageHelpers from '../utils/localStorageHelpers';
import useLogout from './useLogout';

export default function useCheckAutoLogout() {
  const { logout } = useLogout();
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function run() {
      const autoLogout = localStorageHelpers.get('auto-logout');
      if (autoLogout) {
        localStorageHelpers.remove('auto-logout');
        await logout(null);
      }

      setDone(true);
    }

    run();
  }, []);
  return done;
}
