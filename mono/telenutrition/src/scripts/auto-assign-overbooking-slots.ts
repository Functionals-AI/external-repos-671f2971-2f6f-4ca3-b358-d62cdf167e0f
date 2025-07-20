import { Context } from '@mono/common'
import Vacancy from '../scheduling/vacancy'


(async function main() {
  const context = await Context.create()
  
  const result = await Vacancy.Service.autoAssignOverbookingSlots(context)
  if (result.isErr()) {
    console.log(`error`, result.error)
  } else {
    console.log(`ok`, result.value)
  }
})();
