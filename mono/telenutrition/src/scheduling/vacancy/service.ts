import { IContext } from '@mono/common/lib/context';
import { ErrCode, ErrCodeError } from '@mono/common/lib/error';
import { Result, err, ok } from 'neverthrow';
import * as db from 'zapatos/db';
import * as zs from 'zapatos/schema';
import { Logger } from '@mono/common';
import Appointment from '../appointment';
import Provider from '../provider';
import * as _ from 'lodash';
import { AppointmentMeeting, AppointmentRecord } from '../appointment/types';
import { ACCOUNTS_ALLOWED_FOR_PENDING_LICENSE, INSURANCE_ALLOWED_FOR_PENDING_LICENSE } from '../provider/service';
import { AppointmentMeetingDbRecord, createMapAppointmentRecordFn, formatMeetingData, mapBaseAppointmentRecord, queryConflictingAppointmentsForProvider } from '../appointment/store';
import { buildSchedulingParams } from '../appointment/service';
import Zoom, { ZoomMeeting } from '../zoom';
import { createWaitingLink, fetchAvailableProviderSlotsForBooking, RankedProviderSlot } from '../service';
import { DateTime } from 'luxon';
import { sendAppointmentUpdateEvent } from '../sync';

const MTAG = Logger.tag();
const MEETING_CODE_REGEX = /.*\/l\/(.+)/;

function getMeetingCode(meeting: AppointmentMeeting) {
  return meeting.shortLink.match(MEETING_CODE_REGEX)?.[1]
}

