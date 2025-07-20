import type { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import Logger from '@mono/common/lib/logger'
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import * as _ from 'lodash'
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from "luxon"
import { Pool } from "pg"


const MTAG = Logger.tag()


export type ScheduleSlotType = '30-only' | '60-only' | '30-or-60'
export type AppointmentSlotSource = Pick<zs.telenutrition.schedule_appointment.Selectable, 'appointment_id' | 'provider_id' | 'start_timestamp' | 'duration'>
export type PartiallyBuiltScheduleSlot = Pick<zs.telenutrition.schedule_slot.Selectable, 'slot_type' | 'start_timestamp' | 'duration'> & { appointment_ids: number[] }


export interface AllocateScheduleSlotsReport extends AllocateScheduleSlotsForProviderReport {
  syncedProviderCount: number,
  failedProviderCount: number
}

/**
 * Creates multiple views of 'Foodsmart schedule slots' from 'Athena appointment slots'.
 * A slot is a time-span that can be booked with a provider.
 * This function is intended to be called within a data pipeline.
 * @param context 
 * @returns A SyncScheduleSlotsReport
 */
async function allocateScheduleSlots(context: IContext): Promise<Result<AllocateScheduleSlotsReport, ErrCode>> {
  const { store: { reader, writer }, logger } = context
  const TAG = [...MTAG, 'allocateScheduleSlots']

  try {
    logger.info(context, TAG, 'starting to allocate schedule slots')
    const readerPool = await reader()
    const writerPool = await writer()

    const providers = await db.select('telenutrition.schedule_provider', db.all, { columns: ['provider_id'] }).run(readerPool);

    let syncedProviderCount = 0
    let failedProviderCount = 0
    let upsertedSlotCount = 0
    let insertedSlotCount = 0
    let updatedSlotCount = 0
    for (const provider of providers) {
      const providerId = provider.provider_id

      const syncProviderSlotsResult = await allocateScheduleSlotsForProvider(context, providerId, { readerPool, writerPool });
      if (syncProviderSlotsResult.isErr()) {
        logger.error(context, TAG, 'error allocating schedule slots for provider', { providerId })
        failedProviderCount++;
        continue;
      }
      const syncProviderSlotsReport = syncProviderSlotsResult.value

      syncedProviderCount++
      upsertedSlotCount += syncProviderSlotsReport.upsertedSlotCount
      insertedSlotCount += syncProviderSlotsReport.insertedSlotCount
      updatedSlotCount += syncProviderSlotsReport.updatedSlotCount
    }

    const providerIds = providers.map(p => p.provider_id);
    await db.deletes('telenutrition.schedule_slot', { provider_id: db.conditions.isNotIn(providerIds) }).run(writerPool);

    logger.info(context, TAG, 'finished allocating schedule slots')

    return ok({
      syncedProviderCount,
      failedProviderCount,
      upsertedSlotCount,
      insertedSlotCount,
      updatedSlotCount,
    })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


interface AllocateScheduleSlotsForProviderOptions {
  readerPool: Pool
  writerPool: Pool
}

interface AllocateScheduleSlotsForProviderReport {
  upsertedSlotCount: number,
  insertedSlotCount: number,
  updatedSlotCount: number,
}

async function allocateScheduleSlotsForProvider(context: IContext, providerId: number, options: AllocateScheduleSlotsForProviderOptions): Promise<Result<AllocateScheduleSlotsForProviderReport, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'allocateScheduleSlotsForProvider']

  try {
    logger.info(context, TAG, 'starting to allocate schedule slots for provider', { providerId })

    const { readerPool, writerPool } = options
    const syncToken: string = uuidv4();

    const appointments = await db.sql<zs.telenutrition.schedule_appointment.SQL | zs.telenutrition.schedule_provider.SQL, AppointmentSlotSource[]>`
      SELECT SA.${'appointment_id'}, SA.${'provider_id'}, SA.${'start_timestamp'}, SA.${'duration'}
      FROM ${'telenutrition.schedule_appointment'} SA
      WHERE SA.${'provider_id'} = ${db.param(providerId)}
        AND SA.${'status'} = 'o'
        AND SA.${'frozen'} = FALSE
        AND SA.${'appointment_type_id'} = 1
        AND SA.${'start_timestamp'} > CURRENT_TIMESTAMP
      ORDER BY SA.${'start_timestamp'} ASC, SA.${'appointment_id'} ASC
      LIMIT 10000
    `.run(readerPool)

    const upsertableSlotsResult = buildScheduleSlotsForProvider(context, { providerId, appointments, syncToken })
    if (upsertableSlotsResult.isErr()) {
      logger.error(context, TAG, 'error transforming appointments into upsertable slots.', { providerId })
      return err(ErrCode.SERVICE);
    }
    const upsertableSlots = upsertableSlotsResult.value;

    let upsertedSlotCount = 0;
    let insertedSlotCount = 0;
    let updatedSlotCount = 0;
    await db.transaction(writerPool, db.IsolationLevel.ReadCommitted, async txn => {

      for (const chunk of _.chunk(upsertableSlots, 500)) {
        const upsertedSlots = await db.upsert(
          'telenutrition.schedule_slot',
          chunk,
          ['slot_type', 'provider_id', 'start_timestamp', 'duration'],
          {
            updateColumns: ['appointment_ids', 'end_timestamp', 'sync_token', 'updated_at'],
            returning: ['slot_id']
          }
        ).run(txn);

        const batchReport = {
          upsertedSlotCount: upsertedSlots.length,
          insertedSlotCount: upsertedSlots.filter(s => s.$action === 'INSERT').length,
          updatedSlotCount: upsertedSlots.filter(s => s.$action === 'UPDATE').length,
        }

        upsertedSlotCount += batchReport.upsertedSlotCount
        insertedSlotCount += batchReport.insertedSlotCount
        updatedSlotCount += batchReport.updatedSlotCount
      }

      await db.deletes(
        'telenutrition.schedule_slot',
        {
          provider_id: db.conditions.eq(providerId),
          sync_token: db.conditions.ne(syncToken),
        },
        { returning: [] }
      ).run(txn)
    })

    const report = {
      upsertedSlotCount,
      insertedSlotCount,
      updatedSlotCount,
    }

    logger.info(context, TAG, 'finished allocating schedule slots for provider', { providerId, report })

    return ok(report)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface BuildScheduleSlotsForProviderParams {
  providerId: number,
  appointments: AppointmentSlotSource[],
  syncToken: string,
}

export function buildScheduleSlotsForProvider(context: IContext, params: BuildScheduleSlotsForProviderParams): Result<zs.telenutrition.schedule_slot.Insertable[], ErrCode> {
  const { logger } = context
  const TAG = [...MTAG, 'buildScheduleSlotsForProvider']

  try {
    const { providerId, appointments, syncToken } = params;

    const flooredAppointments = appointments.map(a => ({
      ...a,
      start_timestamp: DateTime.fromJSDate(a.start_timestamp).startOf('minute').toJSDate()
    }))

    const build30OnlySlotsForProviderResult = build30OnlySlotsForProvider(context, flooredAppointments);
    if (build30OnlySlotsForProviderResult.isErr()) {
      logger.error(context, TAG, 'Error building 30-only slots')
      return err(ErrCode.SERVICE)
    }

    const build60OnlySlotsForProviderResult = build60OnlySlotsForProvider(context, flooredAppointments);
    if (build60OnlySlotsForProviderResult.isErr()) {
      logger.error(context, TAG, 'Error building 60-only slots')
      return err(ErrCode.SERVICE)
    }

    const build30Or60SlotsForProviderResult = build30Or60SlotsForProvider(context, flooredAppointments);
    if (build30Or60SlotsForProviderResult.isErr()) {
      logger.error(context, TAG, 'Error building 30-or-60 slots')
      return err(ErrCode.SERVICE)
    }

    const partiallyBuiltSlots = [...build30OnlySlotsForProviderResult.value, ...build60OnlySlotsForProviderResult.value, ...build30Or60SlotsForProviderResult.value];

    const currentDate = new Date()
    const slots = partiallyBuiltSlots.map(s => ({
      slot_id: uuidv4(),
      slot_type: s.slot_type,
      provider_id: providerId,
      start_timestamp: DateTime.fromJSDate(s.start_timestamp).startOf('minute').toJSDate(),
      end_timestamp: DateTime.fromJSDate(s.start_timestamp).startOf('minute').plus({ minutes: s.duration }).toJSDate(),
      duration: s.duration,
      appointment_ids: s.appointment_ids,
      sync_token: syncToken,
      updated_at: currentDate,
    }) satisfies zs.telenutrition.schedule_slot.Insertable)

    return ok(slots)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


export function build30OnlySlotsForProvider(context: IContext, appointments: AppointmentSlotSource[]): Result<PartiallyBuiltScheduleSlot[], ErrCode> {
  const { logger } = context
  const TAG = [...MTAG, 'build30OnlySlotsForProvider']

  try {
    const sortedAppointments = _.orderBy(appointments, ['start_timestamp', 'appointment_id'], ['asc', 'asc'])

    const slots: PartiallyBuiltScheduleSlot[] = []
    for (let index = 0; index < sortedAppointments.length; index++) {
      const appointment = sortedAppointments[index];
      if (appointment.duration === 30 && (DateTime.fromJSDate(appointment.start_timestamp).minute === 0 || DateTime.fromJSDate(appointment.start_timestamp).minute === 30)) {
        slots.push({
          slot_type: '30-only',
          start_timestamp: appointment.start_timestamp,
          duration: appointment.duration,
          appointment_ids: [appointment.appointment_id],
        });
        const currentSlotEnd = DateTime.fromJSDate(appointment.start_timestamp).plus({ minutes: 29 });
        while (index + 1 < sortedAppointments.length && DateTime.fromJSDate(sortedAppointments[index + 1].start_timestamp) < currentSlotEnd) {
          index++;
        }
      }
    }

    return ok(slots)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


export function build60OnlySlotsForProvider(context: IContext, appointments: AppointmentSlotSource[]): Result<PartiallyBuiltScheduleSlot[], ErrCode> {
  const { logger } = context
  const TAG = [...MTAG, 'build60OnlySlotsForProvider']

  try {
    const sortedAppointments = _.orderBy(appointments, ['start_timestamp', 'duration', 'appointment_id'], ['asc', 'desc', 'asc'])

    const slots: PartiallyBuiltScheduleSlot[] = []
    for (let index = 0; index < sortedAppointments.length; index++) {
      const appointment = sortedAppointments[index];
      const nextAppointment = sortedAppointments[index + 1];

      // Check if the current appointment is 60 minutes long and starts at the top of the hour
      if (appointment.duration === 60 && DateTime.fromJSDate(appointment.start_timestamp).minute === 0) {
        slots.push({
          slot_type: '60-only',
          start_timestamp: appointment.start_timestamp,
          duration: 60,
          appointment_ids: [appointment.appointment_id],
        });
        const currentSlotEnd = DateTime.fromJSDate(appointment.start_timestamp).plus({ minutes: 59 });
        while (index + 1 < sortedAppointments.length && DateTime.fromJSDate(sortedAppointments[index + 1].start_timestamp) < currentSlotEnd) {
          index++;
        }
      } else if (
        // Check if the current appointment is 30 minutes long, starts at the top of the hour, and there's a next appointment
        appointment.duration === 30 &&
        DateTime.fromJSDate(appointment.start_timestamp).minute === 0 &&
        nextAppointment &&
        nextAppointment.duration === 30 &&
        DateTime.fromJSDate(nextAppointment.start_timestamp).minute === 30 &&
        // Check if combining two 30-minute appointments doesn't create a gap
        Math.abs(DateTime.fromJSDate(appointment.start_timestamp)
          .plus({ minutes: appointment.duration })
          .diff(DateTime.fromJSDate(nextAppointment.start_timestamp), 'minutes').minutes) <= 1
      ) {
        // Combine two 30-minute appointments into a '60-only' slot
        slots.push({
          slot_type: '60-only',
          start_timestamp: appointment.start_timestamp,
          duration: 60,
          appointment_ids: [appointment.appointment_id, nextAppointment.appointment_id],
        });
        const currentSlotEnd = DateTime.fromJSDate(appointment.start_timestamp).plus({ minutes: 59 });
        while (index + 1 < sortedAppointments.length && DateTime.fromJSDate(sortedAppointments[index + 1].start_timestamp) < currentSlotEnd) {
          index++;
        }
      }
    }

    return ok(slots)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


export function build30Or60SlotsForProvider(context: IContext, appointments: AppointmentSlotSource[]): Result<PartiallyBuiltScheduleSlot[], ErrCode> {
  const { logger } = context
  const TAG = [...MTAG, 'build30Or60SlotsForProvider']

  try {
    const sortedAppointments = _.orderBy(appointments, ['start_timestamp', 'duration', 'appointment_id'], ['asc', 'desc', 'asc'])

    const slots: PartiallyBuiltScheduleSlot[] = []
    for (let index = 0; index < sortedAppointments.length; index++) {
      const appointment = sortedAppointments[index];
      const nextAppointment = sortedAppointments[index + 1];

      // Check if a 60-minute appointment is available
      if (appointment.duration === 60 &&
        DateTime.fromJSDate(appointment.start_timestamp).minute === 0) {
        slots.push({
          slot_type: '30-or-60',
          start_timestamp: appointment.start_timestamp,
          duration: 60,
          appointment_ids: [appointment.appointment_id],
        });
        const currentSlotEnd = DateTime.fromJSDate(appointment.start_timestamp).plus({ minutes: 59 });
        while (index + 1 < sortedAppointments.length && DateTime.fromJSDate(sortedAppointments[index + 1].start_timestamp) < currentSlotEnd) {
          index++;
        }
      } else if (appointment.duration === 30 &&
        DateTime.fromJSDate(appointment.start_timestamp).minute === 0 &&
        nextAppointment &&
        nextAppointment.duration === 30 &&
        DateTime.fromJSDate(nextAppointment.start_timestamp).minute === 30 &&
        // Check if combining two 30-minute appointments doesn't create a gap
        Math.abs(DateTime.fromJSDate(appointment.start_timestamp)
          .plus({ minutes: appointment.duration })
          .diff(DateTime.fromJSDate(nextAppointment.start_timestamp), 'minutes').minutes) <= 1) {
        // Combine two 30-minute appointments into a 60-minute slot
        slots.push({
          slot_type: '30-or-60',
          start_timestamp: appointment.start_timestamp,
          duration: 60,
          appointment_ids: [appointment.appointment_id, nextAppointment.appointment_id],
        });
        const currentSlotEnd = DateTime.fromJSDate(appointment.start_timestamp).plus({ minutes: 59 });
        while (index + 1 < sortedAppointments.length && DateTime.fromJSDate(sortedAppointments[index + 1].start_timestamp) < currentSlotEnd) {
          index++;
        }
      } else if (appointment.duration === 30 &&
        (DateTime.fromJSDate(appointment.start_timestamp).minute === 0 ||
          DateTime.fromJSDate(appointment.start_timestamp).minute === 30)) {
        // If not possible to combine, create a 30-minute slot
        slots.push({
          slot_type: '30-or-60',
          start_timestamp: appointment.start_timestamp,
          duration: 30,
          appointment_ids: [appointment.appointment_id],
        });
        const currentSlotEnd = DateTime.fromJSDate(appointment.start_timestamp).plus({ minutes: 29 });
        while (index + 1 < sortedAppointments.length && DateTime.fromJSDate(sortedAppointments[index + 1].start_timestamp) < currentSlotEnd) {
          index++;
        }
      }
    }

    return ok(slots)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  allocateScheduleSlots,
}
