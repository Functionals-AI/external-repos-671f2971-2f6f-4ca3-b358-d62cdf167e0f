import ChartAndKey from './chart-and-key';
import { DateTime } from 'luxon';
import { useContext } from 'react';
import { TimezoneContext } from '@/modules/dates/context';
import useFetchProviderSchedulingAnalytics from 'api/provider/useFetchProviderSchedulingAnalytics';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';

export default function TodayAnalyticsDonut() {
  const tzCtz = useContext(TimezoneContext);
  const timezone = tzCtz?.timezone ?? 'America/Los_Angeles';
  const { data, isLoading, error, refetch } = useFetchProviderSchedulingAnalytics({
    startTime: DateTime.now().setZone(timezone).startOf('day').toISO()!,
    endTime: DateTime.now().setZone(timezone).endOf('day').toISO()!,
  });

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay error={error} refetch={refetch} />;

  return <ChartAndKey data={data.analytics.appointments} />;
}
