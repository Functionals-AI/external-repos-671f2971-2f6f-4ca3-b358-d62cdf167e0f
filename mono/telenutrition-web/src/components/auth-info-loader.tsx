import React, { useEffect, useState } from 'react';
import usePostAuthToken from '../api/auth/usePostAuthToken';
import Loading from './loading';
import { useAppStateContext } from '../state/context';

interface AuthInfoLoaderProps {
  children: React.ReactNode;
}

export default function AuthInfoLoader({ children }: AuthInfoLoaderProps) {
  const { post: postAuthToken } = usePostAuthToken();
  const { dispatch, appState } = useAppStateContext();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (appState.auth?.loggedIn) {
      setLoaded(true);
      return;
    }

    postAuthToken({ payload: {} })
      .then((res) => {
        dispatch({ type: 'LOGIN', payload: res.data });
        setLoaded(true);
      })
      .catch(() => {
        dispatch({ type: 'AUTH_FETCH_ATTEMPTED' });
        setLoaded(true);
      });
  }, []);

  return loaded ? <>{children}</> : <Loading />;
}
