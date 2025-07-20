import { RefObject, createContext, useContext } from 'react';

export type ScrollingGroupRef = {
  element: HTMLDivElement;
  name: string;
};

export type ScrollingGroupContextType = {
  refs: ScrollingGroupRef[];
  addRef: (newRef: ScrollingGroupRef) => void;
  containerRef: RefObject<HTMLDivElement>;
};

const ScrollingGroupContext = createContext<null | ScrollingGroupContextType>(null);

export function ScrollingGroupProvider({
  children,
  ...context
}: ScrollingGroupContextType & { children: React.ReactNode }) {
  return (
    <ScrollingGroupContext.Provider value={context}>{children}</ScrollingGroupContext.Provider>
  );
}

export function useScrollingGroupContext() {
  const context = useContext(ScrollingGroupContext);
  if (!context) {
    throw new Error(`useScrollingGroupContext must be used within a ScrollingGroupContext`);
  }
  return context;
}
