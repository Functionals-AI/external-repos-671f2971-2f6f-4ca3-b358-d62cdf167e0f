import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import { UseGetProviderAppointmentsResult } from './useGetProviderAppointments';

type Types = UseFetchTypes<never, UseGetProviderAppointmentsResult>;

export default function useFetchProviderByIdAppointments(providerId: number) {
  return useFetch<Types>({
    path: `/provider/${providerId}/appointments`,
    queryKey: ['provider', 'appointments', providerId],
  });
}
