import { AppointmentRecord } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import ConfirmRescheduledAppointments from '../../shared/confirm-rescheduled-appointments';

interface Props {
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
}

export default function ConfirmStep({ patient, rescheduleAppointment }: Props) {
  return <ConfirmRescheduledAppointments patient={patient} rescheduleAppointment={rescheduleAppointment} />;
}
