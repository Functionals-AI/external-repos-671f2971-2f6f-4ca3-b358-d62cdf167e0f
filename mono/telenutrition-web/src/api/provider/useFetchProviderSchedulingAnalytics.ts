import useFetch, { UseFetchTypes } from 'hooks/useFetch';

type FetchProviderSchedulingAnalyticsParams = {
  startTime: string;
  endTime: string;
};

export type AppointmentAnalyticsRecord = {
  value: number;
  theme: 'statusGreen' | 'blue' | 'pale-green' | 'statusAmber' | 'statusRed' | 'neutral';
  label: string;
};

type GetProviderSchedulingAnalyticsReturn = {
  appointments: AppointmentAnalyticsRecord[];
};

export type FetchProviderSchedulingAnalyticsResult = {
  analytics: GetProviderSchedulingAnalyticsReturn;
};

type Types = UseFetchTypes<
  FetchProviderSchedulingAnalyticsParams,
  FetchProviderSchedulingAnalyticsResult
>;

const getFetchProviderSchedulingAnalyticsQueryKey = (
  params: FetchProviderSchedulingAnalyticsParams,
) => ['provider', 'scheduling-analytics', ...Object.entries(params).flat()];

export default function useFetchProviderSchedulingAnalytics(
  params: FetchProviderSchedulingAnalyticsParams,
) {
  return useFetch<Types>({
    path: '/provider/scheduling-analytics',
    queryKey: getFetchProviderSchedulingAnalyticsQueryKey(params),
    options: {
      params,
    },
  });
}
