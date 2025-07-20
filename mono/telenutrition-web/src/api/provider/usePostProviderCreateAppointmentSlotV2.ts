import { FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY } from 'api/useGetAppointments';
import usePost from '../usePost';
import { FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY } from './useGetProviderAppointments';

type UsePostProviderCreateSlotV2Params = {
  payload: {
    date: string;
    duration: number;
  };
};

export default function usePostProviderCreateAppointmentSlotV2() {
  return usePost<UsePostProviderCreateSlotV2Params>({
    path: '/provider/v2/slots/create',
    method: 'post',
    invalidateCacheKeys: [
      FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY,
      FETCH_SCHEDULING_APPOINTMENTS_QUERY_KEY,
    ],
  });
}
