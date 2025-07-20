import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import { AppointmentRecord } from './types';
import useGet from './useGet';
import { PatientPaymentMethod } from './types';

type UseGetAppointmentByIdParams = {
  timezone?: string;
  nutriquiz?: boolean;
};

export interface UseGetAppointmentByIdReturn {
  appointment: AppointmentRecord;
  paymentMethod?: PatientPaymentMethod;
  patientPaymentMethods: PatientPaymentMethod[];
  providerName: string;
  lastNutriquizCompletion?: Date;
  hasNutriquiz?: boolean;
}

export default function useGetAppointmentById(params: {
  appointmentId: number;
  headerToken?: string;
  params: UseGetAppointmentByIdParams;
}) {
  return useGet<UseGetAppointmentByIdReturn, UseGetAppointmentByIdParams>({
    path: `/scheduling/appointments/${params.appointmentId}`,
    headerToken: params.headerToken,
    params: params.params,
  });
}

export const getFetchAppointmentByIdQueryKey = (appointmentId: number) => [
  'scheduling',
  'appointments',
  appointmentId,
];

export function useFetchAppontmentById(params: {
  appointmentId: number;
  params: UseGetAppointmentByIdParams;
}) {
  return useFetch<UseFetchTypes<UseGetAppointmentByIdParams, UseGetAppointmentByIdReturn>>({
    path: `/scheduling/appointments/${params.appointmentId}`,
    queryKey: getFetchAppointmentByIdQueryKey(params.appointmentId),
    options: {
      params: params.params,
    },
  });
}
