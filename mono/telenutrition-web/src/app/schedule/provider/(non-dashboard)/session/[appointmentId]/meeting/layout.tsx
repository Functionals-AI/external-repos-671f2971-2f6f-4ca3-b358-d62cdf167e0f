'use client';

import { SessionContext } from '@/features/provider/patient/session/useSessionContext';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import { useForm } from '@/modules/form/form';
import ContainerLoading from '@/ui-components/loading/container-loading';
import FullScreenLoading from '@/ui-components/loading/full-screen-loading';
import useFetchAppointmentEncounterInfo, {
  FetchAppointmentEncounterInfoAppResult,
  FetchAppointmentEncounterInfoResult,
} from 'api/encounter/useFetchAppointmentEncounterInfo';
import { EncounterStatus, EncounterOversightStatus, isAppEncounterData } from 'api/types';
import useGetAppQueryParam from 'hooks/useGetAppQueryParam';
import useToaster from 'hooks/useToaster';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// Load appointmentDetails and determine where user should be routed

export default function PageWrapper1({ children }: { children: ReactNode }) {
  const router = useRouter();
  const appointmentIdResult = useGetAppQueryParam('appointmentId', 'number');

  if (appointmentIdResult.loading) {
    return <FullScreenLoading />;
  }
  if (!appointmentIdResult.ok) {
    router.replace('/schedule/provider/dashboard');
    return <FullScreenLoading />;
  }

  return (
    <SessionPageWrapper2 appointmentId={appointmentIdResult.value}>{children}</SessionPageWrapper2>
  );
}

function SessionPageWrapper2({
  appointmentId,
  children,
}: {
  appointmentId: number;
  children: ReactNode;
}) {
  const { data, isLoading, error, refetch } = useFetchAppointmentEncounterInfo(appointmentId);

  if (isLoading) {
    return <FullScreenLoading />;
  }
  if (error) {
    return <GetErrorDislpay error={error} refetch={refetch} />;
  }

  return <SessionPageWrapper3 data={data}>{children}</SessionPageWrapper3>;
}

function SessionPageWrapper3({
  children,
  data,
}: {
  children: ReactNode;
  data: FetchAppointmentEncounterInfoResult;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const toaster = useToaster();

  const {
    appointmentDetails: { appointment },
  } = data;

  if (appointment.status === 'x' || appointment.status === 'o') {
    const reason = (() => {
      if (appointment.status === 'x') {
        return t('This appointment has been cancelled');
      }
      if (appointment.status === 'o') {
        return t('This appointment does not have a session with a patient');
      }

      return t('An unknown error as occurred');
    })();

    toaster.info({ title: t('Cannot access session page'), message: reason });
    router.replace('/schedule/provider/dashboard');
    return <ContainerLoading />;
  }

  if (['3', '4'].includes(appointment.status)) {
    if (
      data.encounterData.type !== 'app' ||
        data.encounterData.encounter?.oversightStatus !== EncounterOversightStatus.ProviderResponseRequired
    ) {
      router.replace(`/schedule/provider/session/${appointment.appointmentId}/details`);
      return <ContainerLoading />;
    }
  }

  if (!isAppEncounterData(data.encounterData)) {
    router.replace(`/schedule/provider/session/${appointment.appointmentId}/details`);
    return <ContainerLoading />;
  }

  return (
    <SessionPage data={data as FetchAppointmentEncounterInfoAppResult}>{children}</SessionPage>
  );
}

function SessionPage({
  data,
  children,
}: {
  data: FetchAppointmentEncounterInfoAppResult;
  children: ReactNode;
}) {
  const form = useForm({
    defaultValues:
      data.encounterData.encounter?.rawData ?? data.encounterData.chartingConfig.defaultValues,
  });

  return <SessionContext.Provider value={{ data, form }}>{children}</SessionContext.Provider>;
}
