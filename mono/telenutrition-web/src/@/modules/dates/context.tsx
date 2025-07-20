'use client';

import { PropsWithChildren, createContext, useState } from 'react';

export const TimezoneContext = createContext<{
  timezone: string | null;
  setTimezone: (tz: string) => void;
} | null>(null);

export function TimezoneProvider({ children }: PropsWithChildren<{}>) {
  const [timezone, setTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}
