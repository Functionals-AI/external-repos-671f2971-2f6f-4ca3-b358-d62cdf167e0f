import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { err, ok, Result } from 'neverthrow'
import Warehouse from '@mono/common/lib/warehouse'
import Logger from '@mono/common/lib/logger'
import { ScriptHandlerInput, ScriptHandlerOutput } from '@mono/common/lib/tasks/script'

const MTAG = Logger.tag()

async function sync(context: IContext, input: ScriptHandlerInput): Promise<Result<ScriptHandlerOutput, ErrCode>> {
  const TAG = [...MTAG, 'syncDials']
  const {logger} = context

  const syncResult = await Warehouse.Sync.sync(context)

  if (syncResult.isErr()) {
    logger.error(context, TAG, 'Warehouse sync error', { errCode: syncResult.error })
    return err(ErrCode.SERVICE)
  }

  const output = {
    syncResult: syncResult.value
  }

  return ok(output)
}


export default {
  sync,
}