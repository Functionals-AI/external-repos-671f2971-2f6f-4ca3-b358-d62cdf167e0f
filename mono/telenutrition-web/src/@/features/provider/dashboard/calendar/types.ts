import { AppointmentRecord } from 'api/types';

export type CalendarBadge =
  | { type: 'first-session' }
  | { type: 'patient-timezone' }
  | { type: 'last-session' };

export type ProviderBookedAppointment = Omit<AppointmentRecord, 'status'> & {
  status: 'f' | '1' | '2' | '3' | '4';
};

export function isAppointmentBooked(
  appointment: AppointmentRecord,
): appointment is ProviderBookedAppointment {
  return ['f', '1', '2', '3', '4'].includes(appointment.status);
}

export type ProviderAvailableAppointmentSlot = Omit<AppointmentRecord, 'status'> & {
  status: 'o';
};

export function isAppointmentSlotAvailable(
  appointment?: AppointmentRecord,
): appointment is ProviderAvailableAppointmentSlot {
  return appointment?.status === 'o';
}

// 30 or 60 minute slot timing type
export type SlotTimingType =
  | { type: 'starting-soon' | 'past' | 'future' }
  | { type: 'in-progress'; currentSecond: number };
