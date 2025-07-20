import Context from '@mono/common/lib/context'
import { syncSegment } from '../service'


async function main() {
  const context = await Context.create()
  const { logger } = context


  const result = await syncSegment(context, 20)

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