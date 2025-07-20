import usePost from '../usePost';
import { FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY } from './useGetProviderAppointments';
import { FETCH_PROVIDER_TIMEZONE_QUERY_KEY } from './useGetProviderTimezone';

type UsePutProviderTimezoneParams = {
  payload: {
    timezone: string;
  };
};

export default function usePutProviderTimezone() {
  return usePost<UsePutProviderTimezoneParams>({
    method: 'put',
    path: '/provider/timezone',
    invalidateCacheKeys: [FETCH_PROVIDER_APPOINTMENTS_QUERY_KEY, FETCH_PROVIDER_TIMEZONE_QUERY_KEY],
  });
}
