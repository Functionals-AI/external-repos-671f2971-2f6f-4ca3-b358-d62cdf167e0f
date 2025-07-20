import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import { err, ok, Result } from "neverthrow"
import { 
  Sources as ReferralSources,
  processRequestedReferrals as doProcessRequestedReferrals,
  processAcceptedReferrals as doProcessAcceptedReferrals,
  processInProgressReferrals as doProcessInProgressReferrals,
  processCompletedReferrals as doProcessCompletedReferrals,
} from '@mono/common/lib/referral/service'
import { JsonObject, task, TaskBuilder } from "@mono/common-flows/lib/builder"
import { ImportFunction, loadNewLeads } from "@mono/ops/lib/referral/service"

export interface ImportTaskOptions extends Omit<TaskBuilder, 'handler' | 'type'> { 
  flowName: string,
  importFunction: ImportFunction,
}

/**
 * Referral ingest task.
 */
export function importInboundReferrals(options: ImportTaskOptions): TaskBuilder {
  const { flowName, importFunction } = options
  return task({
    ...options,
    handler: async function (context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
      const { logger } = context 
      const TAG = [ 'ops-flows', 'tasks', flowName, 'importInboundReferrals' ]

      try {
        const referral = input['referral']
        const s3Bucket = referral['s3_bucket']
        const s3Key = referral['s3_key']
        const result = await importFunction(context, s3Bucket, s3Key, input)

        if (result.isOk()) {
          logger.info(context, TAG, 'Referral import completed successfully.', {
            result: result.value,
          })
          return ok( result.value as any as JsonObject)
        }
        else {
          logger.error(context, TAG, 'Error ingesting referrals.', {
            s3Key,
            s3Bucket,
            input,
          })

          return err(result.error)
        }
      }
      catch (e) {
        logger.exception(context, TAG, e)

        return err(ErrCode.EXCEPTION)
      }
    },
  })
}

export interface ProcessRequestedReferralsTaskOptions extends Omit<TaskBuilder, 'handler' | 'type'> { 
  flowName: string,
  source: ReferralSources,
  dryRun?: boolean,
}

/**
 * Accept new ('requested') referrals transitioning:
 *  - ones which can be accepted: 'requested' -> 'accepted'
 *  - ones which can not be accepted to declined: 'requested' -> 'declined'
 * 
 * @param options 
 */
export function processRequestedReferrals(options: ProcessRequestedReferralsTaskOptions): TaskBuilder {
  const { flowName, source, dryRun } = options
  return task({
    ...options,
    handler: async function(context: IContext): Promise<Result<JsonObject, ErrCode>> {
      const { logger } = context 
      const TAG = [ 'ops-flows', 'tasks', flowName, 'processRequestedReferrals' ]

      try {
        const result = await doProcessRequestedReferrals(context, source, dryRun ?? false)

        if (result.isErr()) {
          logger.error(context, TAG, 'Service error', {
            error: result.error
          })

          return err(result.error)
        }

        return ok(result.value as any as JsonObject)
      }
      catch (e) {
        logger.exception(context, TAG, e)

        return err(ErrCode.EXCEPTION)
      }
    }
  })
}

export interface ProcessAcceptedReferralsTaskOptions extends Omit<TaskBuilder, 'handler' | 'type'> { 
  flowName: string,
  source: ReferralSources,
  dryRun?: boolean,
}

/**
 * Process 'accepted' transitioning those which have had appointments scheduled to 'in-progress' status.
 * 
 * @param options 
 */
