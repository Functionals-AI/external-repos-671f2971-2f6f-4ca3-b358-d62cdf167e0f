import { ok, err } from 'neverthrow'
import { workflow, task } from '@mono/common-flows/lib/builder'
import { IContext } from '@mono/common/lib/context';
import Slots from '@mono/telenutrition/lib/scheduling/slots';

enum State {
  AllocateSlots = 'AllocateSlots',
}

export default workflow(function (_config) {
  return {
    rate: '1 hour',
    startAt: State.AllocateSlots,
    states: {
      [State.AllocateSlots]: task({
        handler: async (context: IContext) => {
          const result = await Slots.Sync.allocateScheduleSlots(context)
          if (result.isErr()) {
            return err(result.error)
          }
          return ok(result.value as any);
        },
      }),
    }
  }
});
