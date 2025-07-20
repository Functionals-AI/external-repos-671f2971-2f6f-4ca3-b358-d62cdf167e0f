import { Result, ok, err } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import * as db from 'zapatos/db'
import * as zs from 'zapatos/schema'
import { DateTime } from 'luxon'

const MTAG = [ 'telenutrition', 'rewards', 'store' ]

export type StoreOptions = {
  pgClient?: db.TxnClientForSerializable
}

type RewardUserBase = {
  rewardId: number,
  userId: number,
}

type InstacartFreshFundsRewardUserMeta = {
  schemaType: 'instacart_fresh_funds'
  accountId: number,
  activityId: number,
  activityUserId: string,
  patientId: number,
  patientIdentityId: number,
  appointmentId: number,
  appointmentTypeId: number,
  walletId: number,
  instacartCodeId: string | string[],
  instacartCode: string | string[],
  instacartCodeUrl: string | string[],
  incentiveId: number,
  incentiveContractId: number,
}

type InstacartFreshFundsCorrectionRewardUserMeta = {
  schemaType: 'instacart_fresh_funds_correction'
  patientId: number,
  patientIdentityId: number,
  walletId: number,
  instacartCodeId: string | string[],
  instacartCode: string | string[],
  instacartCodeUrl: string | string[],
  grantedBy: string,
  grantedReason: string,
}

type RewardUserNewRecord = RewardUserBase & {
  meta: InstacartFreshFundsRewardUserMeta | InstacartFreshFundsCorrectionRewardUserMeta
}
type RewardUserRecord = { rewardUserId: number } & RewardUserNewRecord

export async function insertRewardUser(context: IContext, rewardUser: RewardUserNewRecord, options?: StoreOptions) : Promise<Result<RewardUserRecord, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'insertRewardUser' ]
      
  try {
    const pool = options?.pgClient ? options.pgClient : await writer()
    const meta = rewardUser.meta
    
    let metaToInsert: zs.telenutrition.reward_user.Insertable['meta']
    switch (meta.schemaType) {
      case 'instacart_fresh_funds':
        metaToInsert = {
          schema_type: meta.schemaType,
          activity_id: meta.activityId,
          user_activity_id: meta.activityUserId,
          patient_id: meta.patientId,
          patient_identity_id: meta.patientIdentityId,
          appointment_id: meta.appointmentId,
          appintment_type_id: meta.appointmentTypeId,
          wallet_id: meta.walletId,
          instacart_code_id: meta.instacartCodeId,
          instacart_code: meta.instacartCode,
          instacart_code_url: meta.instacartCodeUrl,
          incentive_id: meta.incentiveId,
          incentive_contract_id: meta.incentiveContractId,
          account_id: meta.accountId,
        }
        break;
      case 'instacart_fresh_funds_correction':
        metaToInsert = {
          schema_type: meta.schemaType,
          patient_id: meta.patientId,
          patient_identity_id: meta.patientIdentityId,
          wallet_id: meta.walletId,
          instacart_code_id: meta.instacartCodeId,
          instacart_code: meta.instacartCode,
          instacart_code_url: meta.instacartCodeUrl,
          granted_by: meta.grantedBy,
          granted_reason: meta.grantedReason,
        }
        break;
      default:
        logger.error(context, TAG, 'Received unknown schema type when trying to insert reward user.', { rewardUser })
        return err(ErrCode.NOT_IMPLEMENTED)
    }

    const inserted = await db.insert('telenutrition.reward_user', {
      reward_id: rewardUser.rewardId,
      user_id: rewardUser.userId,
      rewarded_at: new Date(),
      meta: metaToInsert
    }).run(pool)

    return ok({
      rewardUserId: inserted.reward_user_id,
      rewardId: inserted.reward_id,
      userId: inserted.user_id,
      meta,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export function mapRewardByUser(rewardByUser:
  zs.telenutrition.reward_user.JSONSelectable & 
  {
    reward: zs.telenutrition.reward.JSONSelectable,
    patient: zs.telenutrition.iam_identity.JSONSelectable,
    user_activity: zs.telenutrition.activity_user.JSONSelectable
  }
) {
  return {
    rewardId: rewardByUser.reward_id,
    reward: {
      correctable: rewardByUser.reward.correctable,
      description: rewardByUser.reward.description,
    },
    patient: {
      identityId: rewardByUser.patient.identity_id,
      firstName: rewardByUser.patient.first_name ?? undefined,
      lastName: rewardByUser.patient.last_name ?? undefined,
    },
    meta: rewardByUser.meta,
    userActivity: {
      activityAt: rewardByUser.user_activity ? DateTime.fromISO(rewardByUser.user_activity.activity_at).toFormat("MM/dd/yyyy") : "",
    }
  }
}

export default {
  insertRewardUser,
  mapRewardByUser
}