export function processAcceptedReferrals(options: ProcessAcceptedReferralsTaskOptions): TaskBuilder {
  const { flowName, source, dryRun } = options
  return task({
    ...options,
    handler: async function(context: IContext): Promise<Result<JsonObject, ErrCode>> {
      const { logger } = context 
      const TAG = [ 'ops-flows', 'tasks', flowName, 'processAcceptedReferrals' ]

      try {
        const result = await doProcessAcceptedReferrals(context, source, dryRun ?? false)

        if (result.isErr()) {
          logger.error(context, TAG, 'Service error', {
            error: result.error
          })

          return err(result.error)
        }

        return ok(result.value as any as JsonObject)
      }
      catch (e) {
        logger.exception(context, TAG, e)

        return err(ErrCode.EXCEPTION)
      }
    }
  })
}

export interface ProcessInProgressReferralsTaskOptions extends Omit<TaskBuilder, 'handler' | 'type'> { 
  flowName: string,
  source: ReferralSources,
  dryRun?: boolean,
}

/**
 * Process 'in-progress' referrals transitioning those which have had appointments completed to 'completed' status.
 * 
 * @param options 
 */
export function processInProgressReferrals(options: ProcessInProgressReferralsTaskOptions): TaskBuilder {
  const { flowName, source, dryRun } = options
  return task({
    ...options,
    handler: async function(context: IContext): Promise<Result<JsonObject, ErrCode>> {
      const { logger } = context 
      const TAG = [ 'ops-flows', 'tasks', flowName, 'processInProgressReferrals' ]

      try {
        const result = await doProcessInProgressReferrals(context, source, dryRun ?? false)

        if (result.isErr()) {
          logger.error(context, TAG, 'Service error', {
            error: result.error
          })

          return err(result.error)
        }

        return ok(result.value as any as JsonObject)
      }
      catch (e) {
        logger.exception(context, TAG, e)

        return err(ErrCode.EXCEPTION)
      }
    }
  })
}

export interface ProcessCompletedReferralsTaskOptions extends Omit<TaskBuilder, 'handler' | 'type'> { 
  flowName: string,
  source: ReferralSources,
  dryRun?: boolean,
}

/**
 * Process 'completed' referrals performing any referral actions as required.
 * 
 * @param options 
 */
export function processCompletedReferrals(options: ProcessCompletedReferralsTaskOptions): TaskBuilder {
  const { flowName, source, dryRun } = options
  return task({
    ...options,
    handler: async function(context: IContext): Promise<Result<JsonObject, ErrCode>> {
      const { logger } = context 
      const TAG = [ 'ops-flows', 'tasks', flowName, 'processCompletedReferrals' ]

      try {
        const result = await doProcessCompletedReferrals(context, source, dryRun ?? false)

        if (result.isErr()) {
          logger.error(context, TAG, 'Service error', {
            error: result.error
          })

          return err(result.error)
        }

        return ok(result.value as any as JsonObject)
      }
      catch (e) {
        logger.exception(context, TAG, e)

        return err(ErrCode.EXCEPTION)
      }
    }
  })
}

export interface LoadNewReferralLeadsTaskOptions extends Omit<TaskBuilder, 'handler' | 'type'> { 
  flowName: string,
  source: ReferralSources,
}

/**
 * Load leads for new referrals.
 * 
 * @param options 
 */
export function loadNewReferralLeads(options: LoadNewReferralLeadsTaskOptions): TaskBuilder {
  const { flowName, source } = options
  return task({
    ...options,
    handler: async function(context: IContext): Promise<Result<JsonObject, ErrCode>> {
      const { logger } = context 
      const TAG = [ 'ops-flows', 'tasks', flowName, 'loadNewReferralLeads' ]

      try {
        const result = await loadNewLeads(context, source)

        if (result.isErr()) {
          logger.error(context, TAG, 'Service error', {
            error: result.error
          })

          return err(result.error)
        }

        return ok(result.value as any as JsonObject)
      }
      catch (e) {
        logger.exception(context, TAG, e)

        return err(ErrCode.EXCEPTION)
      }
    }
  })
}

export default {
  importInboundReferrals,
  processRequestedReferrals,
  processAcceptedReferrals,
  processInProgressReferrals,
  processCompletedReferrals,
  loadNewReferralLeads,
}