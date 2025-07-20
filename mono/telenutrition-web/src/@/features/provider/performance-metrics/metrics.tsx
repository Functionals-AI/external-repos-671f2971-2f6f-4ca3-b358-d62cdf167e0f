import Card from '@/ui-components/card';
import useFetchProviderPerformanceMetrics, {
  ProviderMetricsDateRangeType,
} from 'api/provider/useFetchProviderPerformanceMetrics';
import { useContext, useEffect } from 'react';
import MetricCard from './metric-card';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import { Badge } from '@/ui-components/badge';
import UnitsBilledChart from './units-billed-chart';
import { TimezoneContext } from '@/modules/dates/context';
import Dot from '@/icons/dot';
import { cn } from '@/utils';
import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

function isValidNumber(value?: number | null): value is number {
  if (value === null || value === undefined) return false;

  return !isNaN(value);
}

type MetricsProps =
  | {
      metricsDateRangeConfig: ProviderMetricsDateRangeType.Custom;
      startDate: string;
      endDate: string;
    }
  | {
      metricsDateRangeConfig: Exclude<
        ProviderMetricsDateRangeType,
        ProviderMetricsDateRangeType.Custom
      >;
    };

export default function Metrics(props: MetricsProps) {
  const timezone = useContext(TimezoneContext)?.timezone ?? 'America/Los_Angeles';
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useFetchProviderPerformanceMetrics({
    timezone,
    ...props,
  });

  useEffect(() => {
    refetch();
  }, [props]);

  if (isLoading) return <ContainerLoading />;

  if (error) return <GetErrorDislpay error={error} refetch={refetch} />;

  const getLabel = () => {
    switch (props.metricsDateRangeConfig) {
      case ProviderMetricsDateRangeType.Today:
        return t('Today');
      case ProviderMetricsDateRangeType.WeekToDate:
        return t('Week to date');
      case ProviderMetricsDateRangeType.MonthToDate:
        return `${DateTime.fromISO(data.endDate).toFormat('LLLL')} (to date)`;
      case ProviderMetricsDateRangeType.LastMonth:
        return `${DateTime.fromISO(data.endDate).toFormat('LLLL')}`;
      case ProviderMetricsDateRangeType.Custom:
        return t('Custom period');
    }
  };

  const getDeltaLabel = () => {
    switch (props.metricsDateRangeConfig) {
      case ProviderMetricsDateRangeType.Today:
        return null;
      case ProviderMetricsDateRangeType.WeekToDate:
        return t('vs previous week');
      case ProviderMetricsDateRangeType.MonthToDate:
        return t(`vs last month`);
      case ProviderMetricsDateRangeType.LastMonth:
        return t(`vs previous month`);
      case ProviderMetricsDateRangeType.Custom:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full h-[30rem] p-4 pb-7 flex gap-x-4">
        <div className="flex flex-col gap-y-1 min-w-[15rem]">
          <h4 className="text-neutral-600 text-xl">
            <Trans>Total units billed</Trans>
          </h4>
          <p className="text-neutral-1500 text-4xl">{data.totalUnitsBilled}</p>
          <p className="text-neutral-600 text-base">{getLabel()}</p>
          <div className="flex flex-col gap-y-1">
            <span className="flex gap-x-2 items-center">
              <Dot className={cn('bg-fs-green-200')} />
              <p>
                <Trans>Units billed</Trans>
              </p>
            </span>
          </div>
        </div>
        <UnitsBilledChart chartData={data} dateRangeType={props.metricsDateRangeConfig} />
      </Card>
      <div className="flex gap-x-4">
        <MetricCard
          className="w-full"
          title={t('Units billed per business day')}
          value={
            isValidNumber(data.unitsBilledPerBusinessDay) ? data.unitsBilledPerBusinessDay : 'N/A'
          }
          tooltip={t(
            'Total units billed divided by business days per month (excluding company holidays). This metric does not remove PTO from business days in the calculation.',
          )}
          extra={
            data.unitsBilledPerBDayDiff ? (
              <>
                <Badge
                  leftIconName={
                    data.unitsBilledPerBDayDiff > 0 ? 'trending-up' : 'trending-down'
                  }
                  variant={data.unitsBilledPerBDayDiff > 0 ? 'statusGreen' : 'statusRed'}
                >
                  {Math.abs(data.unitsBilledPerBDayDiff)}
                </Badge>
                {` ${getDeltaLabel()}`}
              </>
            ) : undefined
          }
        />
        <MetricCard
          className="w-full"
          title={t('Units billed per completed visit')}
          value={
            isValidNumber(data.unitsBilledPerCompletedVisits)
              ? data.unitsBilledPerCompletedVisits
              : 'N/A'
          }
          tooltip={t(
            'Total units billed divided by total visits that have been completed and not canceled.',
          )}
          extra={
            data.unitsBilledPerCVDiff ? (
              <>
                <Badge
                  leftIconName={
                    data.unitsBilledPerCVDiff > 0 ? 'trending-up' : 'trending-down'
                  }
                  variant={data.unitsBilledPerCVDiff > 0 ? 'statusGreen' : 'statusRed'}
                >
                  {Math.abs(data.unitsBilledPerCVDiff)}
                </Badge>
                {` ${getDeltaLabel()}`}
              </>
            ) : undefined
          }
        />
      </div>
      <div className="flex gap-x-4">
        <MetricCard
          className="w-[calc(50%-8px)]"
          title={t('Member persistence')}
          tooltip={
            <>
              {t(
                'Completing a 2nd visit shows your ability to demonstrate the value of RD services',
              )}
              <br />
              {t(
                'Calculation: % of your quarterly initial visits with a completed follow-up visit',
              )}
            </>
          }
          value={
            isValidNumber(data.patientPersistenceRate)
              ? `${(data.patientPersistenceRate * 100).toFixed(1)}%`
              : 'N/A'
          }
        />
      </div>
    </div>
  );
}
