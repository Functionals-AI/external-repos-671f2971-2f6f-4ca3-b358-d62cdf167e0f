import { Result, ok, err } from 'neverthrow'

import { AccountIds } from '@mono/common/lib/account/service'
import { ErrCode, ErrCodeError } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import * as zs from 'zapatos/schema'
import * as db from 'zapatos/db'
import { conditions as dc } from 'zapatos/db'
import { CustomerRecord as CioCustomerRecord, EventRecord as CioEventRecord } from '@mono/common/lib/integration/customerio/service'
import Cio from '@mono/common/lib/integration/customerio'
import { InstacartCodeRecord, consumeInstacartCode, selectAvailableCodes } from '../instacart/service'
import { upsertWallet, updateWallet } from '../wallet/service'
import { insertRewardUser, mapRewardByUser } from './store'
import { DateTime } from 'luxon'
import { RewardUser } from './shared'

const MTAG = [ 'telenutrition', 'rewards', 'service' ]

const RECENTLY_INACTIVE_CONTRACT_IN_DAYS = 1

/**
 * Given an activity which can be rewarded, captures the relevant meta-data S.T.
 * the reward can be granted to the user.
 */
export type UserRewardable = {
  userId: number,
  identityId: number,
  accountId: number,
  incentiveId: number,
  incentiveLabel: string,
  incentiveContractId: number,
  activityId: number,
  activityUserId: string,
  activityUserMeta: Record<string, any>,
  rewardId: number,
}

export type IncentiveContract = (zs.telenutrition.incentive_contract.JSONSelectable & db.LateralResult<{
  incentive: db.SQLFragment<zs.telenutrition.incentive.JSONSelectable & db.LateralResult<{
    default_rule: db.SQLFragment<zs.telenutrition.incentive_rule.JSONSelectable, never>;
  }>, never>;
  override_rule: db.SQLFragment<zs.telenutrition.incentive_rule.JSONSelectable | undefined, never>;
  account: db.SQLFragment<zs.common.account.JSONSelectable, never>;
}>);

export interface GetIncentiveContractsOptions {
  includeInactive?: boolean,
}

/**
 * Retrieve active incentive contracts and ones which recently became inactive. The window for
 * recently inactive ones should be big enough to cover the largest possible processing interval.
 * The processing itself should be idempotent.
 * 
 * @param context 
 * 
 * @returns 
 */
