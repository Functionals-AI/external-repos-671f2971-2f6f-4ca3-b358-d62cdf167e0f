import { HouseholdMemberSchedulable } from 'api/types';
import Confirm from '../../other-unknown/schedule/steps/confirm';

interface Props {
  patient: HouseholdMemberSchedulable;
}

export default function ConfirmStep({ patient }: Props) {
  return <Confirm patient={patient} />;
}
