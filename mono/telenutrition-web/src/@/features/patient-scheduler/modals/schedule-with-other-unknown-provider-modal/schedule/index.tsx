import Modal from '@/modules/modal/ui/modal';
import { HouseholdMemberSchedulable } from 'api/types';
import type { PatientRecord, ProviderRecordShort } from '@mono/telenutrition/lib/types';
import { SessionDuration, SessionType } from 'types/globals';
import { AppointmentData } from 'api/useGetAppointments';
import ScheduleWithOtherUnknownProviderFlow from '../../../flows/other-unknown/schedule';

export interface ScheduleWithOtherUnknownProviderFormFields {
  patient: HouseholdMemberSchedulable;
  duration: SessionDuration;
  sessionType: SessionType;
  date: string;
  selectedAppointmentData: AppointmentData;
  selectedProvider: ProviderRecordShort;
}

type ScheduleWithOtherUnknownProviderModalProps = {
  patient: PatientRecord;
};

export default function ScheduleWithOtherUnknownProviderModal({
  patient,
}: ScheduleWithOtherUnknownProviderModalProps) {
  return (
    <Modal size="lg">
      <ScheduleWithOtherUnknownProviderFlow patient={patient}/>
    </Modal>
  );
}
