import { createContext, useContext, ReactNode } from 'react';
import { UseThreadReturn } from './types';
import { DeveloperError } from 'utils/errors';

type ThreadContextType = UseThreadReturn;

export const ThreadContext = createContext<ThreadContextType | null>(null);

export const ThreadProvider = (props: ThreadContextType & { children: ReactNode }) => {
  const { children, ...providerProps } = props;
  return <ThreadContext.Provider value={{ ...providerProps }}>{children}</ThreadContext.Provider>;
};

export const useThreadContext = () => {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new DeveloperError('ThreadContext must be used within a Thread');
  }
  return context;
};
