import { ok, err } from 'neverthrow'
import { workflow, task } from '@mono/common-flows/lib/builder'
import { IContext } from '@mono/common/lib/context';
import Candid from '@mono/telenutrition/lib/candid';

enum State {
  SyncProviders = 'SyncProviders',
}

export default workflow(function (_config) {
  return {
    rate: '1 day',
    startAt: State.SyncProviders,
    states: {
      [State.SyncProviders]: task({
        handler: async (context: IContext) => {
          const result = await Candid.Sync.ProvidersAndLicenses.syncProvidersAndLicensesToCandid(context);
          if (result.isErr()) {
            return err(result.error)
          }
          return ok(result.value as any);
        },
      }),
    }
  }
});
