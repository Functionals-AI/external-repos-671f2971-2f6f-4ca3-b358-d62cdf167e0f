import type { AppointmentEncounterRecord, PatientRecord, ProviderRecord } from '@mono/telenutrition/lib/types';
import { AppointmentRecord } from 'api/types';
import { DateTime } from 'luxon';

interface CreateAppointmentRecordOptions {
  duration?: 60 | 30;
  dateTime: DateTime;
  audioOnly?: boolean;
  status?: AppointmentRecord['status'];
  appointmentTypeId?: number;
  patient?: PatientRecord;
  provider: ProviderRecord;
  appointmentId?: number;
  encounter?: Pick<
    AppointmentEncounterRecord,
    'encounterId' | 'encounterStatus' | 'oversightStatus' | 'createdAt' | 'updatedAt'
  > &
    Partial<Pick<AppointmentEncounterRecord, 'oversightAt' | 'oversightBy' | 'oversightComment'>>;
}

export function createAppointmentRecord({
  dateTime,
  provider,
  duration = 60,
  audioOnly = false,
  status = 'f',
  appointmentTypeId = 2,
  patient = undefined,
  appointmentId,
  encounter,
}: CreateAppointmentRecordOptions): AppointmentRecord {
  return {
    date: dateTime.toFormat('LL/dd/yyyy'),
    startDate: dateTime.toFormat('LL/dd/yyyy'),
    startAt: dateTime.toJSDate().toISOString(),
    startTimestamp: dateTime.toJSDate().toISOString(),
    startTime: dateTime.toFormat('h:mm a ZZZZ'),
    frozen: false,
    isAudioOnly: audioOnly,
    status,
    appointmentTypeId,
    patient,
    patientId: patient?.patientId ?? undefined,
    appointmentId: appointmentId ?? Math.floor(Math.random() * 10000),
    departmentId: 1,
    duration,
    providerId: provider.providerId,
    isFollowUp: true,
    appointmentTypeDisplay: 'Follow Up',
    bookable: status === 'o',
    ...(encounter && { encounter }),
  };
}
