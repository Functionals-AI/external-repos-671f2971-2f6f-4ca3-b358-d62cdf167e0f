import { ok, err, Result } from 'neverthrow'
import { ErrCode } from '@mono/common/lib/error'
import { task, workflow, JsonObject } from "@mono/common-flows/lib/builder"
import CustomerIO from '@mono/telenutrition/lib/customerio'


const MTAG = 'telenutrition-flows.flows.cio-sync-segments'

enum State {
  Sync = 'Sync',
}

export default workflow(function(_config) {
  return {
    rate: '1 hour',
    startAt: State.Sync,
    states: {
      [State.Sync]: task({
        handler: async (context, _input): Promise<Result<JsonObject, ErrCode>> => {
          const tag = `${MTAG}.${State.Sync}`
          const { logger } = context

          try {
            const syncResult = await CustomerIO.Service.syncScheduledSegments(context);
            if (syncResult.isErr()) {
              return err(ErrCode.SERVICE);
            }
            return ok(syncResult.value as any)
          } catch (e) {
            logger.exception(context, tag, e)
            return err(ErrCode.EXCEPTION)
          }
        },
      }),
    }
  }
})