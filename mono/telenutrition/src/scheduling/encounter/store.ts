import { IContext } from '@mono/common/lib/context';
import * as db from 'zapatos/db';
import * as zs from 'zapatos/schema';
import { Logger } from '@mono/common/lib';
import { err, ok, Result } from 'neverthrow';
import { ErrCode, ErrCodeError } from '@mono/common/lib/error';
import Appointment from '../appointment';
import { createMapAppointmentRecordFn } from '../appointment/store';
import { AppointmentRecord } from '../appointment/types';
import { ChartingV1Config } from '../questionnaire/questionnaires/charting_v1';
import { DateTime } from 'luxon';
import Provider from '../provider';
import { getAllPatientAttributeOptions } from '../questionnaire/helpers';
import Questionnaire from '../questionnaire';
import { AmendmentReason, AppointmentEncounterRecord, EncounterAmendmentRecord, EncounterAmendmentStatus, EncounterStatus, EncounterOversightStatus } from './shared';
import type { Timestamp } from '../../types/time';

type DbAppointmentEncounter = zs.telenutrition.clinical_encounter.JSONSelectable;
type DbEncounterAmendment = zs.telenutrition.clinical_encounter_amendment.JSONSelectable;

export function mapEncounterAmendmentRecord(record: DbEncounterAmendment): EncounterAmendmentRecord {
  return {
    amendmentId: record.amendment_id,
    encounterId: record.encounter_id,
    unitsBilled: record.units_billed ?? undefined,
    billingCode: record.billing_code ?? undefined,
    reason: (record.reason as AmendmentReason) ?? undefined,
    comments: record.comments ?? undefined,
    status: (record.status as EncounterAmendmentStatus) ?? undefined,
    createdAt: record.created_at,
    resolvedAt: (record.resolved_at as Timestamp) ?? undefined,
    resolvedBy: (record.resolved_by as Timestamp) ?? undefined,
  };
}

export function mapAppointmentEncounterRecord(record: DbAppointmentEncounter): AppointmentEncounterRecord {
  return {
    type: record.encounter_id < 1000000 ? 'historical' : 'app',
    encounterId: record.encounter_id,
    patientId: record.patient_id ?? undefined,
    appointmentId: record.appointment_id ?? undefined,
    departmentId: record.department_id ?? undefined,
    providerId: record.provider_id ?? undefined,
    encounterType: record.encounter_type ?? undefined,
    encounterDate: record.encounter_date ?? undefined,
    actualStarttime: record.actual_starttime ?? undefined,
    encounterStatus: record.encounter_status as EncounterStatus ?? undefined,
    oversightStatus: record.oversight_status as EncounterOversightStatus ?? undefined,
    createdBy: record.created_by ?? undefined,
    assignedTo: record.assigned_to ?? undefined,
    closedDatetime: record.closed_datetime ?? undefined,
    closedBy: record.closed_by ?? undefined,
    deletedDatetime: record.deleted_datetime ?? undefined,
    deletedBy: record.deleted_by ?? undefined,
    specialty: record.specialty ?? undefined,
    billingTabReviewed: record.billing_tab_reviewed ?? undefined,
    documentedBy: record.documented_by ?? undefined,
    closeAttemptedYn: record.close_attempted_yn ?? undefined,
    lastReopened: record.last_reopened ?? undefined,
    lastModified: record.last_modified ?? undefined,
    previouslyClosedDatetime: record.previously_closed_datetime ?? undefined,
    cancelReasonNote: record.cancel_reason_note ?? undefined,
    patientStatusId: record.patient_status_id ?? undefined,
    lastReopenedBy: record.last_reopened_by ?? undefined,
    previouslyClosedBy: record.previously_closed_by ?? undefined,
    specialtyId: record.specialty_id ?? undefined,
    actualEndtime: record.actual_endtime ?? undefined,
    totalMinutes: record.total_minutes ?? undefined,
    unitsBilled: record.units_billed ?? undefined,
    diagnosisCode: record.diagnosis_code ?? undefined,
    billingCode: record.billing_code ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    rawData: record.raw_data as Record<string, any>,
    timerStartedAt: record.timer_started_at ?? undefined,
    timerEndedAt: record.timer_ended_at ?? undefined,
    oversightAt: record.oversight_at ?? undefined,
    oversightBy: record.oversight_by ?? undefined,
    oversightComment: record.oversight_comment ?? undefined,
  };
}

