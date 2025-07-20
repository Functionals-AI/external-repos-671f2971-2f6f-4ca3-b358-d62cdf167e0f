'use client';

import ProviderCalendar from './calendar';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ContainerLoading from '@/ui-components/loading/container-loading';
import { useFetchProviderTimezone } from 'api/provider/useGetProviderTimezone';
import { DateTime } from 'luxon';
import useGetAppQueryParam from 'hooks/useGetAppQueryParam';
import { ProviderDashboardContextProvider } from './context';

export default function ProviderDashboardFeatureWrapper() {
  const { isLoading, error, refetch, data } = useFetchProviderTimezone();
  const dateParam = useGetAppQueryParam('d', 'string');

  if (isLoading || dateParam.loading) {
    return <ContainerLoading />;
  }

  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  const dateTime = dateParam.ok ? DateTime.fromISO(dateParam.value, { zone: data.timezone }) : null;
  const defaultDate = dateTime && dateTime.isValid ? dateTime : null;

  return (
    <ProviderDashboardContextProvider timezone={data.timezone} defaultDate={defaultDate}>
      <ProviderCalendar />
    </ProviderDashboardContextProvider>
  );
}
