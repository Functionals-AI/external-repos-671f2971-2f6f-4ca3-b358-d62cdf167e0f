import {Context, Logger} from '@mono/common'
import { IContext } from '@mono/common/lib/context'
import { runTask } from '@mono/common-flows/lib/runner'
import Config from '@mono/ops/lib/config'

import flows from './flows'

const MTAG = Logger.tag()

function signals(context: IContext) {
  process.on('SIGTERM', async () => {
    terminate(context)
  })
}

async function terminate(context: IContext) {
  await Context.destroy(context)
  process.exit()
}

async function main() {
  const TAG = [...MTAG, 'main']
  const flowId = process.argv[2]
  const taskId = process.argv[3]
  const domainConfig = await Config.from()
  const context = await Context.create({ domainConfig, })
  const {logger} = context
  
  try {
    signals(context)
    
    const result = await runTask(context, flows, flowId, taskId)

    if (result.isErr()) {
      process.exitCode = 1
    } 
  } catch(e) {
    logger.exception(context, TAG, e)
    process.exitCode = 1
  } finally {
    await terminate(context)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})