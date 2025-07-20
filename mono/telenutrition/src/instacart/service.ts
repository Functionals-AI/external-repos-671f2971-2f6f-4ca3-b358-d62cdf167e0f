import { Result, ok, err } from 'neverthrow'
import * as pg from 'pg'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import * as db from 'zapatos/db'
import * as zs from 'zapatos/schema'
import { conditions as dc } from 'zapatos/db'
import { WalletRecord } from '../wallet/service'

const MTAG = [ 'telenutrition', 'instacart', 'service' ]

export type InstacartOptions = {
  pgClient?: db.TxnClientForSerializable
}

export type InstacartCodeRecord = {
  instacartCodeId: string,
  code: string,
  url: string,
  walletId: number,
  initialBalance: string,
}

/**
 * @typedef {Object} GetAvailableCodesOptions - Options for selection of available codes.
 * @property {string} [instacartCode] - A specific code if it is available and satisfies any other criteria.
 *                                      IE: see within1stMonthOfTwo if provided.
 * @property {boolean} [within1stMonthOfTwo=false] - now() must fall in the fist month of two before expiration.
 */
export interface GetAvailableCodesOptions {
  instacartCode?: string,
  within1stMonthOfTwo?: boolean,
  pgClient?: pg.Pool | db.TxnClientForSerializable,
}

/**
 * Select available Instacart Codes for a given denomination (initialBalance).
 * 
 * @param context 
 * @param {string} initialBalance - Denomination as 'xx.00'.
 * @param {number} numberOfCodesRequired  - How many.
 * @param {GetAvailableCodesOptions} options - Additional options.
 */
export async function selectAvailableCodes(context: IContext, initialBalance: string, numberToSelect: number = 1, options: GetAvailableCodesOptions = { within1stMonthOfTwo: false }): Promise<Result<InstacartCodeRecord[], ErrCode>> {
  const { logger, store: { reader, }, } = context
  const TAG = [ ...MTAG, 'selectAvailableCodes' ]

  try {
    const pgClient = options.pgClient || await reader()
    const instacartCodeWhereable: zs.telenutrition.instacart_code.Whereable = {
      wallet_id: dc.isNull,
      initial_balance: initialBalance,
      activation_at: dc.lte(dc.now)
    }
    
    //
    // Code is provide. Must be able to use this one.
    //
    if (options.instacartCode) {
      instacartCodeWhereable.code = options.instacartCode
    }
    
    if (options?.within1stMonthOfTwo === true) {
      //
      // now() IS BETWEEN ((expiration_at - 2 month) AND (expiration_at - 1 month)
      //
      // instacartCodeWhereable.expiration_at = db.sql`now() BETWEEN ${db.self} - interval '2 month' AND ${db.self} - interval '1 month'`
      //
      // But, lets be explict wrt boundaries. Following are expected:
      //  activation_at: 2025-03-01
      //  expiration_at: 2025-05-01
      //
      // Note, activation_at must be lte dc.now (see initializaiton).
      //
      instacartCodeWhereable.expiration_at = dc.and(
        db.sql`now() >= ${db.self} - interval '2 month'`,
        db.sql`now() <  ${db.self} - interval '1 month'`
      )
    }
    
    const selectedInstacartCodes = await db.sql<zs.telenutrition.instacart_code.SQL, zs.telenutrition.instacart_code.Selectable[]>`
      SELECT * FROM ${"telenutrition.instacart_code"} WHERE ${ instacartCodeWhereable } ORDER BY ${"expiration_at"} ASC LIMIT ${db.param(numberToSelect)}
    `.run(pgClient)
    
    logger.info(context, TAG, 'instacart query result.', {
      instacartCodeWhereable,
      numberToSelect,
      selectedInstacartCodes,
    })

    return ok(selectedInstacartCodes.map(selected => ({
      instacartCodeId: selected.instacart_code_id,
      code: selected.code,
      url: selected.url,
      walletId: selected.wallet_id as number,
      initialBalance: selected.initial_balance,
    })))
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function consumeInstacartCode(context: IContext, instacartCode: string, wallet: WalletRecord, options?: InstacartOptions): Promise<Result<InstacartCodeRecord, ErrCode>> {
  const { logger, store: { writer }} = context
  const TAG = [ ...MTAG, 'consumeInstacartCode' ]
  
  try {
    const pool = options?.pgClient ? options.pgClient : await writer()

    logger.debug(context, TAG, 'Getting instacart code.', {
      instacartCode,
    })
  
    const selectedInstacartCode = await db.sql<zs.telenutrition.instacart_code.SQL, zs.telenutrition.instacart_code.Selectable[]>`
      SELECT ${"instacart_code_id"} FROM ${"telenutrition.instacart_code"} WHERE ${{ code: instacartCode }}
    `.run(pool)
  
    if (selectedInstacartCode.length !== 1) {
      logger.error(context, TAG, 'Unable to get instacart code.', {
        instacartCode,
        selectedInstacartCode,
      })
  
      return err(ErrCode.NOT_FOUND)
    }

    const instacartCodeId = selectedInstacartCode[0].instacart_code_id

    logger.debug(context, TAG, 'Updating instacart code.', {
      instacartCode,
      selectedInstacartCode,
      instacartCodeId,
      data_type: typeof instacartCodeId,
    })

    const updateResult = await db.sql<zs.telenutrition.instacart_code.SQL, zs.telenutrition.instacart_code.Selectable[]>`
      UPDATE ${"telenutrition.instacart_code"} 
        SET ${"wallet_id"} = ${db.param(wallet.walletId)} 
        WHERE ${{ instacart_code_id: instacartCodeId }}
        RETURNING *
    `.run(pool)
  
    if (updateResult.length !== 1) {
      logger.error(context, TAG, 'Failed to consume instacart code.', {
        instacartCode,
        updateResult,
      })
  
      return err(ErrCode.STATE_VIOLATION)
    }
  
    const updated = updateResult[0]

    logger.debug(context, TAG, 'Updated instacart code.', {
      instacartCode,
      selectedInstacartCode,
      updated,
    })
  
    return ok({
      instacartCodeId: updated.instacart_code_id,
      code: updated.code,
      url: updated.url,
      walletId: updated.wallet_id as number,
      initialBalance: updated.initial_balance,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)
  
    return err(ErrCode.EXCEPTION)
  }
}
  
export default {
  consumeInstacartCode,
}