async function getIncentiveContracts(context: IContext, options?: GetIncentiveContractsOptions): Promise<Result<IncentiveContract[], ErrCode>> {
  const TAG = [ ...MTAG, 'getIncentiveContracts' ]
  const { logger, store: { reader } } = context;

  try {
    const storePool = await reader();

    logger.debug(context, TAG, 'Fetching contracts.')

    const includeInactive = options?.includeInactive === true ? dc.isNotNull : dc.isFalse

    const contracts: IncentiveContract[] = await db.select(
      'telenutrition.incentive_contract',
      {
        active_at: db.sql`${db.self} < now()`,
        inactive_at: db.sql`(${db.self} > (now() - INTERVAL '${db.raw(RECENTLY_INACTIVE_CONTRACT_IN_DAYS.toString())} days')) OR ${db.self} IS NULL`,
        inactive: includeInactive,
      },
      {
        lateral: {
          incentive: db.selectExactlyOne('telenutrition.incentive', { incentive_id: db.parent('incentive_id') }, {
            lateral: {
              default_rule: db.selectExactlyOne('telenutrition.incentive_rule', { incentive_rule_id: db.parent('incentive_rule_id') }),
            }
          }),
          override_rule: db.selectOne('telenutrition.incentive_rule', { incentive_rule_id: db.parent('incentive_rule_id') }),
          account: db.selectExactlyOne('common.account', { account_id: db.parent('account_id') })
        }
      }
    ).run(storePool)

    logger.debug(context, TAG, 'Fetched contracts.', { contractCount: contracts.length })

    for (const contract of contracts) {
      logger.debug(context, TAG, 'contract', { contract, })
    }

    return ok(contracts);
  } catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

type IncentiveRule = zs.telenutrition.incentive_rule.JSONSelectable
type IncentiveRuleParamValues = (string | null)[]

export interface OverrideIncentiveContractRuleOptions {
  paramValues?: IncentiveRuleParamValues,
}

/**
 * Override the rule and associated parameters of a contract.
 * Note, this is  primarily of use in QA when updating the rule associated a contract.
 * That is, the contract can be tested with a new associated rule.
 */
export async function overrideIncentiveContractRule(context: IContext, incentiveContract: IncentiveContract, incentiveRuleId: number, options?: OverrideIncentiveContractRuleOptions): Promise<Result<IncentiveContract, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'mapRuleResultToUserRewardables' ]

  try {
    const storePool = await reader()
    const paramValues = options?.paramValues ?? []

    const incentiveRule: IncentiveRule | undefined = await db.selectOne('telenutrition.incentive_rule', {
      incentive_rule_id: incentiveRuleId
    }).run(storePool)

    if (incentiveRule === undefined) {
      logger.error(context, TAG, 'Incentive rule not found.', {
        incentiveContract,
        incentiveRuleId,
      })

      return err(ErrCode.NOT_FOUND)
    }

    incentiveContract.override_rule = incentiveRule

    if (paramValues) {
      incentiveContract.param_values = paramValues as string[]
    }

    return ok(incentiveContract)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export type RuleRunResult = Record<string, any>[]

function mapRuleResultToUserRewardables(context: IContext, ruleResult: RuleRunResult): Result<UserRewardable[], ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'mapRuleResultToUserRewardables' ]

  try {
    const userRewardables = ruleResult.map(record => ({
      userId: record.user_id,
      identityId: record.identity_id,
      accountId: record.account_id,
      incentiveId: record.incentive_id,
      incentiveLabel: record.incentive_label,
      incentiveContractId: record.incentive_contract_id,
      activityId: record.activity_id,
      activityUserId: record.activity_user_id,
      activityUserMeta: JSON.parse(record.activity_user_meta),
      rewardId: record.reward_id,
    }))

    return ok(userRewardables)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export type IncentivesRuleContext = {
  account_id: number,
  incentive_contract_id: number,
  active_at: string, // ISO8601, ie: YYYY-MM-DDTHHmmDD
} 

function buildIncentivesQuery(query: string, context: IncentivesRuleContext): string {
  return query
    .replace(/:account_id/g, context.account_id.toString())
    .replace(/:incentive_contract_id/g, context.incentive_contract_id.toString())
    .replace(/:incentive_contract_active_at/g, DateTime.fromISO(context.active_at).toFormat('yyyy-MM-dd HH:mm:ss')) // ISO8601 -> Redshift timestamp literal
}

/**
 * Process incentive contracts which involves executing the associated incentive rules. Reterns a vector
 * of UserRewardable's which captures data related to each rewardable activity.
 * 
 * @param context 
 * @param contracts 
 * 
 * @returns 
 */
async function processIncentiveContracts(context: IContext, contracts: IncentiveContract[]): Promise<Result<UserRewardable[], ErrCode>> {
  const { logger, redshift, store } = context
  const TAG = [ ...MTAG, 'processIncentiveContracts' ]

  try {
    const redshiftPool = await redshift()
    const storePool = await store.writer()
    const rewardables: UserRewardable[] = []

    for (const contract of contracts) {
      const rule = contract.override_rule ?? contract.incentive.default_rule

      if (rule === null) {
        logger.error(context, TAG, 'Rule not found.', {
          contract,
        })

        return err(ErrCode.NOT_FOUND)
      }

      const ruleContext: IncentivesRuleContext = {
        incentive_contract_id: contract.incentive_contract_id,
        account_id: contract.account.account_id as number,
        active_at: contract.active_at
      }

      const query = buildIncentivesQuery(rule.query, ruleContext)

      const values = contract.param_values;

      try {
        logger.debug(context, TAG, 'Executing rule query.', {
          rule_query: rule.query,
          query,
          rule_context: ruleContext,
          values,
        })

        const queryResult = await redshiftPool.query(query, values)

        const mapResult = mapRuleResultToUserRewardables(context, queryResult.rows)

        if (mapResult.isErr()) {
          //
          // Log, but don't prevent other contracts from having rules executed.
          //
          logger.error(context, TAG, 'Error mapping results.', {
            query_rows: queryResult.rows,
            error: mapResult.error
          })
        }
        else {
          await db.update('telenutrition.incentive_contract', {
            processed_at: db.sql`now()`,
          }, { incentive_contract_id: contract.incentive_contract_id }).run(storePool);

          logger.debug(context, TAG, 'Rewardables for incentive rule.', {
            rewardables: mapResult.value
          })

          if (mapResult.value.length) {
            rewardables.push(...mapResult.value)
          }
        }
      }
      catch (e) {
        logger.error(context, TAG, 'Caught error when processing incentive contract, persisting the error message in the store.', { contract, rule, error: e.message });

        logger.exception(context, TAG, e);

        try {
          await db.update('telenutrition.incentive_rule', {
            processing_error: e.message ?? 'An unknown error occurred.'
          }, { incentive_rule_id: rule.incentive_rule_id }).run(storePool);
        }
        catch (e) {
          logger.error(context, TAG, 'Caught error when persisting error message in the store.', { contract, rule, error: e.message });
        }
      }
    }
    return ok(rewardables)
  }
  catch(e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * RewardType: Value is reward.description.
 */
enum RewardType {
  INSTACART_FRESH_FUNDS_200 = '$200 Instacart Fresh Funds',
  INSTACART_FRESH_FUNDS_142 = '$142 Instacart Fresh Funds',
  INSTACART_FRESH_FUNDS_100 = '$100 Instacart Fresh Funds',
  INSTACART_FRESH_FUNDS_50 = '$50 Instacart Fresh Funds',
  INSTACART_FRESH_FUNDS_25 = '$25 Instacart Fresh Funds',
  INSTACART_FRESH_FUNDS_15 = '$15 Instacart Fresh Funds',
  INSTACART_FRESH_FUNDS_200_CORRECTION = '$200 Instacart Fresh Funds - Correction',
  INSTACART_FRESH_FUNDS_100_CORRECTION = '$100 Instacart Fresh Funds - Correction',
  INSTACART_FRESH_FUNDS_25_CORRECTION = '$25 Instacart Fresh Funds - Correction',
  INSTACART_FRESH_FUNDS_15_CORRECTION = '$15 Instacart Fresh Funds - Correction'
}

export interface GrantedRewardBase extends UserRewardable {
  type: RewardType,
}

export interface InstacartFreshFundReward extends GrantedRewardBase {
  walletId: number,
  instacartCodeId: string | string[],
  instacartCode: string | string[],
  instacartCodeUrl: string | string[],
}

export type GrantedReward = InstacartFreshFundReward
export type GrantedCorrectionReward = Omit<GrantedReward, "incentiveId" | "incentiveLabel" | "incentiveContractId" | "activityId" | "activityUserId" | "activityUserMeta" | "accountId">;

const CIO_INCENTIVE_EARNED_EVENT_NAME = 'incentive_earned'

const COUNTY_CARE_ACCOUNT_ID = 46
const COUNTY_CARE_ORG_ID = 197


export interface SendCioEventOptions {
  isDryRun?: boolean
}

export interface SendCioEventResult {
  customer: CioCustomerRecord;
  event: CioEventRecord;
  isDryRun?: boolean;
}

/**
 * 
 * @param context 
 * @param appointments 
 * @param options 
 * @returns 
 */
async function sendIncentiveGrantedCioEvent(context: IContext, grantedReward: GrantedReward, options?: SendCioEventOptions): Promise<Result<SendCioEventResult | false, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'sendIncentiveGrantedCioEvent' ]
  const { isDryRun } = options ?? {}

  try {
    const pool = await reader()

    logger.debug(context, TAG, 'Sending C.io Event.', {
      grantedReward,
    })

    const { userId, accountId } = grantedReward

    const user = await db.selectOne('telenutrition.iam_user', {
      user_id: userId,
    }, {
      lateral: {
        identity: db.selectExactlyOne('telenutrition.iam_identity', { identity_id: db.parent('identity_id') })
      }
    }).run(pool)

    if (user === undefined) {
      logger.error(context, TAG, 'User not found.', {
        userId,
        grantedReward,
      })

      return err(ErrCode.NOT_FOUND)
    }

    const userIdentityId = user.identity_id

    const identifier = `id:${userIdentityId}`

    if (isDryRun) {
      logger.info(context, TAG, `Skipping sending C.io event, dry run.`, {
        grantedReward,
        user,
      })

      return ok(false)
    }
    else if (
      grantedReward.type !== RewardType.INSTACART_FRESH_FUNDS_200 &&
      grantedReward.type !== RewardType.INSTACART_FRESH_FUNDS_142 &&
      grantedReward.type !== RewardType.INSTACART_FRESH_FUNDS_100 &&
      grantedReward.type !== RewardType.INSTACART_FRESH_FUNDS_50 &&
      grantedReward.type !== RewardType.INSTACART_FRESH_FUNDS_25 &&
      grantedReward.type !== RewardType.INSTACART_FRESH_FUNDS_15
    ) {
      logger.error(context, TAG, 'Reward type not supported.', {
        grantedReward
      })

      return err(ErrCode.NOT_IMPLEMENTED)
    }
    else {
      const account = await db.selectOne('common.account', {
        account_id: accountId
      }).run(pool)

      if (account === undefined) {
        logger.error(context, TAG, 'Account not found.', {
          grantedReward,
        })

        return err(ErrCode.NOT_FOUND)
      }

      //
      // Temporary until the correct way to comminucate an org. ID is determined.
      //

      const customer: CioCustomerRecord = {
        id: identifier,
        firstname: user.identity.first_name ?? undefined,
        lastname: user.identity.last_name ?? undefined,
        ...( typeof user.email === 'string' && { email: user.email }),
        ...( typeof user.phone === 'string' && { phone: user.phone }),
        ...( accountId === COUNTY_CARE_ACCOUNT_ID && { organization_id: COUNTY_CARE_ORG_ID }),
      }

      //
      // Only incentive completion event is 'appointment_completed' at the moment.
      //
      const INCENTIVE_TYPE = 'appointment_completed'

      const event: CioEventRecord = {
        name: CIO_INCENTIVE_EARNED_EVENT_NAME,
        data: {
          appointment_id: grantedReward.activityUserMeta.appointment_id,
          appointment_type_id: grantedReward.activityUserMeta.appointment_type_id,
          appointment_date: grantedReward.activityUserMeta.appointment_date,
          incentive_type: INCENTIVE_TYPE,
          incentive_id: grantedReward.incentiveId,
          incentive_label: grantedReward.incentiveLabel,
          incentive_code: grantedReward.instacartCode,
          incentive_url: grantedReward.instacartCodeUrl,
          incentive_account_id: grantedReward.accountId,
          incentive_account_name: account.name,
        }
      }
      const sendResult = await Cio.Service.sendEvent(context, identifier, { customer, event, })

      if (sendResult.isErr()) {
        logger.error(context, TAG, 'Error send event to C.io', {
          identifier,
          customer,
          event,
        })

        return err(sendResult.error)
      }

      return ok({
        customer,
        event,
      })
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

async function hasUserRewardBeenGranted(context: IContext, userRewardable: UserRewardable): Promise<Result<boolean, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'hasUserRewardBeenGranted' ]

  try {
    const pool = await reader()

    logger.debug(context, TAG, 'Selecting user reward.', {
      userRewardable,
    })

    const { activityUserId } = userRewardable

    const query = db.selectOne('telenutrition.reward_user', {
      user_id: userRewardable.userId,
      reward_id: userRewardable.rewardId,
      meta: db.sql`${db.self} @> '{ "user_activity_id": "${db.raw(activityUserId)}" }'::jsonb`
    })

    logger.debug(context, TAG, 'query', {
      query: query.compile()
    })

    const selectResult = await  query.run(pool)

    logger.debug(context, TAG, 'selected user reward result.', {
      userRewardable,
      selectResult
    })

    if (selectResult === undefined) {
      return ok(false)
    }
    else {
      return ok(true)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

function getRewardType(reward: zs.telenutrition.reward.JSONSelectable): Result<RewardType, ErrCode> {
  if (reward.description === RewardType.INSTACART_FRESH_FUNDS_200) {
    return ok(RewardType.INSTACART_FRESH_FUNDS_200)
  }
  else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_142) {
    return ok(RewardType.INSTACART_FRESH_FUNDS_142)
  }
  else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_100) {
    return ok(RewardType.INSTACART_FRESH_FUNDS_100)
  }
  else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_50) {
    return ok(RewardType.INSTACART_FRESH_FUNDS_50)
  }
  else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_25) {
    return ok(RewardType.INSTACART_FRESH_FUNDS_25)
  }
  else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_15) {
    return ok(RewardType.INSTACART_FRESH_FUNDS_15)
  }
  else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_200_CORRECTION) {
    return ok(RewardType.INSTACART_FRESH_FUNDS_200_CORRECTION)
  }
  else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_100_CORRECTION) {
    return ok(RewardType.INSTACART_FRESH_FUNDS_100_CORRECTION)
  }
  else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_25_CORRECTION) {
    return ok(RewardType.INSTACART_FRESH_FUNDS_25_CORRECTION)
  }
  else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_15_CORRECTION) {
    return ok(RewardType.INSTACART_FRESH_FUNDS_15_CORRECTION)
  }
  else {
    return err(ErrCode.NOT_IMPLEMENTED)
  }
}

