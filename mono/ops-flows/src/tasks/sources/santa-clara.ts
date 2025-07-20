import { ErrCode } from "@mono/common/lib/error";
import { IContext } from "@mono/common/lib/context"
import { JsonObject, TaskBuilder, task } from "@mono/common-flows/lib/builder"
import { ok, err, Result } from "neverthrow";

import {
  completeReferralFoodActions,
  createReferralDeclineActions,
  createReferralFoodActions
} from '@mono/common/lib/referral/sources/santaclara/process-referrals';

export interface GenerateAndExportOutboundReferralsOptions extends Omit<TaskBuilder, 'handler' | 'type'> { 
  flowName: string,
}

const S3_KEY_PREFIX = 'santa-clara/outbound/referrals/'
const S3_FILENAME_PREFIX_PROD = 'Prod_Foodsmart_MTMMSFAuthorizations_'
const S3_FILENAME_PREFIX_TEST = 'Test_Foodsmart_MTMMSFAuthorizations_'

function getS3Key(context: IContext): string {
  const { config } = context
  const todaysDate = new Date().toISOString().split('T')[0].replace(/-/g, '');

  let file_prefix = S3_FILENAME_PREFIX_PROD
  if (config.env !== 'production') {
    file_prefix = S3_FILENAME_PREFIX_TEST
  }

  return `${S3_KEY_PREFIX}${file_prefix}${todaysDate}.txt`
}

export function generateAndExportOutboundReferrals(
  options: GenerateAndExportOutboundReferralsOptions
): TaskBuilder {
  return task({
    ...options,
    handler: async function(
      context: IContext,
      input: JsonObject
    ): Promise<Result<JsonObject, ErrCode>> {
      const { flowName } = options
      const { logger, config } = context
      const TAG = [ 'ops-flows', 'tasks', flowName, 'generateAndExportOutboundReferrals' ]

      const outputBucket = config.ops_cdk?.data?.destBuckets?.externalData.name;

      if (!outputBucket) {
        return err(ErrCode.EXCEPTION);
      }

      logger.info(context, TAG, `Generating and exporting outbound referrals for ${flowName}`)

      const createFoodActionsResult = await createReferralFoodActions(context)
      if (createFoodActionsResult.isErr()) {
        logger.error(context, TAG,
          `Failed to create referral food actions for ${flowName}`,
          { error: createFoodActionsResult.error }
        )

        return err(createFoodActionsResult.error)
      }

      const createDeclineActionsResult = await createReferralDeclineActions(context)
      if (createDeclineActionsResult.isErr()) {
        logger.error(context, TAG,
          `Failed to create referral decline actions for ${flowName}`,
          { error: createDeclineActionsResult.error }
        )

        return err(createDeclineActionsResult.error)
      }

      const completeActionsResult = await completeReferralFoodActions(
        context,
        outputBucket,
        getS3Key(context)
      )
      if (completeActionsResult.isErr()) {
        logger.error(context, TAG,
          `Failed to complete referral actions for ${flowName}`,
          { error: completeActionsResult.error }
        )

        return err(completeActionsResult.error)
      }

      return ok(input)
    }
  })
}

export default {
  generateAndExportOutboundReferrals,
}
