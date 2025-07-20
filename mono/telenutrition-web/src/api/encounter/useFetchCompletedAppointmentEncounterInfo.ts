import { AppointmentRecord, CompleteAppEncounterData } from 'api/types';
import useFetch, { UseFetchTypes } from 'hooks/useFetch';

export type FetchCompletedAppointmentEncounterInfoResult = {
  appointment: AppointmentRecord;
  encounterData: CompleteAppEncounterData;
};
type Types = UseFetchTypes<never, FetchCompletedAppointmentEncounterInfoResult>;

export default function useFetchCompletedAppointmentEncounterInfo(
  encounterId: number,
  token: string,
) {
  return useFetch<Types>({
    path: `/appointment-encounter/info/${encounterId}/complete`,
    queryKey: ['appointment-encounter', 'info', 'complete'],
    options: {
      headerToken: token,
    },
  });
}
