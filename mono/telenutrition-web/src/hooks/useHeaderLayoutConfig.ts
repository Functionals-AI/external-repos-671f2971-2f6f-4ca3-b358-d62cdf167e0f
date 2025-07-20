import { useEffect } from 'react';
import { useAppStateContext } from '../state/context';
import { HeaderLayoutConfig } from '../state/types/actions';

/**
 * Sets header layout config for the current page
 */
export default function useHeaderLayoutConfig() {
  const { dispatch } = useAppStateContext();

  useEffect(() => {
    return () => dispatch({ type: 'RESET_HEADER_CONFIG' });
  }, []);

  function setConfig(payload: HeaderLayoutConfig) {
    dispatch({ type: 'SET_HEADER_CONFIG', payload });
  }

  return { setConfig };
}