export async function getProvidersForVacantAppointment(
  context: IContext,
  params: {
    appointmentId: number;
    providerIds?: number[];
    onlyActiveProviders?: boolean,
    fromAssigned?: boolean
  },
): Promise<Result<{ slots: RankedProviderSlot[]; appointment: AppointmentRecord, providerIds: number[] }, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'getProvidersForVacantAppointment'];

  const { appointmentId, providerIds, fromAssigned } = params;

  try {
    const existingAppointmentResult = await Appointment.Service.getAppointment(context, { appointmentId });
    if (existingAppointmentResult.isErr()) {
      logger.error(context, TAG, 'error getting appointment', { appointmentId });
      return err(ErrCode.SERVICE);
    }
    const existingAppointment = existingAppointmentResult.value;

    if (!fromAssigned && existingAppointment.providerId) {
      logger.info(context, TAG, `Appointment is not vacant and currently assigned to provider`, {
        appointmentId: appointmentId,
        providerId: existingAppointment.providerId,
      });
      return err(ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING);
    }
    if (!['f', 'i'].includes(existingAppointment.status)) {
      logger.error(context, TAG, `Unexpected appointment status`, {
        appointmentId,
        status: existingAppointment.status,
      });
      return err(ErrCode.STATE_VIOLATION);
    }
    const patient = existingAppointment.patient;
    if (!patient) {
      logger.error(context, TAG, `Unable to find providers for an appointment without a patient`, { appointmentId });
      return err(ErrCode.STATE_VIOLATION);
    }

    const schedulingParamsResult = await buildSchedulingParams(context, {
      rescheduleForAppointment: existingAppointment,
      providerIds,
      onlyActiveProviders: params.onlyActiveProviders
    });
    if (schedulingParamsResult.isErr()) {
      logger.error(context, TAG, 'Error building scheduling params', { error: schedulingParamsResult.error });
      return err(schedulingParamsResult.error);
    }

    const schedulingParams = schedulingParamsResult.value

    const slotsResult = await fetchAvailableProviderSlotsForBooking(context, {
      schedulingParams,
      startTimestamp: existingAppointment.startTimestamp,
      duration: existingAppointment.duration,
      patientId: existingAppointment.patientId,
      ignoreDateRestrictions: true,
    });
    if (slotsResult.isErr()) {
      logger.error(context, TAG, 'Error fetching bookable time slots', { error: slotsResult.error });
      return err(slotsResult.error);
    }

    logger.debug(context, TAG, 'fetched providers for vacant appointment', { slotsCount: slotsResult.value.length });

    return ok({
      providerIds: schedulingParams.providerIds,
      slots: slotsResult.value,
      appointment: existingAppointment,
    });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface AssignCoordinatorToVacantAppointmentParams {
  appointmentId: number;
  coordinatorRuid: number;
  coordinatorEmail: string;
}

export async function assignCoordinatorToVacantAppointment(
  context: IContext,
  params: AssignCoordinatorToVacantAppointmentParams,
): Promise<Result<null, ErrCode>> {
  const { logger, store } = context;
  const TAG = [...MTAG, 'assignCoordinatorToVacantAppointment'];

  try {
    const { appointmentId, coordinatorRuid } = params;
    const rPool = await store.reader();
    const wPool = await store.writer();

    const getAppointmentResult = await Appointment.Service.getAppointment(context, { appointmentId });
    if (getAppointmentResult.isErr()) {
      logger.error(context, TAG, 'error getting appointment', { appointmentId });
      return err(ErrCode.SERVICE);
    }
    const appointment = getAppointmentResult.value;

    if (appointment.providerId || appointment.status !== 'f') {
      logger.info(context, TAG, `The appointment is not in a intakeable state.`, {
        params,
        providerId: appointment.providerId,
        status: appointment.status,
      });
      return err(ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING);
    }

    const coordinatorIntakeCount = await db
      .count('telenutrition.schedule_appointment', {
        status: 'i',
        coordinator_ruid: coordinatorRuid,
      })
      .run(rPool);

    if (coordinatorIntakeCount >= 1) {
      logger.error(context, TAG, 'This coordinator already has an appointment in intake', {
        params,
        coordinatorIntakeCount,
      });
      return err(ErrCode.CONFLICT);
    }

    const zoomResult = await Zoom.createMeeting(context, {
      appointmentId: appointment.appointmentId,
      email: params.coordinatorEmail, // TODO zoomUid
      patientId: appointment.patientId!,
      startTimestamp: appointment.startTimestamp,
      duration: appointment.duration,
    });

    if (zoomResult.isErr()) {
      logger.error(context, TAG, 'Error creating zoom meeting for coordinator', {
        appointmentId: appointment.appointmentId,
        email: params.coordinatorEmail,
        error: zoomResult.error,
      });
      return err(ErrCode.SERVICE);
    }
    const zoomMeeting = zoomResult.value;

    const updatedRows = await db
      .update(
        'telenutrition.schedule_appointment',
        {
          status: 'i',
          coordinator_ruid: coordinatorRuid,
          meeting: formatMeetingData(zoomMeeting),
        },
        {
          appointment_id: appointmentId,
          status: 'f',
          provider_id: db.conditions.isNull,
        },
      )
      .run(wPool);

    if (updatedRows.length !== 1) {
      logger.info(context, TAG, `Unable to transfer appt to coordinator in db query, it may have been taken.`, {
        params,
        providerId: appointment.providerId,
        status: appointment.status,
      });
      return err(ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING);
    }

    return ok(null);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

type VacantAppointmentsSQL =
  | zs.telenutrition.schedule_appointment.SQL
  | zs.telenutrition.schedule_provider.SQL
  | zs.telenutrition.schedule_patient.SQL
  | zs.telenutrition.payment_method_type.SQL
  | zs.telenutrition.schedule_patient_payment_method.SQL
  | zs.telenutrition.iam_identity.SQL
  | zs.telenutrition.schedule_department_provider_licensed.SQL
  | zs.telenutrition.payer_provider_schedulability.SQL
  | zs.telenutrition.schedule_department_provider_licensed.SQL
  | 'vacant_appointments'
  | 'pediatric';

export function buildVacantAppointmentsSqlFragment(
  context: IContext,
  providerId: number,
): db.SQLFragment<VacantAppointmentsSQL> {
  const sqlFragment = db.sql<VacantAppointmentsSQL>`
    WITH schedulable_provider_insurance AS (
      SELECT
        PPS.${'provider_id'}, 
        PPS.${'payer_id'} 
      FROM ${'telenutrition.payer_provider_schedulability'} PPS
      WHERE PPS.${'provider_id'} = ${db.param(providerId)}
    ),
    provider_department AS (
      SELECT
        ${'department_id'}, 
        ${'schedulable_type'} 
      FROM ${'telenutrition.schedule_department_provider_licensed'} 
      WHERE ${'provider_id'} = ${db.param(providerId)} 
    ),
    current_provider AS (
      SELECT 
        ${'credentialing_committee_status'},
        CURRENT_DATE - (INTERVAL '1 year' * ${'min_patient_age'}) as max_birthday
      FROM ${'telenutrition.schedule_provider'} 
      WHERE ${'provider_id'} = ${db.param(providerId)}
      LIMIT 1
    ),
    ${'vacant_appointments'} AS (
      SELECT
        SA.${'appointment_id'},
        SA.${'start_timestamp'},
        SA.${'duration'},
        (II.${'birthday'} > CURRENT_DATE - INTERVAL '13 years') AS ${'pediatric'}
      FROM
        ${'telenutrition.schedule_appointment'} SA
        INNER JOIN ${'telenutrition.schedule_patient_payment_method'} PM USING (${'payment_method_id'})
        INNER JOIN ${'telenutrition.payment_method_type'} PMT USING (${'payment_method_type_id'})
        INNER JOIN ${'telenutrition.schedule_patient'} PA ON PA.${'patient_id'} = SA.${'patient_id'}
        INNER JOIN ${'telenutrition.iam_identity'} II USING (${'identity_id'})
        INNER JOIN provider_department PD ON PD.${'department_id'} = PA.${'department_id'}
      WHERE
        SA.${'start_timestamp'} BETWEEN(CURRENT_TIMESTAMP - INTERVAL '2 hours') AND(CURRENT_TIMESTAMP + INTERVAL '30 days')
        AND SA.${'status'} = 'f'
        AND SA.${'frozen'} = false
        AND SA.${'provider_id'} IS NULL
        AND (
          PD.${'schedulable_type'} = 'all' OR
            (PD.${'schedulable_type'} = 'pending' AND 
                (PM.${'insurance_id'} = ${db.param(INSURANCE_ALLOWED_FOR_PENDING_LICENSE)} OR
                  II.${'account_id'} = ANY(${db.param(ACCOUNTS_ALLOWED_FOR_PENDING_LICENSE)})))
        )
        AND (SELECT ${'credentialing_committee_status'} FROM current_provider) = 'approved'
        AND (PM.${'type'} != 'plan' OR (PMT.${'payer_id'} IS NULL OR PMT.${'payer_id'} IN (SELECT ${'payer_id'} FROM schedulable_provider_insurance)))
        AND EXISTS (
          SELECT 1
          FROM current_provider
          WHERE (II.${'birthday'} <= max_birthday)
        )
    )`;

  return sqlFragment;
}

interface GetProviderVacantSlotSummaryParams {
  providerId: number;
}

interface VacantSlot {
  startTimestamp: string;
  duration: number;
  count: number;
}

type VacantSlotSummary = {
  vacancies: VacantSlot[];
};

export async function getProviderVacantSlotSummary(
  context: IContext,
  params: GetProviderVacantSlotSummaryParams,
): Promise<Result<VacantSlotSummary, ErrCode>> {
  const { logger, store } = context;
  const TAG = [...MTAG, 'getProviderVacantSlotSummary'];

  try {
    const { providerId } = params;
    const pool = await store.reader();

    const vacantAppointmentsSqlFragment = buildVacantAppointmentsSqlFragment(context, providerId);

    const sqlFragment = db.sql<VacantAppointmentsSQL, { start_timestamp: string; duration: number; count: string }[]>`
      ${vacantAppointmentsSqlFragment}
      SELECT
        ${'start_timestamp'},
        ${'duration'},
        COUNT(*) AS count
      FROM
        ${'vacant_appointments'}
      GROUP BY
        ${'start_timestamp'}, ${'duration'}
    `;

    const start = new Date();

    const rows = await sqlFragment.run(pool);

    const end = new Date();
    const timeMs = end.getTime() - start.getTime();

    logger.debug(context, TAG, 'ran query for getProviderVacantSlotSummary', {
      params,
      compiledSQL: sqlFragment.compile(),
      timeMs,
      rowCount: rows.length,
    });

    const vacancies = rows.map((s) => ({
      startTimestamp: s.start_timestamp,
      duration: s.duration,
      count: Number(s.count),
    }));

    return ok({ vacancies });
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface GetProviderVacantSlotAppointmentsParams {
  providerId: number;
  startTimestamp: Date;
  duration: number;
}

export async function getProviderVacantSlotAppointmentId(
  context: IContext,
  params: GetProviderVacantSlotAppointmentsParams,
): Promise<Result<number, ErrCode>> {
  const { logger, store } = context;
  const TAG = [...MTAG, 'getProviderVacantSlotAppointmentId'];

  try {
    const { providerId, startTimestamp, duration } = params;
    const pool = await store.reader();

    const vacantAppointmentsSqlFragment = buildVacantAppointmentsSqlFragment(context, providerId);

    const sqlFragment = db.sql<VacantAppointmentsSQL, { appointment_id: number }[]>`
      ${vacantAppointmentsSqlFragment}
      SELECT
        ${'appointment_id'}
      FROM
        ${'vacant_appointments'}
      WHERE
        ${'start_timestamp'} = ${db.param(startTimestamp)}
        AND ${'duration'} = ${db.param(duration)}
      ORDER BY ${'pediatric'} DESC, RANDOM()
      LIMIT 1
    `;

    const start = new Date();

    const rows = await sqlFragment.run(pool);

    const end = new Date();
    const timeMs = end.getTime() - start.getTime();

    logger.debug(context, TAG, 'ran query for getProviderVacantSlotAppointmentId', {
      params,
      compiledSQL: sqlFragment.compile(),
      timeMs,
      rows,
    });

    const appointment = rows.at(0);

    if (!appointment) {
      logger.info(context, TAG, 'no vacant appointments for the vacant slot and provider', params);
      return err(ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING);
    }

    return ok(appointment.appointment_id);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface AttemptFillVacancySlotParams {
  providerId: number;
  duration: number;
  startTimestamp: string;
  fromFrozen: boolean;
}

export async function attemptFillVacantSlot(
  context: IContext,
  params: AttemptFillVacancySlotParams,
): Promise<Result<AppointmentRecord, ErrCode>> {
  const { logger } = context;
  const TAG = [...MTAG, 'attemptFillVacantSlot'];

  try {
    const { providerId, duration, startTimestamp, fromFrozen } = params;
    logger.debug(context, TAG, 'attempting to fill vacant slot', { params });

    const vacantAppointmentsResult = await getProviderVacantSlotAppointmentId(context, {
      providerId: providerId,
      startTimestamp: new Date(startTimestamp),
      duration: duration,
    });
    if (vacantAppointmentsResult.isErr()) {
      if (vacantAppointmentsResult.error === ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING) {
        logger.info(context, TAG, 'no more vacant appointments for the vacant slot and provider', {
          params,
          error: vacantAppointmentsResult.error,
        });
        return err(ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING);
      }
      logger.error(context, TAG, 'error getting appointments for the vacant slot and provider', {
        params,
        error: vacantAppointmentsResult.error,
      });
      return err(ErrCode.SERVICE);
    }
    const appointmentId = vacantAppointmentsResult.value;

    const transferToProviderResult = await transferVacantAppointmentToProvider(context, {
      providerId,
      appointmentId,
      fromFrozen,
    });
    if (transferToProviderResult.isErr()) {
      if (transferToProviderResult.error === ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING) {
        logger.info(context, TAG, 'the appointment or provider slot is no longer available', {
          params,
          error: transferToProviderResult.error,
        });
        return err(ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING);
      }
      logger.error(context, TAG, 'could not transfer appointment to provider', {
        params,
        appointmentId,
        error: transferToProviderResult.error,
      });
      return err(ErrCode.SERVICE);
    }

    logger.debug(context, TAG, 'filled vacant slot', { params, appointmentId });
    return ok(transferToProviderResult.value);
  } catch (e) {
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface TransferVacantAppointmentToProviderParams {
  appointmentId: number;
  providerId?: number;
  coordinatorRuid?: number;
  fromFrozen?: boolean;
  fromAssigned?: boolean;
  onlyActiveProviders?: boolean;
}

export async function transferVacantAppointmentToProvider(
  context: IContext,
  params: TransferVacantAppointmentToProviderParams,
): Promise<Result<AppointmentRecord, ErrCode>> {
  const { logger, store } = context;
  const TAG = [...MTAG, 'transferVacantAppointmentToProvider'];

  try {
    const pool = await store.writer();

    if (params.fromFrozen && !params.providerId) {
      logger.info(context, TAG, 'Slot assignment not allowed for provider', params);
      return err(ErrCode.ARGUMENT_ERROR);
    }

    const availableProvidersResult = await getProvidersForVacantAppointment(context, {
      appointmentId: params.appointmentId,
      ...params.providerId && { providerIds: [params.providerId] },
      fromAssigned: params.fromAssigned,
      onlyActiveProviders: params.onlyActiveProviders
    });
    if (availableProvidersResult.isErr()) {
      logger.error(context, TAG, 'Error getting appointment', params);
      return err(availableProvidersResult.error);
    }
    const { slots, appointment } = availableProvidersResult.value;

    const opening = slots[0]
    if (!opening && !params.fromFrozen) {
      logger.info(context, TAG, 'No matching open slot found for provider', params);
      return err(ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING);
    }

    let statusWhereable: zs.telenutrition.schedule_appointment.Whereable;
    if (appointment.status === 'i') {
      if (!params.coordinatorRuid) {
        logger.error(context, TAG, 'no coordinatorRuid when transferring appointment in intake status', params);
        return err(ErrCode.INVALID_DATA);
      }
      statusWhereable = {
        status: 'i',
        coordinator_ruid: params.coordinatorRuid,
      };
    } else {
      statusWhereable = {
        status: 'f',
      };
    }

    const providerId = params.providerId ?? opening.provider.providerId

    let zoomMeeting: ZoomMeeting | undefined = undefined;
    if (params.fromAssigned || appointment.meeting?.schemaType !== 'zoom_dynamic') {
      const zoomMeetingResult = await Zoom.createMeeting(context, {
        appointmentId: appointment.appointmentId,
        providerId,
        patientId: appointment.patientId!,
        startTimestamp: appointment.startTimestamp,
        duration: appointment.duration,
        ...(params.fromAssigned && appointment.meeting && { code: getMeetingCode(appointment.meeting) })
      });
      if (zoomMeetingResult.isErr()) {
        logger.error(context, TAG, 'unable to create zoom meeting for appointment', { error: zoomMeetingResult.error });
        return err(ErrCode.SERVICE);
      }
      zoomMeeting = zoomMeetingResult.value;
    }

    const updatedAppointment = await db.serializable(pool, async (txn) => {
      let slotsToDelete = opening?.appointmentIds || []
      if (params.fromFrozen) {
        const conflicts = await queryConflictingAppointmentsForProvider(txn, {
          providerId,
          startDateTime: DateTime.fromJSDate(appointment.startTimestamp),
          duration: appointment.duration,
        });
        const bookedConflicts = conflicts.filter((conflict) => conflict.status !== 'o');
        if (bookedConflicts.length > 0) {
          logger.debug(context, TAG, 'Conflict trying to assign appointment', {
            appointmentId: appointment.appointmentId,
            conflicts: bookedConflicts.map((conflict) => conflict.appointment_id),
          });
          throw new ErrCodeError(ErrCode.CONFLICT);
        }
        if (conflicts.length > 0) {
          slotsToDelete = conflicts.map((conflict) => conflict.appointment_id)
        }
      }

      const [newAppointments, deletedAppointments] = await Promise.all([
        db
          .update(
            'telenutrition.schedule_appointment',
            {
              provider_id: params.providerId,
              status: 'f',
              ...(zoomMeeting ? { meeting: formatMeetingData(zoomMeeting) } : {}),
            },
            {
              appointment_id: params.appointmentId,
              provider_id: db.conditions.isNull,
              frozen: false,
              ...statusWhereable,
            },
          )
          .run(txn),
        db
          .deletes('telenutrition.schedule_appointment', {
            appointment_id: db.conditions.isIn(slotsToDelete),
            provider_id: params.providerId,
            status: 'o',
            frozen: false,
          })
          .run(txn),
      ]);

      if (newAppointments.length !== 1 || deletedAppointments.length !== slotsToDelete.length) {
        logger.info(context, TAG, 'db update was unable to transfer appointment to provider', {
          params,
          newAppointments,
          deletedAppointments,
        });
        throw new ErrCodeError(ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING);
      }

      return newAppointments[0];
    });

    const createMapAppointmentRecordFnResult = await createMapAppointmentRecordFn(context);
    if (createMapAppointmentRecordFnResult.isErr()) {
      logger.error(context, TAG, 'Error creating mapAppointmentRecord function', {
        params,
        error: createMapAppointmentRecordFnResult.error,
      });

      return err(createMapAppointmentRecordFnResult.error);
    }

    const mapAppointmentRecord = createMapAppointmentRecordFnResult.value;

    const patient = await db
      .selectExactlyOne(
        'telenutrition.schedule_patient',
        {
          patient_id: updatedAppointment.patient_id!,
        },
        {
          lateral: {
            identity: db.selectOne('telenutrition.iam_identity', {
              identity_id: db.parent('identity_id'),
            }),
          },
        },
      )
      .run(pool);

    return ok(mapAppointmentRecord({ record: updatedAppointment, timezone: patient.timezone, patient }));
  } catch (e) {
    if (e instanceof ErrCodeError) {
      return err(e.code);
    }
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

interface OverbookingSlotsAssignResult {
  assignedSlotsCount: number;
  unableToAssignSlotsCount: number;
  errorAssigningSlotsCount: number;
}

export async function autoAssignOverbookingSlots(
  context: IContext,
): Promise<Result<OverbookingSlotsAssignResult, ErrCode>> {
  const { logger, store } = context;
  const TAG = [...MTAG, 'autoAssignOverbookingSlots'];

  try {
    const pool = await store.reader();
    const wpool = await store.writer();

    const termedRDs = await db.select('common.employee', {
      end_date: db.conditions.between(
        db.conditions.fromNow(-7, 'days'),
        db.conditions.fromNow(7, 'days')
      )
    }, {
      lateral: {
        provider: db.selectOne('telenutrition.schedule_provider', {
          employee_id: db.parent('employee_id')
        }, {
          lateral: {
            appointments: db.select('telenutrition.schedule_appointment', {
              provider_id: db.parent('provider_id'),
              status: 'f',
              frozen: false,
              start_timestamp: db.sql<zs.telenutrition.schedule_appointment.SQL | zs.common.employee.SQL>`${db.self} > ${"common.employee"}.${"end_date"} AND ${db.self} > ${db.conditions.fromNow(1, 'hour')}`
            })
          }
        })
      }
    }).run(pool)

    const termedAppts = termedRDs.flatMap((employee) => employee.provider?.appointments ?? []);

    logger.debug(context, TAG, `Found ${termedRDs.length} termed RDs`, {
      providers: termedRDs.map(employee => ({
        providerId: employee.provider?.provider_id,
        endDate: employee.end_date,
        appointmentIds: employee.provider?.appointments.map(appt => appt.appointment_id)
      }))
    });

    for (const record of termedAppts) {
      const appt = mapBaseAppointmentRecord(record)
      const transferResult = await transferVacantAppointmentToProvider(context, {
        appointmentId: appt.appointmentId,
        fromAssigned: true,
        onlyActiveProviders: true
      })

      if (transferResult.isOk()) {
        const newAppt = transferResult.value
        await sendAppointmentUpdateEvent(context, newAppt, false, {
          eventSource: 'swap'
        })
        logger.debug(context, TAG, "Transferred appointment", {
          appointmentId: newAppt.appointmentId,
          oldProviderId: appt.providerId,
          newProviderId: newAppt.providerId
        })
        continue
      }
      logger.debug(context, TAG, "Unable to transfer appointment, moving to overbook queue instead", {
        appointmentId: appt.appointmentId,
        error: transferResult.error
      })
      const meeting = appt.meeting;
      if (meeting && meeting.schemaType === 'zoom_dynamic') {
        const code = getMeetingCode(meeting);
        const waitingResult = await createWaitingLink(context, appt.startTimestamp, code);
        if (waitingResult.isOk()) {
          const { id, url } = waitingResult.value
          const meeting: AppointmentMeetingDbRecord = {
            schema_type: 'waiting',
            link: url,
            short_link: url,
          }
          await db.update('telenutrition.schedule_appointment', {
            provider_id: null,
            waiting_id: id,
            meeting
          }, {
            appointment_id: appt.appointmentId,
          }).run(wpool)
        }
      }
    }

    const overbookedAppointments = await db
      .select(
        'telenutrition.schedule_appointment',
        {
          status: 'f',
          frozen: false,
          provider_id: db.conditions.isNull,
          start_timestamp: db.conditions.between(db.conditions.fromNow(1, 'hour'), db.conditions.fromNow(2, 'hours')),
        },
        {
          columns: ['appointment_id', 'start_timestamp'],
          order: [
            { by: 'start_timestamp', direction: 'ASC' },
            { by: 'appointment_id', direction: 'ASC' },
          ],
        },
      )
      .run(pool);

    logger.info(context, TAG, `Attempting to auto assign ${overbookedAppointments.length} overbooked appointments`);

    let assignedSlotsCount = 0,
      unableToAssignSlotsCount = 0,
      errorAssigningSlotsCount = 0;

    for (const overbookedAppt of overbookedAppointments) {
      const apptId = overbookedAppt.appointment_id;
      const transferToProviderResult = await transferVacantAppointmentToProvider(context, {
        appointmentId: apptId,
        onlyActiveProviders: true
      });
      if (transferToProviderResult.isErr()) {
        if (transferToProviderResult.error === ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING) {
          logger.info(context, TAG, 'the appointment or provider slot is no longer available', {
            appointmentId: apptId,
            error: transferToProviderResult.error,
          });
          unableToAssignSlotsCount += 1;
        } else {
          logger.error(context, TAG, `could not transfer appointment to provider`, {
            appointmentId: apptId,
            error: transferToProviderResult.error,
          });

          errorAssigningSlotsCount += 1;
        }
        continue;
      }

      assignedSlotsCount += 1;
    }

    return ok({
      assignedSlotsCount: assignedSlotsCount,
      unableToAssignSlotsCount: unableToAssignSlotsCount,
      errorAssigningSlotsCount: errorAssigningSlotsCount,
    });
  } catch (e) {
    if (e instanceof ErrCodeError) {
      return err(e.code);
    }
    logger.exception(context, TAG, e);
    return err(ErrCode.EXCEPTION);
  }
}

export default {
  getProvidersForVacantAppointment,
  assignCoordinatorToVacantAppointment,
  getProviderVacantSlotSummary,
  attemptFillVacantSlot,
  transferVacantAppointmentToProvider,
  autoAssignOverbookingSlots,
};
