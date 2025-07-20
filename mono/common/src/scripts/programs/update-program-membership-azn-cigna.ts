/**
 * Update program membership for Amazon Cigna. 
 * Use the contract and associated rule to invoke the query.
 * Don't attempt top generalize things, this is quick and dirty.
 *
 */
import { Result, err, ok } from 'neverthrow'

import * as db from 'zapatos/db'
import { conditions as dc } from 'zapatos/db'
import '../../zapatos/schema'
import * as zs from 'zapatos/schema'
import Context, { IContext } from '../../context'
import { ErrCode } from '../../error'

const MTAG = [ 'telenutrition', 'scripts', 'incentives', 'update-program-membership-azn-cigna' ]

const ACCOUNT_ID = 72
const PROGRAM_ID = 3

function buildQuery(context: IContext, query: string, params: db.JSONValue): Result<string, ErrCode> {
  let interpolatedQuery = query

  if (params instanceof Object) {
    for (const [key, value] of Object.entries(params)) {
      //
      // Replace ${key} with value
      //
      const re = new RegExp(`\\$\{${key}\}`, 'g')

      interpolatedQuery = interpolatedQuery.replace(re, `${value}`)
    }
  }
  
  return ok(interpolatedQuery)  
}

async function getMemberIdentities(context: IContext): Promise<Result<number[], ErrCode>> {
  const { logger, store: { writer }, redshift } = context
  const TAG = [ ...MTAG, 'getEligibleProgramIdentities' ]
  const rspool = await redshift()

  try {
    const pool = await writer()

    const contractWithRule = await db.selectExactlyOne("common.program_contract", {
      account_id: ACCOUNT_ID,
    }, {
      lateral: {
        rule: db.selectExactlyOne('common.program_rule', { 
          program_id: PROGRAM_ID,
          program_rule_id: db.parent('program_rule_id') 
        }),
      }
    }).run(pool);

    const rawRuleQuery = contractWithRule.rule.query
    const contractParams = contractWithRule.params

    const ruleQueryResult = buildQuery(context, rawRuleQuery, contractParams)

    if (ruleQueryResult.isErr()) {
      logger.error(context, TAG, 'Error building query.', {
        error: ruleQueryResult.error
      })

      return err(ruleQueryResult.error)
    }

    const ruleQuery = ruleQueryResult.value

    const { rows } = await rspool.query<{ identity_id: number }>(ruleQuery)

    logger.info(context, TAG, `Returned ${rows.length} rows`, {
      membership_count: rows.length,
    })
  
    return ok(rows.map(r => r.identity_id))
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

async function deleteNonMembers(context: IContext, memberIdentityIds: number[]): Promise<Result<number, ErrCode>> {
  const { logger, store: { writer, } } = context
  const TAG = [ ...MTAG, 'deleteNonMembers' ]

  try {
    const pool = await writer()
    const deleted = await db.deletes('common.program_membership', { identity_id: dc.isNotIn(memberIdentityIds) }, { returning: ['identity_id'] }).run(pool);

    return ok(deleted.length)
  }
  catch (e) {
    logger.exception(context, TAG, e)    

    return err(ErrCode.EXCEPTION)
  }
}

async function insertMembers(context: IContext, memberIdentityIds: number[]): Promise<Result<number, ErrCode>> {
  const { logger, store: { writer, } } = context
  const TAG = [ ...MTAG, 'insertMembers' ]

  try {
    if (memberIdentityIds.length) {
      const pool = await writer()

      const programMembers: zs.common.program_membership.Insertable[] = memberIdentityIds.map(i => ({
        identity_id: i,
        program_id: PROGRAM_ID,      
      }))

      const inserted = await db.upsert(
        'common.program_membership', 
        programMembers, 
        [ 'identity_id', 'program_id' ],
        { 
          returning: [ 'identity_id' ],
          updateColumns: db.doNothing,
        }
      ).run(pool)

      return ok(inserted.length)
    }
    return ok(0)
  }
  catch (e) {
    logger.exception(context, TAG, e)    

    return err(ErrCode.EXCEPTION)
  }
}

async function main() {
  const context = await Context.create()
  const { logger } = context
  const TAG = [ ...MTAG, 'main' ]

  try {
    const memberIdentitiesResult = await getMemberIdentities(context)

    if (memberIdentitiesResult.isErr()) {
      return err(memberIdentitiesResult.error)
    }

    const memberIdentityIds = memberIdentitiesResult.value

    logger.debug(context, TAG, 'Program membership.', {
      member_count: memberIdentityIds.length
    })

    await deleteNonMembers(context, memberIdentityIds)

    await insertMembers(context, memberIdentityIds)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    throw e
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})