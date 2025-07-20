import { Context } from '@mono/common'
import Slots from '../scheduling/slots'


(async function main() {
  const context = await Context.create()
  
  const syncScheduleResult = await Slots.Sync.allocateScheduleSlots(context)
  if (syncScheduleResult.isErr()) {
    console.log(`error`, syncScheduleResult.error)
  } else {
    console.log(`ok`, syncScheduleResult.value)
  }
})();
