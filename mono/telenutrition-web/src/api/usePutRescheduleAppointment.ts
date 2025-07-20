import { FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY } from 'api/useGetAppointments';
import usePost from './usePost';
import { FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY } from './provider/useGetProviderAppointments';
import type { AppointmentRecord } from '@mono/telenutrition/lib/types';
import { AppointmentCancelReason } from 'api/usePutCancelAppointment';

type UsePutRescheduleAppointmentParams = {
  payload: {
    cid: string;
    oldAppointmentId: number;
    newAppointmentIds: number[];
    cancelReason: AppointmentCancelReason;
  };
};

export default function usePutRescheduleAppointment() {
  return usePost<UsePutRescheduleAppointmentParams, AppointmentRecord>({
    method: 'put',
    path: '/scheduling/appointments/reschedule',
    invalidateCacheKeys: [
      FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY,
      FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY,
      ['provider', 'patients'],
    ],
  });
}
