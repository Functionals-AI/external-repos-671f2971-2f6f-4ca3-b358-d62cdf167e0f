import { workflow, task } from '@mono/common-flows/lib/builder'
import { IContext } from '@mono/common/lib/context';
import Workramp from '@mono/telenutrition/lib/workramp';
import { ok, err } from 'neverthrow'

enum State {
  SyncContacts = 'SyncContacts',
  SyncContactPaths = 'SyncContactPaths',
}

export default workflow(function (_config) {
    return {
      rate: '1 day',
      startAt: State.SyncContacts,
      states: {
        [State.SyncContacts]: task({
          handler: async (context: IContext) => {
            const result = await Workramp.Sync.syncContacts(context);
            if (result.isErr()) {
              return err(result.error)
            }
            return ok(result.value as any);
          },
          next: State.SyncContactPaths
        }),
        [State.SyncContactPaths]: task({
          handler: async (context: IContext) => {
            const result = await Workramp.Sync.syncContactPaths(context);
            if (result.isErr()) {
              return err(result.error)
            }
            return ok(result.value as any);
            }
        })
      }
    }
});
