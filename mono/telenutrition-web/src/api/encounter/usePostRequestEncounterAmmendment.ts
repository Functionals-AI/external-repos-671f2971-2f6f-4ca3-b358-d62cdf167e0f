import usePost from 'api/usePost';

type PostRequestEncounterAmmendmentParams = {
  payload: {
    unitsBilled?: number;
    cptCode?: string;
    reason: string;
    comments: string;
  };
};

export default function usePostRequestEncounterAmmendment({
  encounterId,
}: {
  encounterId: number;
}) {
  return usePost<PostRequestEncounterAmmendmentParams, {}>({
    path: `/appointment-encounter/${encounterId}/amend`,
    method: 'post',
    invalidateCacheKeys: [['appointment-encounter', 'amendments']],
  });
}
