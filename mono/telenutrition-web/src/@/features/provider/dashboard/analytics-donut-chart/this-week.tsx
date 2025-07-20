import ChartAndKey from './chart-and-key';
import { DateTime } from 'luxon';
import { useContext } from 'react';
import { TimezoneContext } from '@/modules/dates/context';
import useFetchProviderSchedulingAnalytics from 'api/provider/useFetchProviderSchedulingAnalytics';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';

export default function ThisWeekAnalyticsDonut() {
  const tzCtz = useContext(TimezoneContext);
  const timezone = tzCtz?.timezone ?? 'America/Los_Angeles';
  const { data, isLoading, error, refetch } = useFetchProviderSchedulingAnalytics({
    startTime: DateTime.now().setZone(timezone).startOf('week').toISO()!,
    endTime: DateTime.now().setZone(timezone).endOf('week').toISO()!,
  });

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay error={error} refetch={refetch} />;

  return <ChartAndKey data={data.analytics.appointments} />;
}
