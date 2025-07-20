import Context, { IContext } from '@mono/common/lib/context'
import { upsertIdentities } from '../../eligibility/service'

const MTAG = [ 'telenutrition', 'scripts', 'upsert-identities' ]

async function main() {
  const context = await Context.create()
  const { logger } = context
  const TAG = [ ...MTAG, 'main' ]

  try {
    const result = await upsertIdentities(context)

    if (result.isErr()) {
      throw new Error(`error: ${result.error}`)
    }
  } catch (e) {
    logger.exception(context, `${TAG}.error`, e)
  } finally {
    await Context.destroy(context)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
