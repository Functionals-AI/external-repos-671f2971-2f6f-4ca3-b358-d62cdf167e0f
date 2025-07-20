import { err, ok, Result } from 'neverthrow'
import { ErrCode } from '../error'
import {RowDataPacket} from 'mysql2'
import { IContext } from '../context'
import Logger from '../logger'

const MTAG = Logger.tag()

async function fetchSyncToken(context: IContext, name: string): Promise<Result<string, ErrCode>> {
  const TAG = [...MTAG, 'fetchSyncToken']
  const {mysql: {reader}, logger} = context

  try {
    const pool = await reader()
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT token
      FROM mcommon.sync
      WHERE name = ?
    `, [name])

    if (rows.length == 0) {
      return err(ErrCode.NOT_FOUND)
    }

    return ok(rows[0]['token'])
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

async function updateSyncToken(context: IContext, name: string, token: string): Promise<Result<void, ErrCode>> {
  const TAG = [...MTAG, 'updateSyncToken']
  const {mysql: {writer}, logger} = context


  try {
    const pool = await writer()
    await pool.query<RowDataPacket[]>(`
      UPDATE
        mcommon.sync
      SET token = ?
      WHERE name = ?
    `, [token, name])

    return ok(undefined)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  fetchSyncToken,
  updateSyncToken,
}