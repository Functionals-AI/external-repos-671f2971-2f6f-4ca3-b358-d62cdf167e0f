import usePost from '../usePost';

type UsePutEncounterVisitTimesParams = {
  payload: {
    startTimestamp?: Date;
    endTimestamp?: Date;
  };
};

export default function usePutEncounterVisitTimes({ encounterId }: { encounterId: number }) {
  return usePost<UsePutEncounterVisitTimesParams>({
    method: 'put',
    path: `/appointment-encounter/${encounterId}/visit`,
  });
}
