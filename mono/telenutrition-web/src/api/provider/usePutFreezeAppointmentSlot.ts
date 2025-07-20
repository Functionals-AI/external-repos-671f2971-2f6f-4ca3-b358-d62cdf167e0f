import { FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY } from 'api/useGetAppointments';
import usePost from '../usePost';
import { FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY } from './useGetProviderAppointments';

type UsePutFreezeAppointmentSlotParams = {
  payload: {
    appointmentIds: number[];
  };
};

export default function usePutFreezeAppointmentSlot() {
  return usePost<UsePutFreezeAppointmentSlotParams>({
    method: 'put',
    path: '/provider/slots/freeze',
    invalidateCacheKeys: [
      FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY,
      FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY,
    ],
  });
}
