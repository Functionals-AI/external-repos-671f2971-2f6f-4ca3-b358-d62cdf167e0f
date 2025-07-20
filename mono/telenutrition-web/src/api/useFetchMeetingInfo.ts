import useFetch, { UseFetchTypes } from 'hooks/useFetch';

type FetchMeetingInfoQueryParams = {
  waitingId: string;
};

type Types = UseFetchTypes<
  FetchMeetingInfoQueryParams,
  { startTimestamp: string; duration: number; meetingExternalLink: string }
>;

export default function useFetchMeetingInfo(params: FetchMeetingInfoQueryParams) {
  return useFetch<Types>({
    path: `/scheduling/meeting/info`,
    options: {
      params,
      backgroundRefetch: true,
    },
    queryKey: ['scheduling', 'meeting', 'info'],
  });
}
