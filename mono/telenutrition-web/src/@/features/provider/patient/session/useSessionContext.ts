import { FetchAppointmentEncounterInfoAppResult } from 'api/encounter/useFetchAppointmentEncounterInfo';
import { createContext, useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface ISessionContext {
  data: FetchAppointmentEncounterInfoAppResult;
  form: UseFormReturn<any>;
}

export const SessionContext = createContext<ISessionContext | null>(null);

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionContextProvider');
  }
  return context;
}
