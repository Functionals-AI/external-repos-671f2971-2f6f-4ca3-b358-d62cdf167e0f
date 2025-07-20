import React from 'react'

import Modal from '@/modules/modal/ui/modal';

import ScheduleSelfFlow from '../../flows/schedule-self-flow';
import { HouseholdMemberSchedulable } from 'api/types';


export default function ScheduleVisitSelfModal({patient} : {
  patient: HouseholdMemberSchedulable
}) {
  if (!patient)
    return null
  return (
    <Modal size="xl">
      <ScheduleSelfFlow patient={patient}/>
    </Modal>
  );
}
