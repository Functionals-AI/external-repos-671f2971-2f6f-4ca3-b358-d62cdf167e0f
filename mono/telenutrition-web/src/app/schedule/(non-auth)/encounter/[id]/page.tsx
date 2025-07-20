'use client';

import ChartingNotes from '@/features/provider/session-details/charting-notes';
import NonDashboardLayout from '@/layouts/non-dashboard';
import { SUPPORT_LINK } from '@/modules/errors/get-error-display';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { ReportIssueButton } from '@/smart-components/report-issue-button';
import Breadcrumbs from '@/ui-components/breadcrumbs';
import { Button } from '@/ui-components/button';
import Card from '@/ui-components/card';
import ContainerLoading from '@/ui-components/loading/container-loading';
import useFetchCompletedAppointmentEncounterInfo from 'api/encounter/useFetchCompletedAppointmentEncounterInfo';
import { ApiGetError } from 'api/useGet';
import useGetAppQueryParam from 'hooks/useGetAppQueryParam';
import { Trans, useTranslation } from 'react-i18next';

export default function EncounterViewOnlyPageWrapper() {
  const tokenResult = useGetAppQueryParam('token', 'string');
  const encounterIdResult = useGetAppQueryParam('id', 'number');

  if (tokenResult.loading || encounterIdResult.loading) {
    return <ContainerLoading />;
  }
  if (!tokenResult.ok || !encounterIdResult.ok) {
    return <PageNotAccessible />;
  }

  return <EncounterViewOnlyPage token={tokenResult.value} encounterId={encounterIdResult.value} />;
}

function EncounterViewOnlyPage({ token, encounterId }: { token: string; encounterId: number }) {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useFetchCompletedAppointmentEncounterInfo(
    encounterId,
    token,
  );
  const memberHelpers = useMemberHelpers();

  if (isLoading) {
    return <ContainerLoading />;
  }

  if (error) {
    return <PageNotAccessible refetch={refetch} error={error} />;
  }

  if (!['3', '4'].includes(data.appointment.status)) {
    return <PageNotAccessible />;
  }

  return (
    <NonDashboardLayout>
      <NonDashboardLayout.Header
        logoAsButton={false}
        subTitle={
          <Breadcrumbs
            items={[
              { label: t('Review Session') },
              {
                label: memberHelpers.getDisplayNameFromAppointment({
                  appointment: data.appointment,
                }),
              },
            ]}
          />
        }
      />
      <NonDashboardLayout.Content>
        <ChartingNotes readOnly appointment={data.appointment} encounterData={data.encounterData} />
      </NonDashboardLayout.Content>
      <NonDashboardLayout.Footer>
        <div />
      </NonDashboardLayout.Footer>
    </NonDashboardLayout>
  );
}

function PageNotAccessible({ refetch, error }: { refetch?: () => void; error?: ApiGetError }) {
  return (
    <NonDashboardLayout>
      <NonDashboardLayout.Header logoAsButton={false} />
      <NonDashboardLayout.Content className="bg-neutral-100 flex items-center justify-center h-full">
        <Card className="w-fit py-20 px-8 flex flex-col gap-y-4 items-center">
          <div className="flex flex-col gap-y-4 items-center justify-center">
            <h1 className="text-3xl">
              <Trans>Page not accessible</Trans>
            </h1>
            <p>
              <Trans>You do not have access to this page.</Trans>
            </p>
          </div>
          {error?.message && <p>{error.message}</p>}
          {error?.trace && <p>Trace ID: {error.trace}</p>}
          <div className="flex gap-x-8">
            <Button variant="secondary" onClick={() => window.open(SUPPORT_LINK, '_blank')}>
              <Trans>Contact support</Trans>
            </Button>
            <ReportIssueButton error={error} />
            {refetch && (
              <Button onClick={refetch}>
                <Trans>Try again</Trans>
              </Button>
            )}
          </div>
        </Card>
      </NonDashboardLayout.Content>
      <NonDashboardLayout.Footer>
        <div />
      </NonDashboardLayout.Footer>
    </NonDashboardLayout>
  );
}
