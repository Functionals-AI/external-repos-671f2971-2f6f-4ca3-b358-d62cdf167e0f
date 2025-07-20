import { EncounterAmendmentRecord } from '@mono/telenutrition/lib/types';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';

type FetchEncounterAmendmentsResult = {
  amendments: EncounterAmendmentRecord[];
};

type Types = UseFetchTypes<never, FetchEncounterAmendmentsResult>;

export default function useFetchEncounterAmendments({ encounterId }: { encounterId: number }) {
  return useFetch<Types>({
    path: `/appointment-encounter/${encounterId}/amendments`,
    queryKey: ['appointment-encounter', 'amendments'],
  });
}
