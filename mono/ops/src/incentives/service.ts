import { Result, ok, err } from 'neverthrow'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'

import Store from './store'
import { InstacartCodeInventory } from './store'

const MTAG = [ 'ops', 'incentives', 'service' ]

export const CODE_USAGE_HISTORY_DAYS = 90

export interface InstacartCodeInventoryResult {
  historyDays: number,
  codeInventory: InstacartCodeInventory[]
}

export async function getInstacartCodeInventory(context: IContext): Promise<Result<InstacartCodeInventoryResult, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'getInstacartCodeInventory' ]

  try {
    const result = await Store.getInstacartCodeInventory(context)

    if (result.isErr()) {
      logger.error(context, TAG, 'Error getting code inventory.', {
        error: result.error,
      })

      return err(result.error)
    }

    return ok({
      historyDays: CODE_USAGE_HISTORY_DAYS,
      codeInventory: result.value,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e) 

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  getInstacartCodeInventory,
}