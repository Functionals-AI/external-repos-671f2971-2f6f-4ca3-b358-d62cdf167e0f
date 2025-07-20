import { ok, err } from 'neverthrow'
import { workflow, task } from '@mono/common-flows/lib/builder'
import { IContext } from '@mono/common/lib/context';
import Candid from '@mono/telenutrition/lib/candid';

enum State {
  Sync = 'Sync',
}

export default workflow(function (_config) {
  return {
    cron: '0 8 * * ? *',
    startAt: State.Sync,
    states: {
      [State.Sync]: task({
        handler: async (context: IContext, input) => {
          const result = await Candid.Sync.TransactionEncounters.syncAll(context, input)
          if (result.isErr()) {
            return err(result.error)
          }
          return ok(result.value as any);
        },
      }),
    }
  }
});
