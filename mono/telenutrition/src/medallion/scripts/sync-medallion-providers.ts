import { Context } from '@mono/common'
import Sync from '../sync'


(async function main() {
  const context = await Context.create()
  const syncMedallionResult = await Sync.syncProvidersFromMedallion(context)
  if (syncMedallionResult.isErr()) {
    console.log(`error`, syncMedallionResult.error)
  } else {
    console.log(`ok`, syncMedallionResult.value)
  }
})();
