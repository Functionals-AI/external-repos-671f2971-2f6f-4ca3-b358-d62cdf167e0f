import useFetch, { UseFetchTypes } from 'hooks/useFetch';

export interface OverbookingSlot {
  startTimestamp: string;
  duration: number;
  count: number;
}

export type FetchProviderOverbookingSlotsResult = {
  vacancies: OverbookingSlot[];
};

export default function useFetchProviderOverbookingSlots() {
  return useFetch<UseFetchTypes<never, FetchProviderOverbookingSlotsResult>>({
    path: '/provider/overbooking/slots',
    queryKey: ['provider', 'overbooking', 'slots'],
    options: {
      backgroundRefetch: true,
    },
  });
}