/**
 * grantReward options.
 * 
 * @param instacartCode: Instacart code to use for the reward grant. The default behavior is to select 
 *                       an unused code.
 * @param sendCioEvent: Whether to send a C.io event. Default is true.
 */
export interface GrantRewardOptions {
  instacartCode?: string,
  sendCioEvent?: boolean,
}

/**
 * Grants a reward for a 'user rewardable'. If a reward has been already given for the 'user activity', false
 * is returned. Otherwise the granted reward is returned.
 * 
 * @param context 
 * @param userRewardable 
 * 
 * @returns 
 */
export async function grantReward(context: IContext, rewardable: UserRewardable, options?: GrantRewardOptions): Promise<Result<GrantedReward | false, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'grantUserReward' ]
  
  try {
    const hasBeenGrantedResult = await hasUserRewardBeenGranted(context, rewardable)

    if (hasBeenGrantedResult.isErr()) {
      logger.error(context, TAG, "Error determining whether reward has been gratned.", {
        rewardable,
      })

      return err(hasBeenGrantedResult.error)
    }

    if (hasBeenGrantedResult.value) {
      logger.info(context, TAG, "Reward has already been granted.", {
        rewardable,
      })

      return ok(false)
    }

    const pool = await writer()

    const reward = await db.selectOne('telenutrition.reward', {
      reward_id: rewardable.rewardId,
    }).run(pool)

    if (!reward) {
      logger.error(context, TAG, 'Reward not found.', {
        rewardable,
      })

      return err(ErrCode.NOT_FOUND)
    }

    const rewardTypeResult = getRewardType(reward)

    if (rewardTypeResult.isErr()) {
      logger.error(context, TAG, 'Reward is not grantable.', {
        reward,
      })

      return err(ErrCode.NOT_IMPLEMENTED)
    }

    const rewardType = rewardTypeResult.value

    //
    // Do the following in the context of a transaction:
    //
    // 1. Get user's wallet, create one if needed.
    // 2. For instacart fresh funds, get an unused code or use the one supplied.
    // 3. Perform updates:
    //  3.a. create a reward user record
    //  3.b. For instacart fresh funds, associate code w / wallet
    //  3.c. add a wallet transaction and update wallet
    //
    const grantedReward: GrantedReward = await db.serializable(pool, async (pgClient) => {
      const {
        userId,
        identityId,
        accountId,
        incentiveId,
        incentiveLabel,
        incentiveContractId,
        activityId,
        activityUserId,
        activityUserMeta,
        rewardId,
      } = rewardable
      //
      // 1. wallet = Upsert wallet
      //
      const upsertWalletResult = await upsertWallet(context, userId, {
        pgClient
      })

      if (upsertWalletResult.isErr()) {
        logger.error(context, TAG, 'Errer obtaining wallet for user.', {
          userId,
        })

        throw new ErrCodeError(upsertWalletResult.error)
      }

      const wallet = upsertWalletResult.value

      //
      // 2. instartCartCode = Unused instacart code.
      //
      let instacartCode: string | string[]

      let initialBalance: string
      let numberOfCodesRequired: number 

      if (reward.description === RewardType.INSTACART_FRESH_FUNDS_200) { 
        initialBalance = '200.00'
        numberOfCodesRequired = 1
      }
      else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_142) { 
        initialBalance = '142.00'
        numberOfCodesRequired = 1
      }
      else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_100) { 
        initialBalance = '100.00'
        numberOfCodesRequired = 1
      }
      else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_50) { 
        initialBalance = '25.00'
        numberOfCodesRequired = 2
      }
      else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_25) { 
        initialBalance = '25.00'
        numberOfCodesRequired = 1
      }
      else { 
        initialBalance = '15.00'
        numberOfCodesRequired= 1 
      }

      const selectInstacartCodesResult = await selectAvailableCodes(context, initialBalance, numberOfCodesRequired, {
        ...(options?.instacartCode && { instacartCode: options.instacartCode }),
        within1stMonthOfTwo: AccountIds.ElevanceHouseFoodBenefit === rewardable.accountId,
        pgClient,
      })

      if (selectInstacartCodesResult.isErr()) {
        logger.error(context, TAG, 'Errer selecting instacart codes.', {
          initialBalance,
          numberOfCodesRequired,
          ...(options?.instacartCode && { instacartCode: options.instacartCode }),
          within1stMonthOfTwo: AccountIds.ElevanceHouseFoodBenefit === rewardable.accountId,  
        })

        throw new ErrCodeError(selectInstacartCodesResult.error)
      }

      const selectedInstacartCodes = selectInstacartCodesResult.value

      let instacartCodeId: string | string[]
      let instacartCodeUrl: string | string[]

      if (selectedInstacartCodes.length === numberOfCodesRequired) {
        if (selectedInstacartCodes.length === 1) {
          instacartCodeId = selectedInstacartCodes[0].instacartCodeId
          instacartCode = selectedInstacartCodes[0].code as string
          instacartCodeUrl = selectedInstacartCodes[0].url
        }
        else {
          instacartCodeId = selectedInstacartCodes.map(code => code.instacartCodeId)
          instacartCode = selectedInstacartCodes.map(code => code.code as string)
          instacartCodeUrl = selectedInstacartCodes.map(code => code.url)
        }
      }
      else {
        logger.error(context, TAG, 'Unable to get available Instacart code(s).', {
          reward,
          code: options?.instacartCode ?? ""
        })

        throw new ErrCodeError(ErrCode.NOT_FOUND)
      }

      //
      // 3. Perform updates
      //
      // 3.a Insert reward_user record.
      //
      const insertRewardUserResult = await insertRewardUser(context, {
        rewardId,
        userId,
        meta: {
          schemaType: 'instacart_fresh_funds',
          activityId,
          activityUserId,
          patientId: activityUserMeta.patient_id,
          patientIdentityId: identityId,
          appointmentId: activityUserMeta.appointment_id,
          appointmentTypeId: activityUserMeta.appointment_type_id,
          walletId: wallet.walletId,
          instacartCodeId,
          instacartCode,
          instacartCodeUrl,
          incentiveId,
          incentiveContractId,
          accountId,
        }
      }, {
        pgClient,
      })

      if (insertRewardUserResult.isErr()) {
        logger.error(context, TAG, 'Failed to insert reward user record.', {
          rewardable,
          wallet,
          instacartCode,
          error: insertRewardUserResult.error,
        })

        throw new ErrCodeError(insertRewardUserResult.error)
      }

      const rewardUser = insertRewardUserResult.value

      let consumedInstacartCodes: InstacartCodeRecord[] = []

      for (const code of Array.isArray(instacartCode) ? instacartCode : [ instacartCode ]) {
        //
        // 3.b: Code is associated with a wallet.
        //
        const consumeInstacartCodeResult = await consumeInstacartCode(context, code, wallet, {
          pgClient,
        })

        if (consumeInstacartCodeResult.isErr()) {
          logger.error(context, TAG, 'Failed to consume instacart code.', {
            rewardable,
            instacartCode,
            wallet,
            error: consumeInstacartCodeResult.error,
          })

          throw new ErrCodeError(consumeInstacartCodeResult.error)
        }

        consumedInstacartCodes.push(consumeInstacartCodeResult.value)
      }
      //
      // 3.c: Wallet is updated.
      //
      let walletAmount: string

      if (reward.description === RewardType.INSTACART_FRESH_FUNDS_200) {
        walletAmount = '200.00'
      }
      else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_142) {
        walletAmount = '142.00'
      }
      else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_100) {
        walletAmount = '100.00'
      }
      else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_50) {
        walletAmount = '50.00'
      }
      else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_25) {
        walletAmount = '25.00'
      }
      else {
        walletAmount = '15.00'
      }

      const updateWalletResult = await updateWallet(context, wallet, {
        amount: walletAmount,
        label: 'instacart code grant',
        meta: {
          type: 'instacart_code_grant',
          instacartCodeId: instacartCodeId,
          instacartCode: instacartCode,
          incentiveId,
          incentiveLabel,
          rewardId,
          rewardDescription: reward.description,
          rewardUserId: rewardUser.rewardUserId,
          accountId,
        },
        transactedAt: new Date(),
      }, {
        pgClient
      })

      if (updateWalletResult.isErr()) {
        logger.error(context, TAG, 'Failed to update wallet.', {
          rewardable,
          instacartCode,
          reward,
          wallet,
        })

        throw new ErrCodeError(updateWalletResult.error)
      }

      return {
        type: rewardType,
        ...rewardable,
        walletId: wallet.walletId,
        instacartCodeId: instacartCodeId,
        instacartCode: instacartCode,
        instacartCodeUrl: instacartCodeUrl,
      }
    })

    logger.info(context, TAG, 'Reward granted.', {
      grantedReward,
    })
    
    //
    // Would perhaps be better to send the cio event w / o awaiting for completion,
    // however strange behavior was experienced at least locally where the process would
    // throw w/o the await, or not send the event at all.
    //
    if ((options?.sendCioEvent ?? true) === true) {
      const sendResult = await sendIncentiveGrantedCioEvent(context, grantedReward)

     if (sendResult.isErr()) {
        //
        // Just log.
        //
        logger.error(context, TAG, 'Error sending C.io event.', {
          error: sendResult.error
        })
      }
    }
    else {
      logger.info(context, TAG, 'Skipping sending C.io event.')
    }

    return ok(grantedReward)
  }
  catch(e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function grantRewards(context: IContext, rewardables: UserRewardable[]): Promise<Result<GrantedReward[], ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'grantRewards' ]

  try {
    const granted: GrantedReward[] = []

    for (const rewardable of rewardables) {
      const grantResult = await grantReward(context, rewardable)

      if (grantResult.isErr()) {
        logger.error(context, TAG, 'Error granting reward.', {
          rewardable,
        })

        return err(grantResult.error)
      }
      if (grantResult.value === false) {
        logger.info(context, TAG, 'User activity has already been rewarded.', {
          rewardable,
        })
      }
      else {
        granted.push(grantResult.value)
      }
    }
    return ok(granted)
  }
  catch(e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface GetRewardsByUserProps {
  userId: number;
}

export interface RewardUserReturn {
  rewards: RewardUser[]
}

export async function getRewardsByUser(context: IContext, props: GetRewardsByUserProps): Promise<Result<RewardUserReturn, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'getRewardsByUser' ]

  const userId = props.userId;

  try {
    const pool = await reader();

    const rewardsByUserResults = await db.select('telenutrition.reward_user', { user_id: userId }, {
      lateral: {
        reward: db.selectExactlyOne('telenutrition.reward', {
          reward_id: db.parent('reward_id')
        }, {
          columns: ["correctable", "description"],
        }),
        user_activity: db.selectOne('telenutrition.activity_user', {
          activity_user_id: db.sql<zs.telenutrition.reward_user.SQL>`${db.self} = (${"telenutrition.reward_user"}.meta->>'user_activity_id')::character varying(128)`
        }, {
          columns: ["activity_at"]
        }),
        patient: db.selectExactlyOne('telenutrition.iam_identity', {
          identity_id: db.sql<zs.telenutrition.reward_user.SQL>`${db.self} = (${"telenutrition.reward_user"}.meta->>'patient_identity_id')::int`
        }, {
          columns: ["identity_id", "first_name", "last_name"]
        }),
      },
      columns: ["reward_id", "meta"]
    }).run(pool)
    const rewardsByUser = rewardsByUserResults.map(mapRewardByUser)
    return ok({rewards: rewardsByUser})
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export interface GrantCorrectionRewardProps {
  rewardId: number;
  userId: number;
  identityId: number;
  grantedBy: string;
  grantedReason: string;
}

export async function grantCorrectionReward(context: IContext, props: GrantCorrectionRewardProps): Promise<Result<GrantedCorrectionReward, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'grantCorrectionReward' ]

  try {
    const pool = await writer();
    logger.info(context, TAG, 'Granting correction reward', { ...props })
    
    const user = await db.selectOne('telenutrition.iam_user', { user_id: props.userId }, {
      lateral: {
        userPatients: db.select('telenutrition.schedule_user_patient', { user_id: db.parent('user_id') }, {
          lateral: {
            patient: db.selectOne('telenutrition.schedule_patient', { patient_id: db.parent('patient_id') }),
          }
        }),
      }
    }).run(pool)
    if (!user) {
      logger.error(context, TAG, 'User not found.', { ...props })
      return err(ErrCode.NOT_FOUND)
    }

    const patient = user.userPatients.find(up => up.patient?.identity_id === props.identityId)?.patient
    if (!patient) {
      logger.error(context, TAG, 'Could not get the patient associated with the user', { ...props })
      return err(ErrCode.NOT_FOUND)
    }

    const reward = await db.selectOne('telenutrition.reward', { reward_id: props.rewardId }).run(pool);
    if (!reward) {
      logger.error(context, TAG, 'Reward not found.', { props })
      return err(ErrCode.NOT_FOUND)
    }
    if (reward.correctable !== true) {
      logger.error(context, TAG, "Reward is not correctable", { props })
      return err(ErrCode.SERVICE)
    }

    const rewardable = { ...props }

    const rewardTypeResult = getRewardType(reward)
    if (rewardTypeResult.isErr()) {
      logger.error(context, TAG, 'Reward is not grantable.', { reward })
      return err(ErrCode.NOT_IMPLEMENTED)
    }
    const rewardType = rewardTypeResult.value

    //
    // Do the following in the context of a transaction:
    //
    // 1. Get user's wallet, create one if needed.
    // 2. For instacart fresh funds, get an unused code or use the one supplied.
    // 3. Perform updates:
    //  3.a. create a reward user record
    //  3.b. For instacart fresh funds, associate code w / wallet
    //  3.c. add a wallet transaction and update wallet
    //
    const grantedReward: GrantedCorrectionReward = await db.serializable(pool, async (pgClient) => {
      const {
        userId,
        identityId,
        rewardId,
      } = rewardable

      // 1. wallet = Upsert wallet
      const upsertWalletResult = await upsertWallet(context, userId, { pgClient })
      if (upsertWalletResult.isErr()) {
        logger.error(context, TAG, 'Errer obtaining wallet for user.', { userId })
        throw new ErrCodeError(upsertWalletResult.error)
      }
      const wallet = upsertWalletResult.value

      // 2. instartCartCode = Unused instacart code.
      let initialBalance: string;
      if (reward.description === RewardType.INSTACART_FRESH_FUNDS_200_CORRECTION) { 
        initialBalance = '200.00'
      } else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_100_CORRECTION) { 
        initialBalance = '100.00'
      } else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_25_CORRECTION) { 
        initialBalance = '25.00'
      } else if (reward.description === RewardType.INSTACART_FRESH_FUNDS_15_CORRECTION) { 
        initialBalance = '15.00'
      } else {
        logger.error(context, TAG, 'Unable to map correction reward to initial balance.', { reward })
        throw new ErrCodeError(ErrCode.NOT_IMPLEMENTED)
      }

      const selectedInstacartCode = await db.sql<zs.telenutrition.instacart_code.SQL, zs.telenutrition.instacart_code.Selectable[]>`
        SELECT * FROM ${"telenutrition.instacart_code"} WHERE ${ { 
          wallet_id: db.conditions.isNull,
          initial_balance: initialBalance
        } } LIMIT 1
      `.run(pgClient)

      if (selectedInstacartCode.length !== 1) {
        logger.error(context, TAG, 'Unable to get an available Instacart code.', { reward })
        throw new ErrCodeError(ErrCode.INVENTORY_DEPLETED)
      }

      const {
        instacart_code_id: instacartCodeId,
        code: instacartCode,
        url: instacartCodeUrl,
      } = selectedInstacartCode[0]

      // 3. Perform updates and insert reward_user record.
      const insertRewardUserResult = await insertRewardUser(context, {
        rewardId,
        userId,
        meta: {
          schemaType: 'instacart_fresh_funds_correction',
          patientId: patient.patient_id,
          patientIdentityId: identityId,
          walletId: wallet.walletId,
          instacartCodeId: instacartCodeId,
          instacartCode: instacartCode,
          instacartCodeUrl: instacartCodeUrl,
          grantedBy: props.grantedBy,
          grantedReason: props.grantedReason,
        }
      }, { pgClient })
      if (insertRewardUserResult.isErr()) {
        logger.error(context, TAG, 'Failed to insert reward user record.', {
          rewardable,
          wallet,
          instacartCode,
          error: insertRewardUserResult.error,
        })
        throw new ErrCodeError(insertRewardUserResult.error)
      }
      const rewardUser = insertRewardUserResult.value

      // 3.b: Code is associated with a wallet.
      const consumeInstacartCodeResult = await consumeInstacartCode(context, instacartCode, wallet, { pgClient })
      if (consumeInstacartCodeResult.isErr()) {
        logger.error(context, TAG, 'Failed to consume instacart code.', {
          rewardable,
          instacartCode,
          wallet,
          error: consumeInstacartCodeResult.error,
        })
        throw new ErrCodeError(consumeInstacartCodeResult.error)
      }
      const consumedInstacartCode = consumeInstacartCodeResult.value

      // 3.c: Wallet is updated.
      const updateWalletResult = await updateWallet(context, wallet, {
        amount: consumedInstacartCode.initialBalance.replace(/^\$/, ''),
        label: 'instacart code grant',
        meta: {
          type: 'instacart_code_grant_correction',
          instacartCodeId: consumedInstacartCode.instacartCodeId,
          instacartCode: consumedInstacartCode.code,
          rewardId,
          rewardDescription: reward.description,
          rewardUserId: rewardUser.rewardUserId,
        },
        transactedAt: new Date(),
      }, { pgClient })
      if (updateWalletResult.isErr()) {
        logger.error(context, TAG, 'Failed to update wallet.', { rewardable, instacartCode, reward, wallet })
        throw new ErrCodeError(updateWalletResult.error)
      }

      return {
        type: rewardType,
        ...rewardable,
        walletId: wallet.walletId,
        instacartCodeId: consumedInstacartCode.instacartCodeId,
        instacartCode: consumedInstacartCode.code,
        instacartCodeUrl: consumedInstacartCode.url,
      }
    })
    logger.info(context, TAG, 'Reward granted.', { grantedReward })
    return ok(grantedReward)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(e instanceof ErrCodeError ? e.code : ErrCode.EXCEPTION)
  }
}



