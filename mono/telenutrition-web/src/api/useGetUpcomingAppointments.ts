import useGet from './useGet';
import { AppointmentRecord } from './types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';

interface UseGetUpcomingAppointmentsParams {
  timezone?: string;
}

export interface UpcomingAppointmentProvider {
  providerId: number;
  firstName: string;
  lastName: string;
  photo: string;
  languages: string[];
  name: string;
  npi?: number;
  oktaId?: string;
  initials: string;
}

export type PatientAppointment = PatientRecord & { appointments: AppointmentRecord[] };

type UseGetUpcomingAppointmentsReturn = {
  patientAppointments: PatientAppointment[];
  providers: UpcomingAppointmentProvider[];
};

export default function useGetUpcomingAppointments(params: UseGetUpcomingAppointmentsParams) {
  return useGet<UseGetUpcomingAppointmentsReturn, UseGetUpcomingAppointmentsParams>({
    path: '/scheduling/appointments-upcoming',
    params,
  });
}
