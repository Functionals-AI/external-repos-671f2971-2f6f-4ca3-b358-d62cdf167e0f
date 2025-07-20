import Modal from '@/modules/modal/ui/modal';
import { AppointmentRecord } from 'api/types';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import RescheduleWithOtherUnknownProviderFlow from '../../../flows/other-unknown/reschedule';


type RescheduleWithOtherUnknownProviderModalProps = {
  patient: PatientRecord;
  rescheduleAppointment: AppointmentRecord;
};

export default function RescheduleWithOtherUnknownProviderModal({
  patient,
  rescheduleAppointment,
}: RescheduleWithOtherUnknownProviderModalProps) {

  return (
    <Modal size="lg">
      <RescheduleWithOtherUnknownProviderFlow patient={patient} rescheduleAppointment={rescheduleAppointment} />
    </Modal>
  );
}
