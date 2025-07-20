import Modal from '@/modules/modal/ui/modal';

import { HouseholdMemberSchedulable } from 'api/types';
import ScheduleOtherKnownFlow from '../../flows/other-known/schedule-flow';

export default function ScheduleWithOtherKnownModal({
  patient,
}: {
  patient: HouseholdMemberSchedulable;
}) {
  
  return (
    <Modal size="lg">
      <ScheduleOtherKnownFlow
        patient={patient}
      />
    </Modal>
  );
}
