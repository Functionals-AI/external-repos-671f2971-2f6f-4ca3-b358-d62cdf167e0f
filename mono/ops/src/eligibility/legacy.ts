import { ok, err, Result } from 'neverthrow'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { ImportSummary } from '@mono/common/lib/eligibility/store'

const MTAG = [ 'ops', 'eligibility', 'legacy' ]

const MAX_POPULATION_DECREASE_PERCENT = 10 // Don't allow a decrease in population greater than this.

const ALWAYS_ACCEPT_ORG_IDS: number[] = [

]

export function doesImportSatisfyAcceptanceCriteria(context: IContext, summary: ImportSummary): Result<boolean, ErrCode> {
  const { logger } = context 
  const TAG = [ ...MTAG, 'doesImportSatisfyAcceptanceCriteria' ]

  try {
    const { 
      orgId,
      updatedEligibilities,
      insertedEligibilities,
      removedEligibilities,
      summary: summaryString,
      has_previous_import: hasPreviousImport,
    } = summary

    //
    // On the first invokation, consider the acceptance criteria as met.
    //
    if (!hasPreviousImport) {
      return ok(true)
    }

    if (ALWAYS_ACCEPT_ORG_IDS.includes(orgId)) {
      return ok(true)
    }

    const previousValues = summaryString.split('=')[0].split('+').map(v => Number(v))
    const previousPopulation = previousValues.length > 1 ? previousValues[0] + previousValues[1] : Number.MAX_SAFE_INTEGER
    const newPopulation = updatedEligibilities + insertedEligibilities + removedEligibilities

    if (newPopulation < previousPopulation) {
      if (((previousPopulation - newPopulation) / previousPopulation * 100) > MAX_POPULATION_DECREASE_PERCENT) {
        return ok(false)
      }
    }
    return ok(true)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  doesImportSatisfyAcceptanceCriteria,
}