export interface GrantRewardForActivityOptions {
  appointmentId?: string,
  userId?: number,
  instacartCode?: string,
  sendCioEvent?: boolean,
}

/**
 * Explicitly grant a reward for an activity. Incentive and reward IDs are provided.
 * 
 * @param context 
 * @param activityId 
 * @param incentiveId 
 * @param rewardId 
 * @param options 
 */
export async function grantRewardForActivity(context: IContext, activityId: number, incentiveContractId: number, rewardId: number, options?: GrantRewardForActivityOptions): Promise<Result<GrantedReward | false, ErrCode>> {
  const { logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'grantRewardForActivity' ]

  try {
    const pool = await reader()
    const selectedActivity = await db.selectOne("telenutrition.activity", {
      activity_id: activityId,
    }).run(pool)

    if (selectedActivity === undefined) {
      logger.error(context, TAG, 'Activity not found.', {
        activityId
      })

      return err(ErrCode.NOT_FOUND)
    }

    const selectedIncentiveContract = await db.selectOne('telenutrition.incentive_contract', {
      incentive_contract_id: incentiveContractId,
    },
    {
      lateral: {
        incentive: db.selectExactlyOne("telenutrition.incentive", {
          incentive_id: db.parent('incentive_id')
        })
      },
    }).run(pool)

    if (selectedIncentiveContract === undefined) {
      logger.error(context, TAG, 'Incentive contract not found.', {
        incentiveContractId,
      })

      return err(ErrCode.NOT_FOUND)
    }

    const selectedReward = await db.selectOne('telenutrition.reward', {
      reward_id: rewardId,
    }).run(pool)

    if (selectedReward === undefined) {
      logger.error(context, TAG, 'Reward not found.', {
        rewardId,
      })

      return err(ErrCode.NOT_FOUND)
    }

    const rewardTypeResult = getRewardType(selectedReward)

    if (rewardTypeResult.isErr()) {
      logger.error(context, TAG, 'Reward is not grantable.', {
        selectedReward,
      })

      return err(ErrCode.NOT_IMPLEMENTED)
    }

    const rewardType = rewardTypeResult.value

    if (selectedActivity.label !== 'Telenutrition Appointment Completed') {
      logger.error(context, TAG, 'Activity not supported.', {
        selectedActivity,
      })

      return err(ErrCode.NOT_IMPLEMENTED)
    }

    //
    // We have an appointment completion activity with all other data.
    //
    if (options?.appointmentId === undefined) {
      logger.error(context, TAG, 'Appointment ID is required.')

      return err(ErrCode.INVALID_DATA)
    }

    const appointmentId = options.appointmentId

    const selected = await db.select('telenutrition.activity_user', {
      activity_id: activityId,
      ...(options?.userId && { user_id: options?.userId }),
      meta: db.sql`${db.self} @> '{ "appointment_id": ${db.raw(appointmentId)} }'::jsonb`
    }).run(pool)


    if (selected.length !== 1) {
      logger.error(context, TAG, 'Activity not found for appointment.', {
        activityId,
        user_id: options?.userId ?? "",
        appointment_id: appointmentId,
      })

      return err(ErrCode.NOT_FOUND)
    }

    const selectedActivityUser = selected[0]

    const rewardable: UserRewardable = {
      userId: selectedActivityUser.user_id,
      identityId: selectedActivityUser.identity_id,
      accountId: selectedIncentiveContract.account_id,
      incentiveId: selectedIncentiveContract.incentive.incentive_id,
      incentiveLabel: selectedIncentiveContract.incentive.label,
      incentiveContractId: incentiveContractId,
      activityId: activityId,
      activityUserId: selectedActivityUser.activity_user_id,
      activityUserMeta: selectedActivityUser.meta as Record<string, any>,
      rewardId: rewardId
    }

    logger.debug(context, TAG, 'Granting reward.', {
      rewardable,
    })

    const result = await grantReward(context, rewardable, {
      instacartCode: options?.instacartCode,
      sendCioEvent: options?.sendCioEvent ?? true
    })

    if (result.isErr()) {
      logger.error(context, TAG, 'Error granting reward.', {
        activityId,
        incentiveContractId,
        rewardId,
        options,
        error: result.error
      })

      return err(result.error)
    }

    return ok(result.value)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  getIncentiveContracts,
  processIncentiveContracts,
  hasUserRewardBeenGranted,
  grantRewards,
  grantCorrectionReward,
  getRewardsByUser,
}