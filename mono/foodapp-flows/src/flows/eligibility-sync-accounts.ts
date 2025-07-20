import { ok, err } from 'neverthrow'
import { workflow, task } from '@mono/common-flows/lib/builder'
import { IContext } from '@mono/common/lib/context'
import Foodapp from '@mono/foodapp'

enum State {
  SyncAccounts = 'SyncEligibilityAccounts',
}

export default workflow(function (config) {
  return {
    rate: '1 day',
    startAt: State.SyncAccounts,
    states: {
      [State.SyncAccounts]: task({
        handler: async (context: IContext) => {
          const result = await Foodapp.Sync.syncEligibilityAccounts(context);
          if (result.isErr()) {
            return err(result.error)
          }
          return ok(result.value as any);
        },
      }),
    }
  }
});
