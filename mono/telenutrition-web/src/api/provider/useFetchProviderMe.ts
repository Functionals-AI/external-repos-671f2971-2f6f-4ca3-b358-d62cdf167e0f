import { ProviderLicenseApplicationRecord, ProviderLicenseRecord } from 'api/types';
import type { ProviderRecord } from '@mono/telenutrition/lib/types';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';

type ProviderFeatures = {
  canScheduleOverbookSlots: boolean;
};

export type FetchProviderMeResult = {
  provider: ProviderRecord;
  licenseSummary: {
    licenses?: (ProviderLicenseRecord & { isValid: boolean })[];
    applications?: (ProviderLicenseApplicationRecord & { isValid: boolean })[];
  };
  features: ProviderFeatures;
  intercomHash: string;
};

export type Types = UseFetchTypes<never, FetchProviderMeResult>;

export const path = '/provider/me';

export const FETCH_PROVIDER_ME_QUERY_KEY = ['provider', 'me'];

export function useFetchProviderMe() {
  return useFetch<Types>({ path, queryKey: FETCH_PROVIDER_ME_QUERY_KEY });
}