export interface UserEncounterRecord {
  encounterId: number;
  actualStarttime?: Timestamp;
  actualEndtime?: Timestamp;
  noteToMember?: string;
  reasonForVisit?: string;
  providerName?: string;
  providerInitials: string;
  providerPhoto: string;
  patientName: string;
  isAudioOnly: boolean;
}

type UserEncounterDbRow = db.JSONOnlyColsForTable<
  'telenutrition.clinical_encounter',
  ('encounter_id' | 'actual_starttime' | 'created_by' | 'actual_endtime' | 'provider_id' | 'raw_data')[]
>;

export function validateAndMapUserEncounterRecord(
  context: IContext,
  {
    encounterRecord,
    patientName,
    appointment,
  }: {
    encounterRecord: UserEncounterDbRow;
    patientName: string;
    appointment: AppointmentRecord;
  },
): Result<UserEncounterRecord | null, ErrCode> {
  const { logger } = context;

  const TAG = [...MTAG, 'ValidateAndMapUserEncounterRecord'];

  try {
    const rawData: db.JSONObject = encounterRecord.raw_data as db.JSONObject;

    const mainReasonResult = Questionnaire.Service.validateSurveyQuestion(context, {
      value: rawData.main_reason,
      schemaType: 'input:radio-v2',
      nullable: true,
    });

    let mainReason: string | undefined;
    if (mainReasonResult.isErr()) {
      logger.error(context, TAG, 'Failed to map encounter record: main_reason');
    } else {
      mainReason = mainReasonResult.value;
    }
    const reasonOptions = getAllPatientAttributeOptions(context, 'main_reason');

    const reasonForVisit: string | undefined = reasonOptions.find((ro) => ro.value === mainReason)?.label ?? mainReason;

    const noteToMemberResult = Questionnaire.Service.validateSurveyQuestion(context, {
      value: rawData.note_to_member,
      schemaType: 'input:textarea',
      nullable: true,
    });

    let noteToMember: string | undefined;
    if (noteToMemberResult.isErr()) {
      logger.error(context, TAG, 'Failed to map encounter record: note');
    } else {
      noteToMember = noteToMemberResult.value as string;
    }

    const nameTokens = encounterRecord.created_by?.split(' ');
    const providerInitials =
      [nameTokens?.[0]?.charAt(0), nameTokens?.[1]?.charAt(0)].filter((n) => !!n).join(' ') ??
      encounterRecord.created_by?.slice(0, 2);

    return ok({
      encounterId: encounterRecord.encounter_id,
      actualStarttime: encounterRecord.actual_starttime ?? undefined,
      actualEndtime: encounterRecord.actual_endtime ?? undefined,
      noteToMember: noteToMember,
      reasonForVisit,
      providerName: encounterRecord.created_by ?? undefined,
      providerInitials,
      providerPhoto: `https://d1hm90tax3m3th.cloudfront.net/telenutrition/scheduling/providers/${encounterRecord.provider_id}.jpg`,
      patientName: patientName,
      isAudioOnly: appointment.isAudioOnly,
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

const MTAG = Logger.tag();

interface CreateAppointmentEncounterParams {
  appointmentId: number;
  chartingData: Record<string, any>;
  config: ChartingV1Config;
}

interface CreateAppointmentEncounterResult {
  encounter: AppointmentEncounterRecord;
  appointment: AppointmentRecord;
}

export async function createAppointmentEncounter(
  context: IContext,
  params: CreateAppointmentEncounterParams,
): Promise<Result<CreateAppointmentEncounterResult, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;
  const TAG = [...MTAG, 'createAppointmentEncounter'];
  try {
    const pool = await writer();

    const appointmentResult = await Appointment.Store.selectOneAppointment(context, {
      appointmentId: params.appointmentId,
    });

    if (appointmentResult.isErr()) {
      logger.error(context, TAG, 'error getting appointment during submit questionnaire', {
        appointmentId: params.appointmentId,
      });
      return err(ErrCode.NOT_FOUND);
    }

    const appointment = appointmentResult.value;
    if (!appointment.patientId) {
      logger.error(context, TAG, 'appointment does not have a patient', { appointment });
      return err(ErrCode.INVALID_DATA);
    }

    const patientId = appointment.patientId;

    if (appointment.status !== 'f') {
      logger.error(context, TAG, "appointment status must be 'f' to start an encounter", { appointment });
      return err(ErrCode.INVALID_DATA);
    }

    const providerResult = await Provider.Store.fetchProviderBy(context, {
      where: { provider_id: appointment.providerId },
    });

    if (providerResult.isErr()) {
      logger.error(context, TAG, 'provider not found', { providerId: appointment.providerId });
      return err(ErrCode.NOT_FOUND);
    }
    const provider = providerResult.value;

    const txnResult = await db.serializable(pool, async (txn) => {
      const existingEncounter = await db
        .select('telenutrition.clinical_encounter', {
          appointment_id: params.appointmentId,
          encounter_status: db.conditions.ne('deleted'),
        })
        .run(txn);

      if (existingEncounter.length > 0) {
        logger.error(context, TAG, 'encounter already exists for appointment', { appointmentId: params.appointmentId });
        throw new ErrCodeError(ErrCode.INVALID_DATA);
      }

      const encounter = await db
        .insert('telenutrition.clinical_encounter', {
          appointment_id: appointment.appointmentId,
          patient_id: patientId,
          provider_id: appointment.providerId,
          updated_at: new Date(),
          raw_data: params.chartingData,
          encounter_status: 'open',
          department_id: appointment.departmentId,
          encounter_type: 'visit',
          encounter_date: DateTime.now().toFormat('yyyy-LL-dd'),
          created_at: new Date(),
          created_by: provider.name,
        })
        .run(txn);

      const updateAppointment = await db
        .update(
          'telenutrition.schedule_appointment',
          {
            status: '2',
          },
          {
            appointment_id: params.appointmentId,
          },
        )
        .run(txn);

      if (updateAppointment.length !== 1) {
        logger.error(context, TAG, 'Failed to update appointment');
        throw new ErrCodeError(ErrCode.SERVICE);
      }

      const updatedAppointment = updateAppointment[0];

      return ok({ encounter, updatedAppointment });
    });

    if (txnResult.isErr()) {
      logger.error(context, TAG, 'Failed to create appointment encounter');
      return err(ErrCode.SERVICE);
    }

    const { encounter, updatedAppointment } = txnResult.value;

    const mapAppointmentRecordResult = await createMapAppointmentRecordFn(context);

    if (mapAppointmentRecordResult.isErr()) {
      logger.error(context, TAG, 'Failed to map appointment record');
      return err(ErrCode.SERVICE);
    }

    const mapAppointmentRecord = mapAppointmentRecordResult.value;

    return ok({
      encounter: mapAppointmentEncounterRecord(encounter),
      appointment: mapAppointmentRecord({ record: updatedAppointment, timezone: 'US/Pacific' }),
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getAppointmentEncounter(
  context: IContext,
  params: { appointmentId: number } | { encounterId: number },
): Promise<Result<AppointmentEncounterRecord | null, ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getAppointmentEncounter'];
  try {
    const pool = await reader();
    const appointmentEncounter = await db
      .selectOne(
        'telenutrition.clinical_encounter',
        {
          ...('appointmentId' in params && { appointment_id: params.appointmentId }),
          ...('encounterId' in params && { encounter_id: params.encounterId }),
          encounter_status: db.conditions.ne('deleted'),
        },
        {
          order: { by: 'encounter_id', direction: 'DESC' },
        },
      )
      .run(pool);

    if (!appointmentEncounter) {
      return ok(null);
    }

    return ok(mapAppointmentEncounterRecord(appointmentEncounter));
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface GetPastAppEncountersForPatientsParams {
  patientId: number;
  limit?: number;
}

export async function getPastFFDEncountersForPatient(
  context: IContext,
  { patientId, limit = 5 }: GetPastAppEncountersForPatientsParams,
): Promise<Result<AppointmentEncounterRecord[], ErrCode>> {
  const {
    logger,
    store: { reader },
  } = context;
  const TAG = [...MTAG, 'getPastFFDEncountersForPatient'];

  try {
    const pool = await reader();
    const encounters = await db
      .select(
        'telenutrition.clinical_encounter',
        {
          patient_id: patientId,
          encounter_status: 'closed',
          encounter_id: db.conditions.gte(1000000),
        },
        {
          limit,
          order: { by: 'encounter_date', direction: 'DESC' }
        },
      )
      .run(pool);

    return ok(encounters.map(mapAppointmentEncounterRecord));
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export async function getPastAppEncountersForIdentityId(context: IContext, identityId: number) {
  const TAG = [...MTAG, 'getPastAppEncountersForIdentityId'];

  const {
    logger,
    store: { reader },
  } = context;
  try {
    const pool = await reader();

    const patientRecord = await db
      .selectOne(
        'telenutrition.schedule_patient',
        {
          identity_id: identityId,
        },
        {
          lateral: {
            identity: db.selectOne('telenutrition.iam_identity', { identity_id: identityId }),
            clinical_encounter: db.select(
              'telenutrition.clinical_encounter',
              {
                patient_id: db.parent('patient_id'),
                encounter_status: 'closed',
              },
              {
                columns: [
                  'encounter_id',
                  'actual_starttime',
                  'actual_endtime',
                  'created_by',
                  'raw_data',
                  'provider_id',
                ],
                order: {
                  by: 'actual_starttime',
                  direction: 'DESC',
                },
                lateral: {
                  appointment: db.selectExactlyOne('telenutrition.schedule_appointment', {
                    appointment_id: db.parent('appointment_id'),
                  }),
                },
              },
            ),
          },
        },
      )
      .run(pool);

    if (!patientRecord) {
      logger.error(context, TAG, 'Patient record not found with identity Id', { identityId });
      return err(ErrCode.NOT_FOUND);
    }

    const mapAppointmentRecordFnResult = await createMapAppointmentRecordFn(context);
    if (mapAppointmentRecordFnResult.isErr()) {
      logger.error(context, TAG, 'Failed to create map appointment record function');
      return err(ErrCode.SERVICE);
    }
    const mapAppointmentRecord = mapAppointmentRecordFnResult.value;

    return ok(
      patientRecord.clinical_encounter
        .filter((encounter) => encounter.encounter_id >= 1000000)
        .map((encounter) => {
          const encounterResult = validateAndMapUserEncounterRecord(context, {
            encounterRecord: encounter,
            patientName: [patientRecord.identity?.first_name, patientRecord.identity?.last_name]
              .filter((n) => !!n)
              .join(' '),
            appointment: mapAppointmentRecord({ record: encounter.appointment, timezone: 'US/Pacific' }),
          });
          if (encounterResult.isErr()) {
            logger.error(context, TAG, 'Failed to map encounter record');
            return null;
          }
          return encounterResult.value;
        })
        .filter((e) => e),
    );
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface CreateEncounterAmendmentParams {
  encounterId: number;
  unitsBilled?: number;
  cptCode?: string;
  reason: AmendmentReason;
  comments?: string;
}

export async function createAppointmentEncounterAmendment(
  context: IContext,
  params: CreateEncounterAmendmentParams,
): Promise<Result<number, ErrCode>> {
  const {
    logger,
    store: { writer },
  } = context;
  const TAG = [...MTAG, 'createAppointmentEncounterAmendment'];
  try {
    const pool = await writer();
    const insertable: zs.telenutrition.clinical_encounter_amendment.Insertable = {
      encounter_id: params.encounterId,
      ...(params.unitsBilled && { units_billed: params.unitsBilled }),
      ...(params.cptCode && { billing_code: params.cptCode }),
      reason: params.reason,
      ...(params.comments && { comments: params.comments }),
    };

    const row = await db.insert('telenutrition.clinical_encounter_amendment', insertable).run(pool);

    return ok(row.amendment_id);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  createAppointmentEncounter,
  getAppointmentEncounter,
  getPastFFDEncountersForPatient,
  getPastAppEncountersForIdentityId,
  createAppointmentEncounterAmendment,
};
