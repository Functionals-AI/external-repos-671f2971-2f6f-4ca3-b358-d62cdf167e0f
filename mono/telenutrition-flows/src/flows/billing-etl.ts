import { ok, err } from 'neverthrow';
import { workflow, task } from '@mono/common-flows/lib/builder';
import { IContext } from '@mono/common/lib/context';
import Billing from '@mono/telenutrition/lib/billing';

enum State {
  ProcessAllContracts = 'ProcessAllContracts',
}

export default workflow(function (_config) {
  return {
    cron: '0 6 * * ? *',
    startAt: State.ProcessAllContracts,
    states: {
      [State.ProcessAllContracts]: task({
        handler: async (context: IContext) => {
          const result = await Billing.Service.processAllBillingContracts(context);
          if (result.isErr()) {
            return err(result.error);
          }
          return ok({});
        },
      }),
    },
  };
});
