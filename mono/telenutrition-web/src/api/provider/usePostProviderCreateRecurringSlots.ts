import { FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY } from 'api/useGetAppointments';
import usePost from '../usePost';
import { FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY } from './useGetProviderAppointments';
import { DateTime } from 'luxon';

type UsePostProviderCreateRecurringSlotsParams = {
  payload: {
    date: string;
    duration: number;
    weekCount: number;
  };
};

type UsePostProviderCreateRecurringSlotsReturn = {
  appointmentIds: number[];
  conflictedSlots: { startDateTime: DateTime };
};

export default function usePostProviderCreateRecurringSlots() {
  return usePost<
    UsePostProviderCreateRecurringSlotsParams,
    UsePostProviderCreateRecurringSlotsReturn
  >({
    path: '/provider/slots/create/recurring',
    method: 'post',
    invalidateCacheKeys: [
      FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY,
      FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY,
    ],
  });
}
