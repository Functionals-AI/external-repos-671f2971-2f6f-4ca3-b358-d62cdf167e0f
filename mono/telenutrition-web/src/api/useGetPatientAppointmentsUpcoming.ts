import useGet from './useGet';
import type { AppointmentRecord, PatientRecord } from '@mono/telenutrition/lib/types';
import { UpcomingAppointmentProvider } from './useGetUpcomingAppointments';

type UseGetPatientAppointmentsUpcomingParams = {
  patientId: number;
  timezone: string;
};

interface UseGetPatientAppointmentsUpcomingReturn {
  appointments: AppointmentRecord[];
  providers: UpcomingAppointmentProvider[];
  patient: PatientRecord;
}

export default function useGetPatientAppointmentsUpcoming(
  params: UseGetPatientAppointmentsUpcomingParams,
) {
  return useGet<UseGetPatientAppointmentsUpcomingReturn, UseGetPatientAppointmentsUpcomingParams>({
    path: '/scheduling/patients/appointments-upcoming',
    params,
  });
}
