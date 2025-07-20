import { open } from 'node:fs/promises'
import { Result, ok, err } from 'neverthrow'

import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'

import Context from '@mono/common/lib/context'
import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import RewardsService from '../../rewards/service'
import { UserRewardable, overrideIncentiveContractRule } from '../../rewards/service'

import yargs, { Argv } from 'yargs'
import { TagColorEnum } from 'candidhealth/api'

const MTAG = [ 'telenutrition', 'scripts', 'rewards', 'compare-rules' ]

const processArgv = [ ...process.argv ]

if (processArgv.length && processArgv[0].endsWith('bin.js')) {
  processArgv.shift()
}

if (processArgv.length && processArgv[0].endsWith('compare-rules.ts')) {
  processArgv.shift()
}

// console.log(processArgv)

const argv = yargs(processArgv).command(
  'compare-rules.ts <contract1> <rule1> <congtract2> <rule2>',
  'Execute incentive rules in the context of incentive contracts.',
  (yargs: Argv) => {
    return yargs.positional('contract1', {
      describe: 'Incentive contract ID of first contract / rule to compare.',
      type: 'number',
      demandOption: true,
    }).positional('rule1', {
      describe: 'Incentive rule ID of first contract / rule to compare.',
      type: 'number',
      demandOption: true,
    }).positional('contract2', {
      describe: 'Incentive contract ID of second contract / rule to compare.',
      type: 'number',
      demandOption: true,      
    }).positional('rule2', {
      describe: 'Incentive rule ID of second contract / rule to compare.',
      type: 'number',
      demandOption: true,      
    }).option('p1', {
      alias: 'params1',
      describe: 'Comma seperated list of query parameters. IE: 1,NULL',
      type: 'string',
      demandOption: false,
    }).option('p2', {
      alias: 'params2',
      describe: 'Comma seperated list of query parameters. IE: 1,NULL',
      type: 'string',
      demandOption: false,
    }).option('diff1', {
      alias: 'd1',
      describe: 'File to output entries found by contract 1 / rule 1 but not the other combination.',
      type: 'string',
      demandOption: false,
    }).option('diff2', {
      alias: 'd2',
      describe: 'File to output entries found by contract 2 / rule 2 but not the other combination.',
      type: 'string',
      demandOption: false,
   })
  },
).parse(processArgv)

console.log(`ARGS: `, argv)
console.log(argv['_'])

if (argv['_'].length !== 4) {
  console.error(`Positional arguments <contract1> <rule1> <congtract2> <rule2> are required!`)

  process.exit(1)
}

interface GetUserRewardablesOptions {
  paramValues?: string[]
}

