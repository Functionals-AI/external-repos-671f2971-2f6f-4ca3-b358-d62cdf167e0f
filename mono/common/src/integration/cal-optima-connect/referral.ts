/**
 * Delegate to browser interface for  state change.
 */
import { Result, ok, err } from 'neverthrow'

import { IContext } from '../../context'
import { ErrCode } from '../../error'
import { CaloptimaConnectContext, ServiceStatus as ReferralStatus, updateServiceStatus } from './browser'
export { ServiceStatus as ReferralStatus } from './browser'

const MTAG = [ 'common', 'integration', 'cal-optima-safety-net-connect', 'referral' ]

export interface UpdateReferralStatusOptions {
  dryRun?: boolean,
  sourceContext?: CaloptimaConnectContext,
  appointmentDate?: Date,
}

export async function updateReferralStatus(context: IContext, patientId: string, serviceId: string, status: ReferralStatus, options?: UpdateReferralStatusOptions): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [...MTAG, 'updateReferralStatus']

  try {
    logger.debug(context, TAG, 'Updating CalOptima service status.', {
      patientId,
      serviceId,
      status,
    })
    const result = await updateServiceStatus(context, patientId, serviceId, status, options)

    if (result.isErr()) {
      return err(result.error)
    }
    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  updateReferralStatus,
}