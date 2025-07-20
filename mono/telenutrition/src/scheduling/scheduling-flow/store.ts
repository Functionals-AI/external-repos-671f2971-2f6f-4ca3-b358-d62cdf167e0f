import { IContext } from "@mono/common/lib/context"
import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'
import { ErrCode } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import { Logger } from '@mono/common'

const MTAG = Logger.tag()

import {FlowRecord, FlowCreateRecord, FlowState, FlowInsurance, FlowUpdateRecord, FlowType} from './types'

export async function insertFlow(context: IContext, record: FlowCreateRecord): Promise<Result<FlowRecord, ErrCode>> {
  const {logger, store: {writer}} = context

  try {
    const pool = await writer()

    const insertable: zs.telenutrition.schedule_flow.Insertable = {
      ...(record.userId && {user_id: record.userId}),
      ...(record.federationId && {federation_id: record.federationId}),
      state: record.state,
      insurance: record.insurance,
      timezone: record.timezone ?? undefined,
      ...(record.patientId && {patient_id: record.patientId}),
      ...(record.appointmentId && {appointment_id: record.appointmentId}),
      ...(record.scheduledAt && {scheduled_at: record.scheduledAt}),
      flow_type: record.flowType,
      ...(record.currentStep && {current_step: record.currentStep})
    }

    const flow = await db.insert('telenutrition.schedule_flow', insertable).run(pool)

    return ok({
      flowId: flow.flow_id,
      ...(flow.user_id && {userId: flow.user_id}),
      ...(flow.federation_id && {federationId: flow.federation_id}),
      ...(flow.patient_id && {patientId: flow.patient_id}),
      ...(flow.appointment_id && {appointmentId: flow.appointment_id}),
      state: flow.state as FlowState,
      insurance: flow.insurance as FlowInsurance,
      timezone: flow.timezone ?? undefined,
      ...(flow.scheduled_at && {scheduledAt: new Date(flow.scheduled_at)}),
      flowType: flow.flow_type as FlowType,
      ...(flow.current_step && {currentStep: flow.current_step}),
      createdAt: new Date(flow.created_at),
      updatedAt: new Date(flow.updated_at),
    })
    
  } catch(e) {
    logger.exception(context, 'flow.store.insertFlow', e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function updateFlow(context: IContext, record: FlowUpdateRecord): Promise<Result<FlowRecord, ErrCode>> {
  const {logger, store: {writer}} = context

  try {
    const pool = await writer()

    if (Object.keys(record).length === 0) {
      return err(ErrCode.ARGUMENT_ERROR)
    }

    const updateable: zs.telenutrition.schedule_flow.Updatable = {
      ...(record.state && {state: record.state}),
      ...(record.insurance && {insurance:record.insurance}),
      ...(record.patientId && {patient_id: record.patientId}),
      ...(record.appointmentId && {appointment_id: record.appointmentId}),
      ...(record.scheduledAt && {scheduled_at: record.scheduledAt}),
      ...(record.timezone && {timezone: record.timezone}),
    }

    const flows = await db.update('telenutrition.schedule_flow', updateable, {flow_id: record.flowId}).run(pool)

    const flow = flows[0]

    return ok({
      flowId: flow.flow_id,
      ...(flow.user_id && {userId: flow.user_id}),
      ...(flow.federation_id && {federationId: flow.federation_id}),
      ...(flow.patient_id && {patientId: flow.patient_id}),
      ...(flow.appointment_id && {appointmentId: flow.appointment_id}),
      state: flow.state as FlowState,
      insurance: flow.insurance as FlowInsurance,
      timezone: flow.timezone ?? undefined,
      ...(flow.scheduled_at && {scheduledAt: new Date(flow.scheduled_at)}),
      flowType: flow.flow_type as FlowType,
      ...(flow.current_step && {currentStep: flow.current_step}),
      createdAt: new Date(flow.created_at),
      updatedAt: new Date(flow.updated_at),
    })
    
  } catch(e) {
    logger.exception(context, 'flow.store.updateFlow', e)
    return err(ErrCode.EXCEPTION)
  }
}

export interface QueryFlowsForSyncOptions {
  minFlowId?: number,
}

export async function selectFlowsComplete(context: IContext, options?: QueryFlowsForSyncOptions): Promise<Result<FlowRecord[], ErrCode>> {
  const {logger, store: {writer}} = context

  options ??= {}

  try {
    const pool = await writer()

    const records = await db.select('telenutrition.schedule_flow', {
      ...(options.minFlowId && {flow_id: db.sql`${db.self} > ${db.vals(options.minFlowId)}`}),
      scheduled_at: db.conditions.isNotNull,
      // @ts-ignore
      created_at: db.sql`${db.self} < now() - INTERVAL '1 hour'`,
    }, {
      order: {by: 'updated_at', direction: 'DESC'}
    }).run(pool)

    const flows = records.map(flow => {
      return {
        flowId: flow.flow_id,
        ...(flow.user_id && {userId: flow.user_id}),
        ...(flow.federation_id && {federationId: flow.federation_id}),
        ...(flow.patient_id && {patientId: flow.patient_id}),
        ...(flow.appointment_id && {appointmentId: flow.appointment_id}),
        state: flow.state as FlowState,
        insurance: flow.insurance as FlowInsurance,
        timezone: flow.timezone ?? undefined,
        flowType: flow.flow_type as FlowType,
        ...(flow.current_step && {currentStep: flow.current_step}),
        ...(flow.scheduled_at && {scheduledAt: new Date(flow.scheduled_at)}),
        createdAt: new Date(flow.created_at),
        updatedAt: new Date(flow.updated_at),
      }
    })

    return ok(flows)
  } catch(e) {
    logger.exception(context, 'flow.store.updateFlow', e)
    return err(ErrCode.EXCEPTION)
  }
}

interface SelectOneFlowOptions {
  flowId: number;
}

export async function selectOneFlow(context: IContext, options: SelectOneFlowOptions): Promise<Result<FlowRecord, ErrCode>> {
  const {logger, store: {reader}} = context

  try {
    const pool = await reader()

    const record = await db.selectOne('telenutrition.schedule_flow', {
      flow_id: options.flowId,
    }).run(pool)

    if (record === undefined) {
      logger.error(context, 'flow.store.selectOneFlow', 'flow not found in database', {flowId: options.flowId})
      return err(ErrCode.NOT_FOUND);
    }
    
    const mapResult = mapStoreRecord(context, record)

    if (mapResult.isErr()) {
      logger.error(context, 'flow.store.selectFlowByAppointmentId', 'error mapping flow store record', {flowId: record.flow_id})
      return err(mapResult.error)
    }

    const flow = mapResult.value

    return ok(flow)
  } catch (e) {
    logger.exception(context, 'flow.store.selectOneFlow', e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function selectFlowByAppointmentId(context: IContext, appointmentId: number): Promise<Result<FlowRecord, ErrCode>> {
  const {logger, store: {reader}} = context

  try {
    const pool = await reader()

    const record = await db.selectOne('telenutrition.schedule_flow', {
      appointment_id: appointmentId,
    }).run(pool)

    if (record === undefined) {
      logger.warn(context, 'flow.store.selectFlowByAppointmentId', 'flow not found in database for appointment', {appointmentId})
      return err(ErrCode.NOT_FOUND)
    }

    const mapResult = mapStoreRecord(context, record)

    if (mapResult.isErr()) {
      logger.error(context, 'flow.store.selectFlowByAppointmentId', 'error mapping flow store record', {flowId: record.flow_id})
      return err(mapResult.error)
    }

    const flow = mapResult.value

    return ok(flow)
  } catch (e) {
    logger.exception(context, 'flow.store.selectOneFlow', e)
    return err(ErrCode.EXCEPTION)
  }
}

/**
 * SelectFlowByContactAttrsOptions: The attributes that can be tested for containment via the 'contact'
 * element of the flow state.
 */
export interface SelectFlowByContactOptions {
  city?: string;
  email?: string;
  state?: string;
  address?: string;
  zipcode?: string;
  phone_home?: string;
  phone_mobile?: string;
}

/**
 * Select a flow based upon containment of 'contact' element. Matching against 'phone_mobile' might be a common
 * use case.
 * 
 * @param context 
 * @param contactOptions 
 */
export async function selectFlowByContact(context:IContext, contactOptions: SelectFlowByContactOptions): Promise<Result<FlowRecord | undefined, ErrCode>> {
  const {logger, store: {writer}} = context
  const TAG = [ ...MTAG, 'selectFlowByContact' ]

  try {
    const pool = await writer()

    const stateObject = {
      ...( contactOptions.city && { city: contactOptions.city }),
      ...( contactOptions.email && { email: contactOptions.email }),
      ...( contactOptions.state && { state: contactOptions.state }),
      ...( contactOptions.address && { address: contactOptions.address }),
      ...( contactOptions.zipcode && { zipcode: contactOptions.zipcode }),
      ...( contactOptions.phone_home && { phone_home: contactOptions.phone_home }),
      ...( contactOptions.phone_mobile && { phone_mobile: contactOptions.phone_mobile }),
    }

    const selectedFlow = await db.sql<zs.telenutrition.schedule_flow.SQL, zs.telenutrition.schedule_flow.JSONSelectable[]>`
      SELECT * FROM ${"telenutrition.schedule_flow"} WHERE ${{
        state: db.sql`${db.self} @> ${db.raw(`'${JSON.stringify(stateObject)}'`)}`
      }} LIMIT 1`.run(pool)

    if (selectedFlow.length) {
      const mappedResult = mapStoreRecord(context, selectedFlow[0])

      if (mappedResult.isErr()) {
        logger.error(context, TAG, 'Invalid record.'), {
          store_record: selectedFlow[0]
        }

        return err(ErrCode.INVALID_DATA)
      }
      return ok(mappedResult.value)
    }
    else {}
    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Select a flow based upon containment of 'contact' element. Matching against 'phone_mobile' might be a common
 * use case. Flow must be associated with a patient (appointment must have been booked).
 * 
 * @param context 
 * @param contactOptions 
 */
export async function selectFlowByPatientContact(context:IContext, contactOptions: SelectFlowByContactOptions): Promise<Result<FlowRecord | undefined, ErrCode>> {
  const {logger, store: {writer}} = context
  const TAG = [ ...MTAG, 'selectFlowByContact' ]

  try {
    const pool = await writer()

    const stateObject = {
      contact: {
        ...( contactOptions.city && { city: contactOptions.city }),
        ...( contactOptions.email && { email: contactOptions.email }),
        ...( contactOptions.state && { state: contactOptions.state }),
        ...( contactOptions.address && { address: contactOptions.address }),
        ...( contactOptions.zipcode && { zipcode: contactOptions.zipcode }),
        ...( contactOptions.phone_home && { phone_home: contactOptions.phone_home }),
        ...( contactOptions.phone_mobile && { phone_mobile: contactOptions.phone_mobile }),
      }
    }

    const selectedFlow = await db.sql<zs.telenutrition.schedule_flow.SQL, zs.telenutrition.schedule_flow.JSONSelectable[]>`
      SELECT * FROM ${"telenutrition.schedule_flow"} WHERE ${{
        state: db.sql`${db.self} @> ${db.raw(`'${JSON.stringify(stateObject)}'`)}`,
        patient_id: db.sql`${db.self} IS NOT NULL`,
      }} LIMIT 1`.run(pool)

    if (selectedFlow.length) {
      const mappedResult = mapStoreRecord(context, selectedFlow[0])
  
      if (mappedResult.isErr()) {
        logger.error(context, TAG, 'Invalid record.'), {
          store_record: selectedFlow[0]
        }
  
        return err(ErrCode.INVALID_DATA)
      }
      return ok(mappedResult.value)
    }
    else {
      logger.debug(context, TAG, 'Failed to select flow by patient contact.', {
        selectedFlow,
        contactOptions,
        stateObject,
      })
      return ok(undefined)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

function mapStoreRecord(context: IContext, record: zs.telenutrition.schedule_flow.JSONSelectable): Result<FlowRecord, ErrCode> {
  const {logger} = context

  try {
    return ok({
      flowId: record.flow_id,
      userId: record.user_id ?? undefined,
      federationId: record.federation_id ?? undefined,
      appointmentId: record.appointment_id ?? undefined,
      patientId: record.patient_id ?? undefined,
      scheduledAt: record.scheduled_at ? new Date(record.scheduled_at) : undefined,
      state: record.state as FlowState,
      insurance: record.insurance as FlowInsurance,
      timezone: record.timezone ?? undefined,
      flowType: record.flow_type as FlowType,
      currentStep: record.current_step ?? undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    })
  } catch (e) {
    logger.exception(context, 'flow.store.mapStoreRecord', e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  insertFlow,
  updateFlow,
  selectFlowsComplete,
  selectFlowByAppointmentId,
  selectOneFlow,
}