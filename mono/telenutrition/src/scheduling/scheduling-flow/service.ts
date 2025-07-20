import { ok,err, Result } from 'neverthrow'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import Store from './store'
import { FlowCreateRecord, FlowRecord, FlowState, FlowType, FlowUpdateRecord, PaymentRecord } from './types'
import EmployerService from '../employer/service'
import { IdentityRecord } from '../../iam/types'
import { formatFederationId, isAppIdentity, isFederationIdentity } from '../../iam/identity/service'
import { UserRecord } from '../../iam/user/store'

interface CreateFlowOptions {
  identity: IdentityRecord,
  user: UserRecord,
  initialFlowState?: FlowState,
  flowType?: FlowType,
  uid?: number,
  patientId: number,
}

export async function createFlow(
  context,
  options: CreateFlowOptions
): Promise<Result<FlowRecord, ErrCode>> {
  const {logger} = context

  try {
    const record: FlowCreateRecord = {
      userId: options.user.userId,
      state: options.initialFlowState,
      insurance: {},
      flowType: options.flowType,
      patientId: options.patientId,
    };

    if (isFederationIdentity(options.identity)) {
      record.federationId = formatFederationId(options.identity)
    }
    
    const insertResult = await Store.insertFlow(context, record)

    if (insertResult.isErr()) {
      logger.error(context, 'flow.service.createFlow', 'Error creating flow', {rerror: insertResult.error, record})
      return err(insertResult.error)
    }

    return ok(insertResult.value)
  } catch(e) {
    logger.exception(context, 'flow.service.createFlow', e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function updateFlow(context: IContext, record: FlowUpdateRecord): Promise<Result<FlowRecord, ErrCode>> {
  const {logger} = context

  try {
    const updateResult = await Store.updateFlow(context, record)

    if (updateResult.isErr()) {
      logger.error(context, 'flow.service.updateFlow', 'Error updating flow', {error: updateResult.error, record})
      return err(updateResult.error)
    }

    return ok(updateResult.value)
  } catch(e) {
    logger.exception(context, 'flow.service.updateFlow', e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function queryFlowsComplete(context: IContext, minFlowId?: number): Promise<Result<FlowRecord[], ErrCode>> {
  const {logger} = context

  try {
    const result = await Store.selectFlowsComplete(context, {minFlowId})

    if (result.isErr()) {
      return err(result.error)
    }

    return ok(result.value)
  } catch(e) {
    logger.exception(context, 'flow.service.queryFlowsComplete', e)
    return err(ErrCode.EXCEPTION)
  }
}



export async function getEmployerInfo(context: IContext, payment: PaymentRecord): Promise<Result<string, ErrCode>> {
  if (payment.method !== 'employer') {
    return err(ErrCode.NOT_FOUND)
  }

  const result = await EmployerService.getEmployer(context, payment.employer_id)

  if (result.isErr()) {
    return err(result.error)
  }

  const employer = result.value

  if (employer.specialProgram === undefined) {
    return err(ErrCode.NOT_FOUND)
  }

  return ok(employer.specialProgram)
}


export async function canUpdateFlowId(context: IContext, identity: IdentityRecord, flowId: number): Promise<Result<true, ErrCode>> {
  const {logger} = context

  try {
    const result = await Store.selectOneFlow(context, {flowId})

    if (result.isErr()) {
      return err(result.error)
    }

    const flow = result.value
    return canUpdateFlow(context, identity, flow)
  } catch(e) {
    logger.exception(context, 'flow.service.canUpdateFlowId', e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function canUpdateFlow(context: IContext, identity: IdentityRecord, flow: FlowRecord): Promise<Result<true, ErrCode>> {
  const {logger} = context

  if (isAppIdentity(identity)) {
    if (flow.userId !== identity.uid) {
      logger.error(context, 'flow.service.canUpdateFlow', 'user does not have auth to update this flow', {identity, flowId: flow.flow_id})
      return err(ErrCode.AUTHENTICATION)
    }
  } else if (isFederationIdentity(identity)) {
    if (flow.federationId !== formatFederationId(identity)) {
      logger.error(context, 'flow.service.canUpdateFlow', 'user does not have auth to update this flow', {identity, flowId: flow.flow_id})
      return err(ErrCode.AUTHENTICATION)
    }
  } else {
    logger.error(context, 'flow.service.canUpdateFlow', 'identity record type not found', {identity, flow})
    return err(ErrCode.AUTHENTICATION)
  }

  return ok(true)
}

export async function getFlowByAppointment(context: IContext, appointmentId: number): Promise<Result<FlowRecord, ErrCode>> {
  const result = await Store.selectFlowByAppointmentId(context, appointmentId)

  if (result.isErr()) {
    return err(result.error)
  }

  const flow = result.value

  return ok(flow)
}


export default {
  createFlow,
  getFlowByAppointment,
  updateFlow,
  queryFlowsComplete,
  canUpdateFlow,
  canUpdateFlowId,
}
