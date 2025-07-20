import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import { AppointmentRecord } from '../types';

export type ProviderAppointmentDepartment = {
  departmentId: number;
  name: string;
  state: string;
  timezone: string;
};

export type UseGetProviderAppointmentsResult = {
  slots: AppointmentRecord[];
  timezone: string;
  provider: {
    name: string;
  };
  departments: ProviderAppointmentDepartment[];
};

export const FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY = ['provider', 'appointments'];

type UseGetProviderAppointmentsParams = {
  patientId?: number;
};

export function useFetchProviderAppointments(params?: UseGetProviderAppointmentsParams) {
  return useFetch<UseFetchTypes<UseGetProviderAppointmentsParams, UseGetProviderAppointmentsResult>>({
    path: '/provider/appointments',
    queryKey: [
      ...FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY,
      ...(params?.patientId ? [params.patientId] : [])
    ],
    options: {
      params,
    },
  });
}
