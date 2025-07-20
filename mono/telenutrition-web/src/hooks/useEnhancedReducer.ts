import { Dispatch, useCallback, useReducer, useRef } from 'react';
import { AppState } from '../state/types';
import { Action } from '../state/types/actions';

export const useEnhancedReducer = (
  reducer: Parameters<typeof useReducer>[0],
  initState: Parameters<typeof useReducer>[1],
  initializer?: Parameters<typeof useReducer>[2],
): [AppState, Dispatch<Action>, () => AppState] => {
  const lastState = useRef<ReturnType<typeof reducer>>(initState);
  const getState = useCallback(() => lastState.current, []);
  return [
    ...useReducer(
      (state: Parameters<typeof reducer>[0], action: Parameters<typeof reducer>[1]) =>
        (lastState.current = reducer(state, action)),
      initState,
      initializer,
    ),
    getState,
  ];
};
