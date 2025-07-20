'use client';

import Container from '@/ui-components/container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui-components/tabs';
import ProfileTab from './tabs/profile';
import AvailabilityTab from './tabs/availability';
import { useTranslation } from 'react-i18next';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ContainerLoading from '@/ui-components/loading/container-loading';
import { useFetchProviderAppointments } from 'api/provider/useGetProviderAppointments';

enum TABS {
  PROFILE = 'profile',
  AVAILABILITY = 'availability',
}

export default function ProfileViewFeature() {
  const { t } = useTranslation();
  const { data, error, isLoading, refetch } = useFetchProviderAppointments();

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  return (
    <Container>
      <ProfileTab />
      {/* <Tabs defaultValue={TABS.PROFILE}>
        <TabsList>
          <TabsTrigger value={TABS.PROFILE} iconName={'patient'}>
            {t('Profile')}
          </TabsTrigger>
          <TabsTrigger value={TABS.AVAILABILITY} iconName={'calendar'}>
            {t('Availability schedule')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={TABS.PROFILE}>
          <ProfileTab />
        </TabsContent>
        <TabsContent value={TABS.AVAILABILITY}>
          <AvailabilityTab providerTimezone={data.timezone} providerAppointments={data.slots} />
        </TabsContent>
      </Tabs> */}
    </Container>
  );
}
