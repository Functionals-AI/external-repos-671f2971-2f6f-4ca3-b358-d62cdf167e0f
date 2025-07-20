import { err, ok } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { succeed, task, workflow } from '@mono/common-flows/lib/builder'
import Warehouse from '@mono/foodapp/lib/warehouse'

const MTAG = [ 'foodapp-flows', 'flows', 'warehouse-sync' ]

enum State {
  Sync = 'Sync',
  Success = 'Success',
}

export default workflow(function(config) {
  return {
    //
    // 9 AM UTC -> 1AM PST, which is just after the weekly maintenance window.
    //   Give an additional 5 minutes also.
    //
    cron: '05 09 * * ? *',
    startAt: 'Sync',
    states: {
      [State.Sync]: task({
        handler: async (context, input) => {
          const { logger } = context 
          const TAG = [ ...MTAG, State.Sync ]

          try {
            const syncResult = await Warehouse.Sync.sync(context)

            if (syncResult.isErr()) {
              logger.error(context, TAG, 'Warehouse sync error', { errCode: syncResult.error })
              return err(ErrCode.SERVICE)
            }
          
            const output = {
              syncResult: syncResult.value
            }
          
            return ok(output)
          }
          catch (e) {
            logger.exception(context, TAG, e)

            return err(ErrCode.EXCEPTION)
          }
        },
        next: State.Success,
      }),
      [State.Success]: succeed()
    }
  }
})