import { Result, ok, err } from 'neverthrow'
import { Decimal } from 'decimal.js'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import * as zs from 'zapatos/schema'
import * as db from 'zapatos/db'

const MTAG = [ 'telenutrition', 'wallet', 'service' ]

export type WalletOptions = {
  pgClient?: db.TxnClientForSerializable
}

export type WalletRecord = {
  walletId: number,
  userId: number,
  balance: Decimal,
}

export async function getWallet(context: IContext, userId: number, options?: WalletOptions): Promise<Result<WalletRecord, ErrCode>> {
  const { logger, store: { reader} } = context
  const TAG = [ ...MTAG, 'getWallet' ]  

  try {
    const pool = options?.pgClient ?? await reader()
    const selected = await db.selectOne('telenutrition.wallet', {
      user_id: userId,
    }).run(pool)

    if (selected === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    logger.debug(context, TAG, 'Selected wallet.', {
      wallet: selected,
    })

    return ok({
      walletId: selected.wallet_id,
      userId,
      balance: new Decimal(selected.balance.replace(/^\$/, '').replace(',', '')),
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function createWallet(context: IContext, userId, options?: WalletOptions): Promise<Result<WalletRecord, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'createWallet' ]

  try {
    const pool = options?.pgClient ?? await writer()
    const created = await db.insert('telenutrition.wallet', {
      user_id: userId,
    }).run(pool)

    return ok({
      walletId: created.wallet_id,
      userId,
      balance: new Decimal(created.balance.replace(/^\$/, '').replace(',', '')),
    })    
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function upsertWallet(context: IContext, userId: number, options?: WalletOptions): Promise<Result<WalletRecord, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'upsertWallet' ]

  try {
    const getResult = await getWallet(context, userId, options)

    if (getResult.isErr()) {
      if (getResult.error === ErrCode.NOT_FOUND) {
        const createResult = await createWallet(context, userId, options)

        if (createResult.isErr()) {
          logger.error(context, TAG, 'Unable to create wallet.', {
            userId,
          })

          return err(ErrCode.STATE_VIOLATION)
        }
        return ok(createResult.value)
      }
      logger.error(context, TAG, 'Error getting wallet.', {
        userId,
      })

      return err(getResult.error)
    }
    return ok(getResult.value)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

interface InstacartFreshFundsWalletTransactionMeta {
  type: 'instacart_code_grant',
  instacartCodeId: string | string[],
  instacartCode: string | string[],
  incentiveId: number,
  incentiveLabel: string,
  rewardId: number,
  rewardDescription: string,
  rewardUserId: number,
  accountId: number,
}

interface InstacartFreshFundsCorrectionWalletTransactionMeta {
  type: 'instacart_code_grant_correction',
  instacartCodeId: string,
  instacartCode: string,
  rewardId: number,
  rewardDescription: string,
  rewardUserId: number,
}

export interface WalletTransactionNewRecord {
  amount: string,
  label: string,
  meta: InstacartFreshFundsWalletTransactionMeta | InstacartFreshFundsCorrectionWalletTransactionMeta,
  transactedAt: Date,
}

export async function updateWallet(context: IContext, wallet: WalletRecord, transaction: WalletTransactionNewRecord, options?: WalletOptions) {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'updateWallet' ]
  
  try {
    const pool = options?.pgClient ?? await writer()

    logger.debug(context, TAG, 'Updating wallet.', {
      wallet,
      transaction,
      options,
    })

    let metaToInsert: zs.telenutrition.reward_user.Insertable['meta']
    switch(transaction.meta.type) {
      case 'instacart_code_grant':
        metaToInsert = { ...transaction.meta }
        break;
      case 'instacart_code_grant_correction':
        metaToInsert = { ...transaction.meta }
        break;
      default:
        logger.error(context, TAG, 'Received unknown schema type when trying to insert wallet transaction.', { transaction })
        return err(ErrCode.NOT_IMPLEMENTED)
    }
  
    const insertedTransaction = await db.insert('telenutrition.wallet_transaction', {
      wallet_id: wallet.walletId,
      amount: transaction.amount,
      label: transaction.label,
      meta: metaToInsert,
      transacted_at: transaction.transactedAt,
    }).run(pool)

    logger.debug(context, TAG, 'Inserted transaction.', {
      insertedTransaction,
    })
  
    //
    // UPDATE "telenutrition"."wallet" SET balance = balance::numeric + <amount> WHERE wallet_id = <wallet.walletId> RETURNING *;
    //
    const updateWalletResult = await db.sql<zs.telenutrition.wallet.SQL, zs.telenutrition.wallet.Selectable[]>`
      UPDATE "telenutrition"."wallet" SET balance = balance::numeric + ${db.param(transaction.amount)} WHERE wallet_id = ${db.param(wallet.walletId)} RETURNING *;
    `.run(pool)
  
    if (updateWalletResult.length !== 1) {
      logger.error(context, TAG, 'Error updating wallet.', {
        wallet,
        options,
        updateWalletResult,
      })
 
      return err(ErrCode.STATE_VIOLATION)
    }
  
    const updatedWallet = updateWalletResult[0]
  
    return ok({
      walletId: updatedWallet.wallet_id,
      userId: updatedWallet.user_id,
      balance: new Decimal(updatedWallet.balance.replace(/^\$/, '').replace(',', '')),
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  getWallet,
  createWallet,
  upsertWallet,
  updateWallet,
}
