import usePost from 'api/usePost';
import { FETCH_PROVIDER_ME_QUERY_KEY } from './useFetchProviderMe';

type PatchProviderProfileParams = {
  payload: {
    languages?: string[];
    specialtyIds?: string[];
    minPatientAge?: number;
    timezone?: string;
    bio?: string;
  };
};

export type PatchProviderAppointmentsResult = {
  result: boolean;
};

export default function usePatchProviderProfile() {
  return usePost<PatchProviderProfileParams, PatchProviderAppointmentsResult>({
    path: '/provider/me',
    method: 'patch',
    invalidateCacheKeys: [FETCH_PROVIDER_ME_QUERY_KEY],
  });
}
