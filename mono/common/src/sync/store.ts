import { Err, err, ok, Result } from 'neverthrow'
import { ErrCode } from '../error'
import { IContext } from '../context'
import Logger from '../logger'

import * as db from 'zapatos/db'

const MTAG = Logger.tag()

async function getToken(context: IContext, name: string): Promise<Result<string, ErrCode>> {
  const TAG = [...MTAG, 'store.getToken']
  const {store: {reader}, logger} = context

  try {
    const pool = await reader()
    const token = await db.selectOne('common.sync_token', {name}).run(pool)

    if (token === undefined) {
      logger.error(context, TAG, 'token with name not found in db', {token_name: name})
      return err(ErrCode.NOT_FOUND)
    }

    return ok(token.value)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

async function updateToken(context: IContext, name: string, value: string): Promise<Result<string, ErrCode>> {
  const TAG = [...MTAG, 'store.updateSyncToken']
  const {store: {writer}, logger} = context

  try {
    const pool = await writer()
    const result = await db.upsert('common.sync_token', {name, value}, ['name']).run(pool)

    return ok(result.value)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  getToken,
  updateToken,
}