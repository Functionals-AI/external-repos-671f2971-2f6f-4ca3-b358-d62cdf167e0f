import { ok, err, Result } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { Logger } from '@mono/common'
import { succeed, task, workflow, JsonObject } from "@mono/common-flows/lib/builder";
import Foodapp from '@mono/foodapp'
import Etl from '@mono/foodapp/lib/customerio/etl'

const MTAG = Logger.tag()

enum State {
  Extract = 'Extract',
  Transform = 'Transform',
  Success = 'Success',
}

export default workflow(function(config) {
  return {
    event: {
      bus: Foodapp.Warehouse.Events.eventBusName,
      source: [ 'foodsmart' ],
      detailType: [ Foodapp.Warehouse.Events.EventTypes.WarehouseSyncCompleted ],
    },
    startAt: State.Extract,
    states: {
      [State.Extract]: task({
        handler: async (context, input): Promise<Result<JsonObject, ErrCode>> => {
          const TAG = [...MTAG, 'Extract']
          const { logger } = context

          try {
            logger.info(context, TAG, 'Entered handler.', { input, })

            const result = await Etl.extract(context)

            if (result.isErr()) {
              // @ts-ignore
              return err(result.error)
            }
            return ok({ ...result.value } as JsonObject)
          }
          catch (e) {
            return err(ErrCode.EXCEPTION)
          }
        },
        next: State.Transform,
      }),
      [State.Transform]: task({
        // @ts-ignore
        handler: async (context, input) => {
          const TAG = [...MTAG, 'Extract']
          const { logger } = context
      
          try {
            logger.info(context, TAG, 'Entered handler.', { input, })

            const cioEtlS3BucketName = config.marketing_cdk.customerio.s3BucketName

            logger.info(context, TAG, 'Fetched bucket.', { bucket_name: cioEtlS3BucketName })

            const result = await Etl.transform(
              context,
              cioEtlS3BucketName,
            )

            if (result.isErr()) {
              return err(result.error)
            }
            return ok({ ...result.value } as JsonObject)
          }
          catch (e) {
            return err(ErrCode.EXCEPTION)
          }
        },
        next: State.Success,
      }),
      [State.Success]: succeed()
    }
  }
})