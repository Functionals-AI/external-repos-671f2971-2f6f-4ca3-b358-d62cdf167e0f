import { AppointmentRecord } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { createContext, useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { DeveloperError } from 'utils/errors';
import { RescheduleCalendarFormFields } from '.';

export enum RecurringValue {
  NEVER = 'never',
  REPEATS = 'repeats',
}

export enum TimezoneDisplayValue {
  LOCAL = 'local',
  PATIENT = 'patient',
}

export interface TimeslotSelectorConfig {
  hideUnfreezeButton: boolean;
}

export const DEFAULT_CONFIG: TimeslotSelectorConfig = {
  hideUnfreezeButton: false,
};

interface IRescheduleCalendarContext {
  form: UseFormReturn<RescheduleCalendarFormFields>;
  rescheduleAppointment: Omit<AppointmentRecord, 'patient'> & { patient: PatientRecord };
  appointmentsByDate: Record<string, AppointmentRecord[]>;
  providerTimezone: string;
  config: TimeslotSelectorConfig;
}

export const RescheduleCalendarContext = createContext<IRescheduleCalendarContext | undefined>(
  undefined,
);

export function useRescheduleCalendarContext() {
  const context = useContext(RescheduleCalendarContext);
  if (context === undefined) {
    throw new DeveloperError(
      'useRescheduleCalendarContext must be used within a RescheduleListContext',
    );
  }
  return context;
}
