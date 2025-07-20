import { Context } from '@mono/common'
import Sync from '../sync'


(async function main() {
  const context = await Context.create()
  const syncCandidResult = await Sync.ProvidersAndLicenses.syncProvidersAndLicensesToCandid(context)
  if (syncCandidResult.isErr()) {
    console.log(`error`, syncCandidResult.error)
  } else {
    console.log(`ok`, syncCandidResult.value)
  }
})();
