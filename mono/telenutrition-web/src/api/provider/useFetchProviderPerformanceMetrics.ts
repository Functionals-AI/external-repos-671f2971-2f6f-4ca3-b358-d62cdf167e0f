import useFetch, { UseFetchTypes } from 'hooks/useFetch';
import type { DailyUnitsBilled } from '@mono/telenutrition/lib/types';

export enum ProviderMetricsDateRangeType {
  MonthToDate = 'month_to_date',
  WeekToDate = 'week_to_date',
  LastMonth = 'last_month',
  Today = 'today',
  Custom = 'custom',
}

type CustomDateRangeMetricsParams = {
  startDate: string;
  endDate: string;
  timezone: string;
  metricsDateRangeConfig: ProviderMetricsDateRangeType.Custom;
};

type FetchProviderPerformanceMetricsParams =
  | CustomDateRangeMetricsParams
  | {
      timezone: string;
      metricsDateRangeConfig: Exclude<
        ProviderMetricsDateRangeType,
        ProviderMetricsDateRangeType.Custom
      >;
    };

export type FetchProviderPerformanceMetricsResult = {
  unitsBilledByDay: DailyUnitsBilled[];
  startDate: string;
  endDate: string;
  comparisonStartDate: string | null;
  comparisonEndDate: string | null;
  totalUnitsBilled: number;
  unitsBilledPerBusinessDay: number;
  unitsBilledPerCompletedVisits: number | null;
  patientPersistenceRate: number | null;
  unitsBilledPerBDayDiff?: number | null;
  unitsBilledPerCVDiff?: number | null;
};

type Types = UseFetchTypes<
  FetchProviderPerformanceMetricsParams,
  FetchProviderPerformanceMetricsResult
>;

export default function useFetchProviderPerformanceMetrics(
  params: FetchProviderPerformanceMetricsParams,
) {
  return useFetch<Types>({
    path: '/provider/performance-metrics',
    queryKey: ['provider', 'performance-metrics', params.metricsDateRangeConfig],
    options: {
      params,
    },
  });
}
