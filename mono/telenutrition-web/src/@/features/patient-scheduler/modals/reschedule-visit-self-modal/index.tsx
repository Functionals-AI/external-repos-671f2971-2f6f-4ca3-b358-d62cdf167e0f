import React from 'react';

import Modal from '@/modules/modal/ui/modal';

import { AppointmentRecord } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { DeveloperError } from 'utils/errors';
import RescheduleSelfFlow from '../../flows/reschedule-self-flow';
import { useFetchProviderMe } from 'api/provider/useFetchProviderMe';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDisplay from '@/modules/errors/get-error-display';

export default function RescheduleVisitSelfModal({
  patient,
  rescheduleAppointment,
}: {
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
}) {
  const { data, error, isLoading, refetch } = useFetchProviderMe();

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDisplay refetch={refetch} error={error} />;

  if (!patient) {
    throw new DeveloperError(
      `Cannot reschedule an appointment that does not have a patient: ${JSON.stringify(rescheduleAppointment)}`,
    );
  }
  return (
    <Modal size="lg">
      <RescheduleSelfFlow
        patient={patient}
        rescheduleAppointment={rescheduleAppointment}
        provider={data?.provider}
      />
    </Modal>
  );
}
