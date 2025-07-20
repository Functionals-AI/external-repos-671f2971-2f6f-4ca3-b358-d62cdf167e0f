'use client';

import { PatientProfileViewTabs } from '@/features/provider/patient/profile/view';
import SessionDetailsFeature from '@/features/provider/session-details';
import NonDashboardLayout from '@/layouts/non-dashboard';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import Breadcrumbs from '@/ui-components/breadcrumbs';
import { Button } from '@/ui-components/button';
import ButtonBar from '@/ui-components/button/group';
import FullScreenLoading from '@/ui-components/loading/full-screen-loading';
import useFetchAppointmentEncounterInfo, {
  FetchAppointmentEncounterInfoResult,
} from 'api/encounter/useFetchAppointmentEncounterInfo';
import { isAppEncounterDataComplete } from 'api/types';
import useGetAppQueryParam from 'hooks/useGetAppQueryParam';
import { useRouter } from 'next/navigation';
import { Trans, useTranslation } from 'react-i18next';

export default function PageWrapper1() {
  const router = useRouter();
  const appointmentIdResult = useGetAppQueryParam('appointmentId', 'number');

  if (appointmentIdResult.loading) {
    return <FullScreenLoading />;
  }
  if (!appointmentIdResult.ok) {
    router.replace('/schedule/provider/dashboard');
    return <FullScreenLoading />;
  }

  return <PageWrapper2 appointmentId={appointmentIdResult.value} />;
}

function PageWrapper2({ appointmentId }: { appointmentId: number }) {
  const { data, isLoading, error } = useFetchAppointmentEncounterInfo(appointmentId);
  const router = useRouter();

  if (isLoading) {
    return <FullScreenLoading />;
  }
  if (error) {
    router.replace('/schedule/provider/dashboard');
    return <FullScreenLoading />;
  }

  if (!['3', '4'].includes(data.appointmentDetails.appointment.status)) {
    router.replace(
      `/schedule/provider/session/${data.appointmentDetails.appointment.appointmentId}/meeting`,
    );
    return <FullScreenLoading />;
  }

  if (!isAppEncounterDataComplete(data.encounterData)) {
    router.replace(
      `/schedule/provider/session/${data.appointmentDetails.appointment.appointmentId}/meeting`,
    );
    return <FullScreenLoading />;
  }

  return <Page data={data} />;
}

function Page({ data }: { data: FetchAppointmentEncounterInfoResult }) {
  const memberHelpers = useMemberHelpers();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <NonDashboardLayout>
      <NonDashboardLayout.Header
        subTitle={
          <Breadcrumbs
            items={[
              { label: t('Review Session'), link: '/schedule/provider/patients' },
              {
                label: memberHelpers.getDisplayNameFromAppointment({
                  appointment: data.appointmentDetails.appointment,
                }),
                link: `/schedule/provider/patient/${data.appointmentDetails.appointment.patientId}/profile/view`,
              },
            ]}
          />
        }
      />
      <NonDashboardLayout.Content>
        <SessionDetailsFeature data={data} />
      </NonDashboardLayout.Content>
      <NonDashboardLayout.Footer>
        <ButtonBar borderTop className="w-full h-16 p-0 items-center justify-end">
          <ButtonBar.Group>
            <Button
              onClick={() =>
                router.push(
                  `/schedule/provider/patient/${data.appointmentDetails.appointment.patientId}/profile/view?tab=${PatientProfileViewTabs.VISIT_HISTORY}`,
                )
              }
            >
              <Trans>Close</Trans>
            </Button>
          </ButtonBar.Group>
        </ButtonBar>
      </NonDashboardLayout.Footer>
    </NonDashboardLayout>
  );
}
