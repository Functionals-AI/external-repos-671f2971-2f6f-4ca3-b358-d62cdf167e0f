import Context from '@mono/common/lib/context'
import { createSegment } from '../service'


async function main() {
  const context = await Context.create()
  const { logger } = context

  const result = await createSegment(context, { name: 'CCH_GroupA_Wave0_0408', description: 'CCH GroupA Wave0', sql: 'select * from foo' })

  if (result.isErr()) {
    console.log(`error: ${result.error}`)
  } else {
    console.log(result.value)

  }

}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})