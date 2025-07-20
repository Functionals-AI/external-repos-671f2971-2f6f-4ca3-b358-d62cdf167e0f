import React from 'react';

import Modal from '@/modules/modal/ui/modal';

import { AppointmentRecord } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import RescheduleFlow from '../../flows/other-known/reschedule-flow';
import { DeveloperError } from 'utils/errors';

export default function RescheduleWithOtherKnownModal({
  patient,
  rescheduleAppointment,
}: {
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
}) {
  if (!patient) {
    throw new DeveloperError(
      `Cannot reschedule an appointment that does not have a patient: ${JSON.stringify(rescheduleAppointment)}`,
    );
  }
  
  return (
    <Modal size="lg">
      <RescheduleFlow
        patient={patient} rescheduleAppointment={rescheduleAppointment} 
      />
    </Modal>
  );
}
