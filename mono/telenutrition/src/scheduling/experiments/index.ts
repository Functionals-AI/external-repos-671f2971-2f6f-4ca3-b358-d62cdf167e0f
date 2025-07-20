import { PatientRecord } from '../patient/patient-record';
import { states } from '../schema';

type State = (typeof states)[number];

export function patientScheduleByTime(patient: PatientRecord): boolean {
  const onStates: State[] = ['WA', 'OR', 'IL', 'CA', 'AZ', 'VA'];
  if (onStates.includes(patient.state as State)) {
    return true;
  }
  return false;
}

export default { patientScheduleByTime };
