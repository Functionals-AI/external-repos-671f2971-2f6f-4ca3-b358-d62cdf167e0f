import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import { UserEncounterRecord } from '../types';

export type getPastEncountersResult = {
  encounters: UserEncounterRecord[]
}

export function useGetPastEncounters() {
  return useFetch<
    UseFetchTypes<{}, getPastEncountersResult>
  >({
    path: '/appointment-encounter/past',
    queryKey: ['appointment-encounter', 'past'],
    options: {},
  });
}
