import { ok, err, Result } from 'neverthrow'
import { z } from 'zod'

import { ErrCode } from '@mono/common/lib/error'
import { Logger } from '@mono/common'
import { createEnrollmentLink } from '@mono/telenutrition/lib/iam/enrollment'
import { succeed, task, workflow, JsonObject } from "@mono/common-flows/lib/builder"
import { createSegment, syncSegment, syncCustomersWithSql } from '@mono/telenutrition/lib/customerio/service'


const MTAG = Logger.tag()


enum State {
  Create = 'Create',
  Success = 'Success',
}

const CreateInputSchema = z.object({
  name: z.string(),
  description: z.string().default(''),
  sql: z.string(),
  runInterval: z.string().regex(/^\d+\s+(year|month|week|day|years|months|weeks|days)$/).optional(),
})

export default workflow(function (_config) {
  return {
    startAt: State.Create,
    states: {
      [State.Create]: task({
        handler: async (context, input): Promise<Result<JsonObject, ErrCode>> => {
          const TAG = [...MTAG, 'Create']
          const { logger } = context

          try {
            // VALIDATE INPUT
            const resultInput = CreateInputSchema.safeParse(input)

            if (!resultInput.success) {
              logger.error(context, TAG, `invalid task input`, { input })
              return err(ErrCode.INVALID_DATA)
            }

            const { name, description, sql, runInterval } = resultInput.data

            // SYNC CUSTOMERS
            const resultSyncCustomers = await syncCustomersWithSql(context, sql, {
              custom: async (context, customer) => {
                // use whitelist for CCH since they have so many bad email addresses
                if (customer.user_id === undefined && customer.account_id !== undefined) {
                  const resultEnrollment = await createEnrollmentLink(context, customer.account_id, { eligibleId: customer.eligible_id, lang: customer.lang, utmSource: 'cio', utmMedium: 'email' })

                  if (resultEnrollment.isErr()) {
                    logger.error(context, 'syncSegment', 'failed to create enrollment link, skipping record', { eligibleId: customer.eligible_id })
                    return err(resultEnrollment.error)
                  }

                  return ok({ ...customer, enroll_url: resultEnrollment.value })
                }

                return ok({ ...customer })
              }
            })

            if (resultSyncCustomers.isErr()) {
              logger.error(context, TAG, `Failed to sync customers.`, { sql })
              return err(resultSyncCustomers.error)
            }

            const segment = { name, description, sql, runInterval }

            // CREATE SEGMENT
            const resultCreateSegment = await createSegment(context, segment)

            if (resultCreateSegment.isErr()) {
              logger.error(context, TAG, `Failed to create segment.`, segment)
              return err(resultCreateSegment.error)
            }

            // SYNC SEGMENT
            const resultSyncSegment = await syncSegment(context, resultCreateSegment.value)

            if (resultSyncSegment.isErr()) {
              logger.error(context, TAG, `Failed to create segment.`, segment)
              return err(resultSyncSegment.error)
            }

            return ok({ count: resultSyncSegment.value } as JsonObject)
          }
          catch (e) {
            logger.error(context, TAG, `Failed to create segment.`, { exception: e })
            return err(ErrCode.EXCEPTION)
          }
        },
        next: State.Success,
      }),
      [State.Success]: succeed()
    }
  }
})