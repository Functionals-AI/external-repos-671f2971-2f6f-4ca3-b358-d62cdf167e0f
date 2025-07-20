import { ok, err } from 'neverthrow'
import { workflow, task } from '@mono/common-flows/lib/builder'
import { IContext } from '@mono/common/lib/context';
import Rippling from '@mono/ops/lib/rippling'

enum State {
  SyncEmployees = 'SyncEmployees',
  SyncUsers = 'SyncUsers',
  MapProvidersToEmployees = 'MapProvidersToEmployees',
}

export default workflow(function (config) {
  if (config.isProduction) {
    return {
      rate: '1 day',
      startAt: State.SyncEmployees,
      states: {
        [State.SyncEmployees]: task({
          handler: async (context: IContext) => {
            const result = await Rippling.Service.syncEmployees(context);
            if (result.isErr()) {
              return err(result.error)
            }
            return ok(result.value as any);
          },
          next: State.SyncUsers
        }),
        [State.SyncUsers]: task({
          handler: async (context: IContext) => {
            const result = await Rippling.Service.syncUsers(context);
            if (result.isErr()) {
              return err(result.error)
            }
            return ok(result.value as any);
          },
          next: State.MapProvidersToEmployees
        }),
        [State.MapProvidersToEmployees]: task({
          handler: async (context: IContext) => {
            const result = await Rippling.Service.mapProvidersToEmployees(context);
            if (result.isErr()) {
              return err(result.error)
            }
            return ok(result.value as any);
          },
        }),
      },
    }
  }
});
