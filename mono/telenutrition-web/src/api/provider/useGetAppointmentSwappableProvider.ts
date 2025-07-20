import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import type { ProviderRecord } from '@mono/telenutrition/lib/types';

export type SwappableProvider = {
  provider: ProviderRecord;
  appointmentIds: number[];
};

export type UseGetAppointmentSwappableProvidersReturn = {
  recommendedSwap?: SwappableProvider;
  allSwappable: SwappableProvider[];
};

export function useFetchAppointmentSwappableProviders(appointmentId: number) {
  return useFetch<UseFetchTypes<never, UseGetAppointmentSwappableProvidersReturn>>({
    path: `/scheduling/appointments/${appointmentId}/swap-provider`,
    queryKey: ['scheduling', 'appointments', appointmentId, 'swap-provider'],
  });
}
