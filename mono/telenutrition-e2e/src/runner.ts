import {Context, Logger} from '@mono/common'
import { IContext } from '@mono/common/lib/context'
import { runTask } from '@mono/common-flows/lib/runner'

import flows from './flows'

const MTAG = Logger.tag()

function signals(context: IContext) {
  process.on('SIGTERM', async () => {
    destroy(context)
  })
}

async function destroy(context: IContext) {
  await Context.destroy(context)
}

async function main() {
  const TAG = [...MTAG, 'main']
  const flowId = process.argv[2]
  const taskId = process.argv[3]
  const context = await Context.create()
  const {logger} = context
  
  try {
    signals(context)
    
    const result = await runTask(context, flows, flowId, taskId)  
    process.exitCode = result.isOk() ? 0 : 1    
  } catch(e) {
    logger.exception(context, TAG, e)
    process.exitCode = 1
  } finally {
    await destroy(context)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
