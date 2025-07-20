import { AppointmentRecord, EncounterStatus, EncounterOversightStatus } from 'api/types';
import { DateTime } from 'luxon';

export type AppointmentComputedStatus =
  | 'upcoming'
  | 'current'
  | 'complete'
  | 'incomplete'
  | 'needs-attention'
  | 'canceled'
  | 'oversight'
  | 'provider-response-required';

export function getAppointmentComputedStatus(
  appointment: AppointmentRecord,
): AppointmentComputedStatus | null {
  const now = DateTime.now();
  const apptDateTime = DateTime.fromJSDate(new Date(appointment.startTimestamp));

  if (appointment.status === 'x') {
    return 'canceled';
  }

  if (appointment.status === '3' || appointment.status === '4') {
    if (appointment.encounter) {
      // if historical encounter, always show as complete if status 3 or 4
      if (appointment.encounter.encounterId < 1000000) {
        return 'complete';
      }

      if (        
        (appointment.encounter.oversightStatus === EncounterOversightStatus.PendingReview ||
          appointment.encounter.oversightStatus === EncounterOversightStatus.ProviderChangesMade)
      ) {
        return 'oversight';
      }
      if (
        appointment.encounter.oversightStatus === EncounterOversightStatus.ProviderResponseRequired) {
        return 'provider-response-required';
      }
    }
    return 'complete';
  }

  if (appointment.status === '2') {
    return 'incomplete';
  }

  if (apptDateTime <= now && now <= apptDateTime.plus({ minutes: appointment.duration })) {
    return 'current';
  }

  if (now <= apptDateTime) {
    return 'upcoming';
  }

  // Needs attention because status wasn't correctly updated
  if (appointment.status === '1' || appointment.status === 'f') {
    return 'needs-attention';
  }

  return null;
}
