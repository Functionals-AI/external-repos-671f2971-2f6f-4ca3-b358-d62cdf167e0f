import { Result, ok, err } from 'neverthrow'

import * as zs from 'zapatos/schema'
import * as db from 'zapatos/db'
import { conditions as dc } from 'zapatos/db'

import { IContext } from '../context'
import { ErrCode } from '../error'

const MTAG = [ 'common', 'programs', 'service' ]

const RECENTLY_ENDED_CONTRACT_IN_DAYS = 1

export type ProgramContract = (zs.common.program_contract.JSONSelectable & db.LateralResult<{
  program_rule: db.SQLFragment<zs.common.program_rule.JSONSelectable & db.LateralResult<{
    program: db.SQLFragment<zs.common.program.JSONSelectable, never>;
  }>, never>;
  account: db.SQLFragment<zs.common.account.JSONSelectable, never>;
}>);
  
interface GetProgramContractsOptions {
  includeDisabled?: boolean,
}

export async function getProgramContracts(context: IContext, options?: GetProgramContractsOptions): Promise<Result<ProgramContract[], ErrCode>> {
  const TAG = [ ...MTAG, 'getProgramContracts' ]
  const { logger, store: { reader } } = context;

  try {
    const storePool = await reader();

    logger.debug(context, TAG, 'Fetching contracts.')

    const includeDisabled = options?.includeDisabled === true ? dc.isNotNull : dc.isTrue

    const contracts: ProgramContract[] = await db.select(
      'common.program_contract',
      {
        start_at: db.sql`${db.self} < now()`,
        end_at: db.sql`(${db.self} > (now() - INTERVAL '${db.raw(RECENTLY_ENDED_CONTRACT_IN_DAYS.toString())} days')) OR ${db.self} IS NULL`,
        enabled: includeDisabled,
      },
      {
        lateral: {
          program_rule: db.selectExactlyOne('common.program_rule', { program_rule_id: db.parent('program_rule_id') }, {
            lateral: {
              program: db.selectExactlyOne('common.program', { program_id: db.parent('program_id') })
            }
          }),
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

function buildQuery(context: IContext, query: string, params: db.JSONValue): Result<string, ErrCode> {
  const TAG = [ ...MTAG, 'buildQuery' ]
  const { logger } = context

  try {
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
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

enum UpdateAction {
  Enroll = 'enroll', 
  Unenroll = 'unenroll',
  Invalid = 'invalid'
}

interface ProgramMembershipUpdate {
  action: UpdateAction,
  identityId: number,
}

/**
 * Execute a rule. Note rules SHOULD return rows of two values:
 * 
 *   'action' ::= 'enroll' | 'unenroll'
 *   'identity_id' ::= number.
 * 
 * @param context 
 * @param programId 
 * @param query 
 * @param params 
 *
 * @returns 
 */
export async function executeProgramRuleQuery(context: IContext, programId: number, query: string, params: db.JSONValue): Promise<Result<ProgramMembershipUpdate[], ErrCode>> {
  const TAG = [ ...MTAG, 'executeProgramRuleQuery' ]
  const { logger, redshift } = context;

  try {
    const redshiftPool = await redshift()

    const buildQueryResult = buildQuery(context, query, params) 

    if (buildQueryResult.isErr()) {
      logger.error(context, TAG, 'Error building query.', {
        error: buildQueryResult.error,
        programId,
        query,
        params,
      })

      return err(buildQueryResult.error)
    }

    const builtQuery = buildQueryResult.value

    logger.debug(context, TAG, 'Executing program rule query.', {
      programId,
      query,
      params,
      builtQuery,
    })

    const queryResult = await redshiftPool.query(builtQuery)

    logger.debug(context, TAG, 'Query result.', {
      rows: queryResult.rows
    })

    const result: ProgramMembershipUpdate[] = queryResult.rows.map(row => ({ 
      action: row.action === UpdateAction.Enroll ? UpdateAction.Enroll : row.action === UpdateAction.Unenroll ? UpdateAction.Unenroll : UpdateAction.Invalid,
      identityId: row.identity_id,
    }))

    return ok(result)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface ProgramMembershipUpdates {
  programId: number,
  updates: ProgramMembershipUpdate[],
}

interface ProcessProgramContractsResult {
  processCount: number,
  processErrorCount: number, 
  updates: ProgramMembershipUpdates[]
}

/**
 * Process contracts returning all updates that should be performed. Updates are performed separately
 * S.T. contract rules can be executed independently to inspect updates which facilitates creating /
 * testing new rules.
 * 
 * @param context 
 * @param contracts 
 * @returns 
 */
export async function processProgramContracts(context: IContext, contracts: ProgramContract[]): Promise<Result<ProcessProgramContractsResult, ErrCode>> {
  const TAG = [ ...MTAG, 'processProgramContracts' ]
  const { logger, store } = context;

  try {
    const storePool = await store.writer()

    logger.debug(context, TAG, 'Processing contracts.')

    const result: ProcessProgramContractsResult = {
      processCount: 0,
      processErrorCount: 0,
      updates: []
    }

    for (const contract of contracts) {
      const query = contract.program_rule.query 
      const params = contract.params 
      const programId = params instanceof Object && params['program_id'] !== undefined ? params['program_id'] : contract.program_rule.program_id 

      result.processCount = result.processCount + 1

      const executeResult = await executeProgramRuleQuery(context, programId, query, params)
      
      if (executeResult.isErr()) {
        logger.error(context, TAG, 'Error executing program query.', {
          program_contract_id: contract.program_contract_id, 
          account_id: contract.account_id, 
          program_rule_id: contract.program_rule_id,
          params,
          error: executeResult.error
        })

        result.processErrorCount = result.processErrorCount + 1
      } 
      else {
        result.updates.push({
          programId,
          updates: executeResult.value
        })
      }
    }

    //
    // Return result as ok even in the presence of errors such that any successfully processed contracts
    // are returned.
    //
    return ok(result)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

async function deleteNonMembers(context: IContext, programId: number, memberIdentityIds: number[]): Promise<Result<number, ErrCode>> {
  const { logger, store: { writer, } } = context
  const TAG = [ ...MTAG, 'deleteNonMembers' ]

  try {
    const pool = await writer()
    const deleted = await db.deletes('common.program_membership', { 
      program_id: programId,
      identity_id: dc.isIn(memberIdentityIds) 
    }, { returning: ['identity_id'] }).run(pool);

    return ok(deleted.length)
  }
  catch (e) {
    logger.exception(context, TAG, e)    

    return err(ErrCode.EXCEPTION)
  }
}

async function insertMembers(context: IContext, programId: number, memberIdentityIds: number[]): Promise<Result<number, ErrCode>> {
  const { logger, store: { writer, } } = context
  const TAG = [ ...MTAG, 'insertMembers' ]

  try {
    if (memberIdentityIds.length) {
      const pool = await writer()

      const programMembers: zs.common.program_membership.Insertable[] = memberIdentityIds.map(i => ({
        identity_id: i,
        program_id: programId,      
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

interface UpdateProgramMembershipResult {
  updateCount: number,
  updateErrorCount: number, 
  updated: ProgramMembershipUpdates[]
  updatesErrored: ProgramMembershipUpdates[]
}

export async function updateProgramMembership(context: IContext, updates: ProgramMembershipUpdates[]): Promise<Result<UpdateProgramMembershipResult, ErrCode>> {
  const { logger, } = context
  const TAG = [ ...MTAG, 'updateProgramMembership' ] 

  try {
    const result: UpdateProgramMembershipResult = {
      updateCount: 0,
      updateErrorCount: 0,
      updated: [],
      updatesErrored: []
    }

    for (const update of updates) {
      const programId = update.programId 
      const updatesToEnroll = update.updates.filter(u => u.action === UpdateAction.Enroll)
      const updatesToUnenroll = update.updates.filter(u => u.action === UpdateAction.Unenroll)

      if (updatesToEnroll.length) {
        result.updateCount = result.updateCount + 1 

        const updateResult = await insertMembers(context, programId, updatesToEnroll.map(u => u.identityId))

        if (updateResult.isErr()) {
          result.updateErrorCount = result.updateErrorCount + 1 

          logger.error(context, TAG, 'Error enrolling members.', {
            programId,
          })

          result.updatesErrored.push({
            programId,
            updates: updatesToEnroll,
          })
        }
        else {
          result.updated.push({
            programId,
            updates: updatesToEnroll,
          })
        }
      }
      else {
        logger.info(context, TAG, 'No identities to enroll.', {
          programId,
        })
      }

      if (updatesToUnenroll.length) {
        result.updateCount = result.updateCount + 1 

        const updateResult = await deleteNonMembers(context, programId, updatesToUnenroll.map(u => u.identityId))

        if (updateResult.isErr()) {
          result.updateErrorCount = result.updateErrorCount + 1 

          logger.error(context, TAG, 'Error unenrolling members.', {
            programId,
          })

          result.updatesErrored.push({
            programId,
            updates: updatesToUnenroll,
          })
        }
        else {
          result.updated.push({
            programId,
            updates: updatesToUnenroll,
          })
        }

      }
      else {
        logger.info(context, TAG, 'No identities to unenroll.', {
          programId,
        })
      }
    }
    return ok(result)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}