import useGet, { UseApiHookData } from './useGet';
import { useAppStateContext } from '../state/context';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import type { ProviderRecordShort } from '@mono/telenutrition/lib/types';
import { useMemo } from 'react';

export type LanguageCode = 'EN' | 'ES';

export interface AppointmentData {
  startTimestamp: string; //2022-07-07T11:00:00
  duration: number; //60,
  appointmentIds: number[]; // [400, 401],
}

type DateString = string;
export type GroupedAppointmentsByProvider = {
  date: string;
  appointments: AppointmentData[];
  providerId: number;
};

export type ValidDurationsType = '30-only' | '30-and-60' | '60-only';

export interface UseGetAppointmentsReturn {
  slots: Record<DateString, GroupedAppointmentsByProvider[]>;
  providers: ProviderRecordShort[];
  timezone: string;
  validDurationsType: ValidDurationsType;
}

type UseGetAppointmentParamsBase = {
  providerIds?: string;
  fromTime?: string; // ISO
  toTime?: string; // ISO
  timezone?: string;
};

export type UseGetAppointmentParams = UseGetAppointmentParamsBase &
  (
    | {
        isFollowUp: boolean | string;
        patientId: number | string;
        paymentMethodId?: number;
      }
    | {
        rescheduleForAppointmentId: number;
      }
  );

export default function useGetAppointments(
  params: UseGetAppointmentParams,
): UseApiHookData<UseGetAppointmentsReturn> & { refetch: () => void } {
  const { getAppState } = useAppStateContext();
  const { cid } = getAppState();
  return useGet<UseGetAppointmentsReturn, UseGetAppointmentParams & { cid: string }>({
    path: '/scheduling/appointments',
    params: {
      ...params,
      cid: cid as string,
    },
  });
}

export const FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY = ['scheduling', 'appointments'];

export function useFetchAppointments(params: UseGetAppointmentParams) {
  const { getAppState } = useAppStateContext();
  const { cid } = getAppState();

  const queryKey = useMemo(() => {
    return [
      'scheduling',
      'appointments',
      'rescheduleForAppointmentId' in params
        ? params.rescheduleForAppointmentId
        : JSON.stringify(params),
    ];
  }, [...Object.values(params)]);

  return useFetch<
    UseFetchTypes<UseGetAppointmentParams & { cid: string }, UseGetAppointmentsReturn>
  >({
    path: '/scheduling/appointments',
    queryKey,
    options: {
      params: { ...params, cid: cid as string },
    },
  });
}
