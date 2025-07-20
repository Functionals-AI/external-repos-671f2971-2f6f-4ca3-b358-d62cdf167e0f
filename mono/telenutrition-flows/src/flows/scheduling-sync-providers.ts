import {ok, err} from 'neverthrow'
import {workflow, task, JsonObject} from '@mono/common-flows/lib/builder'
import Scheduling from '@mono/telenutrition/lib/scheduling'

enum State {
  SyncProviders = 'SyncProviders',
}

export default workflow(function (_config) {
  return {
    rate: '30 minutes',
    startAt: State.SyncProviders,
    states: {
      [State.SyncProviders]: task({
        handler: async (context, _input) => {
          const syncResult = await Scheduling.Sync.syncProviders(context)
          
          if (syncResult.isErr()) {
            return err(syncResult.error)
          }
      
          const reports = syncResult.value

          return ok({reports} as JsonObject)
        },
      })
    }
  }
})