async function getUserRewardables(context: IContext, incentiveContractId: number, incentiveRuleId: number, options?: GetUserRewardablesOptions): Promise<Result<UserRewardable[], ErrCode>> {
  const TAG = [ ...MTAG, 'getUserRewardables' ]
  const { logger } = context;

  try {
    const contractsResult = await RewardsService.getIncentiveContracts(context, { includeInactive: true, })

    if (contractsResult.isErr()) {
      logger.error(context, TAG, 'Error getting contracts.', {
        error: contractsResult.error
      })

      return err(contractsResult.error)
    }

    const contracts = contractsResult.value
    const filteredContracts = contracts.filter(contract => contract.incentive_contract_id === incentiveContractId)

    if (filteredContracts.length !== 1) {
      logger.error(context, TAG, 'Contract not found.', {
        incentiveContractId,
        contracts,
      })

      return err(ErrCode.NOT_FOUND)
    }

    const contract = filteredContracts[0]

    if (contract.incentive_rule_id !== incentiveRuleId) {
      const paramValues = options?.paramValues
      const overrideOptions = paramValues !== undefined ? { paramValues: paramValues.map(pv => pv === "NULL" ? null : pv) } : undefined
      const overrideResult = await overrideIncentiveContractRule(context, contract, incentiveRuleId, overrideOptions)

      if (overrideResult.isErr()) {
        logger.error(context, TAG, 'Failed to override  incentive contract rule.', {
          incentiveContractId,
          incentiveRuleId,
        })

        return err(overrideResult.error)
      }
    }

    const processResult = await RewardsService.processIncentiveContracts(context, [ contract ])

    if (processResult.isErr()) {
      logger.error(context, TAG, 'Error processing incentive contracts.', {
        error: processResult.error,
      })

      return err(processResult.error)
    }

    return ok(processResult.value)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

interface LogRewardablesOptions {
  file: string,
}

/***
 * Log the rewardables with the following hearder:
 * 
 * user_id,identity_id,account_id,incentive_id,incentive_label,incentive_contract_id,activity_id,activity_user_id,activity_user_meta,reward_id
 */
async function logRewardables(context: IContext, rewardables: UserRewardable[], prefix: string, options?: LogRewardablesOptions): Promise<Result<void, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'logRewardable' ]

  try {
    const keys = [
      'userId',
      'identityId',
      'accountId',
      'incentiveId',
      'incentiveLabel',
      'incentiveContractId',
      'activityId',
      'activityUserId',
      'activityUserMeta',
      'rewardId'
    ]

    const handle = await (async () => { 
      if (options?.file !== undefined) {
        return await open(options.file, 'w')
      }
      return 
    })()

    let line = `${prefix}${keys.join(',')}`

    if (handle) {
      await handle.write(`${line}\n`)
    }
    console.log(line)

    for (const rewardable of rewardables) {
      line = `${prefix}${keys.map(k => k === 'activityUserMeta' ? JSON.stringify(rewardable[k]) : rewardable[k]).join(',')}`

      if (handle) {
        await handle.write(`${line}\n`)
      }
      console.log(line)
    }

    if (handle) {
      await handle.close()
    }

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

interface DifffRewardablesOptions {
  file1?: string,
  file2?: string,
}

async function diffRewardables(context: IContext, rewardables1: UserRewardable[], rewardables2: UserRewardable[], options?: DifffRewardablesOptions): Promise<Result<void, ErrCode>> {
  const { logger } = context 
  const TAG = [ ...MTAG, 'diffRewardables' ]

  try {
    const in1NotIn2: UserRewardable[] = rewardables1.filter(rewardable => rewardables2.findIndex(rewardable2 => rewardable.activityUserId === rewardable2.activityUserId) === -1)
    const options1 = options?.file1 !== undefined ? { file: options.file1 } : undefined

    await logRewardables(context, in1NotIn2, '< ', options1)

    const in2NotIn1: UserRewardable[] = rewardables2.filter(rewardable => rewardables1.findIndex(rewardable1 => rewardable.activityUserId === rewardable1.activityUserId) === -1)
    const options2 = options?.file2 !== undefined ? { file: options.file2 } : undefined

    await logRewardables(context, in2NotIn1, '> ',  options2)

    logger.info(context, TAG, 'Rewardables diff.', {
      rewardables_in_1_not_in_2_count: in1NotIn2.length,
      rewardables_in_2_not_in_1_count: in2NotIn1.length,
    })

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface Arguments {
  p1: string,
  p2: string,
  d1: string,
  d2: string,
}

async function main(): Promise<void> {
  const context = await Context.create()
  const { logger } = context
  const args: Arguments = argv as unknown as Arguments
  const TAG = [ ...MTAG, 'main' ]

  console.log(`argv: `, argv)
  console.log(`ARGS: `, args)


  const positionals: number[] = argv['_']

  const contractId1 = positionals[0]
  const ruleId1 = positionals[1]
  const contractId2 = positionals[2]
  const ruleId2 = positionals[3]

  const { d1: diffFile1, d2: diffFile2 } = args

  const params1 = args.p1 ? String(args.p1).split(',') : undefined
  const params2 = args.p2 ? String(args.p2).split(',') : undefined

  console.log({
    contractId1,
    ruleId1,
    contractId2,
    ruleId2,
    params1,
    params2,
    diffFile1,
    diffFile2,
  })

  const get1Options = Array.isArray(params1) && params1.length ? { paramValues: params1 } : undefined
  const getResult1  = await getUserRewardables(context, contractId1, ruleId1, get1Options)

  if (getResult1.isErr()) {
    logger.error(context, TAG, 'Error getting rewardables.', {
      error: getResult1.error
    })

    process.exit(1)
  }

  const get2Options = Array.isArray(params2) && params2.length ? { paramValues: params2 } : undefined
  const getResult2  = await getUserRewardables(context, contractId2, ruleId2, get2Options)

  if (getResult2.isErr()) {
    logger.error(context, TAG, 'Error getting rewardables.', {
      error: getResult2.error
    })

    process.exit(1)
  }

  const rewardables1 = getResult1.value
  const rewardables2 = getResult2.value

  const diffOptions = diffFile1 || diffFile2 ? {
    ...(diffFile1 !== undefined && { file1: diffFile1 }),
    ...(diffFile2 !== undefined && { file2: diffFile2 }),
  } : undefined

  await diffRewardables(context, rewardables1, rewardables2, diffOptions)

  logger.info(context, TAG, 'Rewardable stats.', {
    rewardables_1_count: rewardables1.length,
    rewardables_2_count: rewardables2.length,
  })

  process.exit(0)
}

main().then(() => process.exit(0))
.catch(e => {
  console.error(e)

  process.exit(1)
})
