'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui-components/tabs';
import InfoTab from './info-tab';
import SessionHistoryTab from './session-history-tab';
import HouseholdTab from './household-tab';
import NonDashboardLayout from '@/layouts/non-dashboard';
import { useFetchProviderPatientById } from 'api/provider/useGetProviderPatient';
import Breadcrumbs from '@/ui-components/breadcrumbs';
import ButtonBar from '@/ui-components/button/group';
import { Button } from '@/ui-components/button';
import { Trans, useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ContainerLoading from '@/ui-components/loading/container-loading';
import { useFetchProviderPatients } from 'api/provider/useFetchProviderPatients';
import useMemberHelpers from '@/modules/member/useMemberHelpers';

export enum PatientProfileViewTabs {
  INFO = 'info',
  VISIT_HISTORY = 'visit_history',
  HOUSEHOLD = 'household',
}

export default function PatientProfileViewFeature({
  patientId,
  defaultTab = PatientProfileViewTabs.INFO,
}: {
  patientId: number;
  defaultTab?: PatientProfileViewTabs;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const memberHelpers = useMemberHelpers();
  const { data, isLoading, error, refetch } = useFetchProviderPatientById({ patientId });
  const {
    data: households,
    error: householdsFetchError,
    isLoading: isHouseholdsLoading,
    refetch: refetchHouseholds,
  } = useFetchProviderPatients();

  if (isLoading || isHouseholdsLoading) {
    return <ContainerLoading />;
  }
  if (error) {
    return <GetErrorDislpay refetch={refetch} error={error} />;
  }
  if (householdsFetchError) {
    return <GetErrorDislpay refetch={refetchHouseholds} error={householdsFetchError} />;
  }

  const household = households.filter((household) =>
    household.members.find((patient) => patient.patientId === patientId),
  )[0];

  const accountHolder = household.members.find(
    (member) => member.identityId === household.identityId,
  );

  return (
    <NonDashboardLayout>
      <NonDashboardLayout.Header
        subTitle={
          <Breadcrumbs
            items={[
              { label: t('Member management'), link: '/schedule/provider/patients' },
              { label: memberHelpers.getDisplayNameForPatient(data.patient).value },
            ]}
          />
        }
      />
      <NonDashboardLayout.Content className="overflow-y-scroll">
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value={PatientProfileViewTabs.INFO} iconName="patient-card">
              {t('Member information')}
            </TabsTrigger>
            <TabsTrigger value={PatientProfileViewTabs.VISIT_HISTORY} iconName="calendar-history">
              {t('Visit history')}
            </TabsTrigger>
            {household && accountHolder && (
              <TabsTrigger value={PatientProfileViewTabs.HOUSEHOLD} iconName="household">
                {t('Household')}
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value={PatientProfileViewTabs.INFO}>
            <InfoTab patientId={patientId} />
          </TabsContent>
          <TabsContent value={PatientProfileViewTabs.VISIT_HISTORY}>
            <SessionHistoryTab patient={data.patient} />
          </TabsContent>
          {household && accountHolder && (
            <TabsContent value={PatientProfileViewTabs.HOUSEHOLD}>
              <HouseholdTab accountHolder={accountHolder} household={household} />
            </TabsContent>
          )}
        </Tabs>
      </NonDashboardLayout.Content>
      <NonDashboardLayout.Footer>
        <ButtonBar borderTop className="w-full h-16 p-0 items-center justify-end">
          <ButtonBar.Group>
            <Button
              variant="secondary"
              onClick={() => {
                router.push(`/schedule/provider/patient/${patientId}/profile/edit`);
              }}
            >
              <Trans>Edit member</Trans>
            </Button>
            <Button onClick={() => router.push('/schedule/provider/patients')}>{t('Done')}</Button>
          </ButtonBar.Group>
        </ButtonBar>
      </NonDashboardLayout.Footer>
    </NonDashboardLayout>
  );
}
