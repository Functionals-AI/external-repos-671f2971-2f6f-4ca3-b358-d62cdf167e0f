'use client';

import NonDashboardLayout from '@/layouts/non-dashboard';
import { Button } from '@/ui-components/button';
import ButtonBar from '@/ui-components/button/group';
import { useFetchAppontmentById } from 'api/useGetAppointmentById';
import { Trans } from 'react-i18next';
import SessionDisplay from './display';
import ContainerLoading from '@/ui-components/loading/container-loading';
import useFetchProviderAppointmentDetail from 'api/provider/useFetchProviderAppointmentDetail';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import { useRouter } from 'next/navigation';

interface PatientSessionAlphaFeatureProps {
  appointmentId: number;
}

export default function PatientSessionAlphaFeature({
  appointmentId,
}: PatientSessionAlphaFeatureProps) {
  const router = useRouter();
  const fetchAppointmentById = useFetchAppontmentById({
    params: {
      nutriquiz: true,
    },
    appointmentId,
  });
  const fetchProviderAppointmentDetail = useFetchProviderAppointmentDetail(appointmentId, {
    experimental: true,
  });

  return (
    <NonDashboardLayout>
      <NonDashboardLayout.Header></NonDashboardLayout.Header>
      <NonDashboardLayout.Content className="overflow-y-scroll">
        {fetchAppointmentById.isLoading || fetchProviderAppointmentDetail.isLoading ? (
          <ContainerLoading />
        ) : fetchAppointmentById.error ? (
          <GetErrorDislpay
            error={fetchAppointmentById.error}
            refetch={fetchAppointmentById.refetch}
          />
        ) : fetchProviderAppointmentDetail.error ? (
          <GetErrorDislpay
            error={fetchProviderAppointmentDetail.error}
            refetch={fetchProviderAppointmentDetail.refetch}
          />
        ) : fetchAppointmentById.data.appointment.status === 'x' ? (
          <div>
            <Trans>This appointment has already been canceled</Trans>
          </div>
        ) : (
          <SessionDisplay
            appointmentById={fetchAppointmentById.data}
            appointmentDetail={fetchProviderAppointmentDetail.data}
          />
        )}
      </NonDashboardLayout.Content>
      <NonDashboardLayout.Footer>
        <ButtonBar borderTop className="w-full h-16 px-2 py-1 items-center justify-end">
          <Button onClick={() => router.push('/schedule/provider/dashboard')}>
            <Trans>Finish</Trans>
          </Button>
        </ButtonBar>
      </NonDashboardLayout.Footer>
    </NonDashboardLayout>
  );
}
