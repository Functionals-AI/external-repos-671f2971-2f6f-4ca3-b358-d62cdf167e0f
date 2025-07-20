import { Result, err, ok } from 'neverthrow'
import { DateTime } from 'luxon'

import { IContext } from '@mono/common/lib/context'
import { AccountIds } from '@mono/common/lib/account/service'
import { ErrCode } from '@mono/common/lib/error'
import { promiseMap } from '@mono/common/lib/promise'

import { createIdentity, updateIdentity } from '../iam/identity/service'
import { updatePatientPaymentMethod } from '../scheduling/payment/store'

const MTAG = [ 'telenutrition', 'eligibility', 'service' ]

export type Account = {
  features: {
    rewards?: boolean,
    efile?: boolean,
  },
  accountId: number,
  organizationId: number,
  suborganizationIds?: string[],
  insurancePackageIds?: number[],
  skip?: boolean,
}

const accounts: Array<Account> = [
  {
    accountId: 39, //AAH,
    organizationId: 182,
    features: {},
    // insurancePackageIds: [],
    skip: false,
  },
  {
    accountId: AccountIds.MTBank, // Aetna MTBank
    organizationId: 146,
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.AmazonCigna,
    organizationId: 207,
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.CareOregon,
    organizationId: 191,
    features: {},
    skip: false,
  },
  {
    accountId: 49, //HealthFirst,
    organizationId: 183,
    features: {},
    // insurancePackageIds: [],
    skip: false,
  },
  {
    accountId: 45, //Elevance,
    organizationId: 201,
    features: {},
    // insurancePackageIds: [],
    skip: false,
  },
  {
    accountId: AccountIds.CountyCare,
    organizationId: 197,
    insurancePackageIds: [359841],
    features: {
      rewards: true,
    },
    skip: false,
  },
  {
    accountId: AccountIds.BannerHealth,
    organizationId: 200,
    insurancePackageIds: [41278, 69728],
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.FedEx,
    organizationId: 171,
    suborganizationIds: [
      '2501092',
      '2501095',
      '2501097',
      '2501099',
      '2501101',
      '2501103',
      '3333236',
      '2501066',
      '2501068',
      '2501070',
      '2501072',
      '2501074',
      '2501076',
      '2501079',
      '2501081',
      '2499248',
      '2499250',
      '2499252'
    ],
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.FidelisCare,
    organizationId: 208,
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.HSCSN,
    organizationId: 198,
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.SuezWTDCigna,
    organizationId: 171,
    suborganizationIds: [
      '3341975'
    ],
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.EPAMCigna,
    organizationId: 171,
    suborganizationIds: [
      '3341995'
    ],
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.MNPS,
    organizationId: 171,
    suborganizationIds: [
      '3333770'
    ],
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.SEICigna,
    organizationId: 171,
    suborganizationIds: [
      '3209340',
    ],
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.SmithNephew,
    organizationId: 171,
    suborganizationIds: [
      '3337975',
    ],
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.ArizonaPublicSchoolsCigna,
    organizationId: 171,
    suborganizationIds: [
      '3341058',
    ],
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.CCHPMedicaid,
    organizationId: 174,
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.CCHPExchange,
    organizationId: 175,
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.UmpquaMedicaid,
    organizationId: 184,
    features: {},
    insurancePackageIds: [93189],
    skip: false,
  },
  {
    accountId: AccountIds.IndependentHealth,
    organizationId: 8,
    features: {},
    insurancePackageIds: [129184],
    skip: false,
  },
  {
    accountId: AccountIds.MartinsPointGA,
    organizationId: 177,
    features: {},
    insurancePackageIds: [114427],
    skip: false,
  },
  {
    accountId: AccountIds.CDPHP,
    organizationId: 14,
    suborganizationIds: [
      '9027b68c-521f-4e3f-8d1a-b9f5a3ddbbd4',
      'ca1642b5-4182-40de-99db-b37a4a81b5b2',
      '4247f009-b427-4146-9c79-e0f0fc444706',
      'b8308d08-bd57-4b4c-971e-1f52811a062a',
    ],
    features: {},
    insurancePackageIds: [8087],
    skip: false,
  },
  {
    accountId: AccountIds.CDPHP,
    organizationId: 10,
    suborganizationIds: [
      '8497',
      '8498',
      '8504',
      '8499',
    ],
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.Biomerieux,
    organizationId: 85,
    suborganizationIds: ['biomerieux'],
    features: {},
    insurancePackageIds: [2681],
    skip: false,
  },
  {
    accountId: 30, //HSCSN,
    organizationId: 198,
    features: {},
    insurancePackageIds: [188731],
    skip: false,
  },
  {
    accountId: 29, //UHCDNP,
    organizationId: 199,
    features: {},
    // insurancePackageIds: [],
    skip: false,
  },
  {
    accountId: AccountIds.Samaritan,
    organizationId: 206,
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.AetnaABHIL,
    organizationId: 202,
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.Quartz,
    organizationId: 195,
    features: {},
    skip: false,
  },
  {
    accountId: AccountIds.ElevanceHouseFoodBenefit,
    organizationId: 210,
    features: {
      rewards: true,
    },
    skip: false,
  },
  {
    accountId: AccountIds.ElevanceHouseNutritionEducation,
    organizationId: 211,
    features: {
      rewards: true,
    },
    skip: false,
  },
  {
    accountId: AccountIds.MolinaIL,
    organizationId: 214,
    features: {
      rewards: false,
    },
    skip: false,
  },
  {
    accountId: AccountIds.ElevanceKS,
    organizationId: 213,
    features: {
      rewards: true,
    },
    skip: false,
  },
  {
    accountId: AccountIds.Brmc,
    organizationId: 212,
    features: {
      rewards: false,
    },
    skip: false,
  },
  {
    accountId: AccountIds.AdvancedHealth,
    organizationId: 215,
    features: {
      rewards: true,
    },
    skip: false,
  },    
  {
    accountId: AccountIds.Highmark,
    organizationId: 216,
    features: {
      rewards: true,
    },
    skip: false,
  },
]

interface UpdateIdentitiesIneligibleOptions {
  isDryRun: boolean
}

async function updateIdentitiesIneligible(context: IContext, account, options?: UpdateIdentitiesIneligibleOptions): Promise<Result<number, ErrCode>[]> {
  const { logger, redshift } = context
  const TAG = [ ...MTAG, 'updateIdentitiesIneligible']
  const rspool = await redshift()

  const isDryRun = options?.isDryRun ?? false

  const sql = `
    SELECT 
      IDE.identity_id, IDE.account_id, IDE.eligible_id
    FROM fq_common_telenutrition.iam_identity IDE
    LEFT JOIN fq_foodapp_tenants.go_users_eligible GUE ON IDE.eligible_id=GUE.id
    WHERE
      GUE.id IS NULL
      AND IDE.account_id=${account.accountId}
      AND IDE.eligible_id IS NOT NULL;
  `
  logger.debug(context, TAG, 'query', {
    account_id: account.accountId,
    sql,
  })

  const { rows } = await rspool.query<{ identity_id: number, account_id: number, eligible_id: number }>(sql)

  logger.debug(context, TAG, `Returned ${rows.length} rows`, {
    account_id: account.accountId,
    ineligible_count: rows.length
  })

  if (isDryRun) {
    return rows.map(row => ok(row.identity_id))
  }

  return promiseMap<number, ErrCode>(rows.map(row => {
    return async () => {
      logger.info(context, TAG, `unassociate eligibility from identity:`, {
        identity_id: row.identity_id,
        account_id: row.account_id,
        eligible_id: row.eligible_id
      })

      const result = await updateIdentity(context, row.identity_id, { eligibleId: null, accountId: null })

      if (result.isErr()) {
        logger.error(context, `${TAG}.error`, `failed to update identity`, { error: result.error, identity: row })
        return err(result.error)
      }
      return ok(row.identity_id)
    }
  }), { concurrency: 10 })
}

interface AssociateIdentitiesWithEligibilityOptions {
  isDryRun: boolean
}

interface AssociateIdentitiesWithEligibilityResult {
  identityId: number,
  paymentMethodId: number,
  eligibleId: number,
}

/**
 * Associate existing identities with eligibilities when possible. Essentially:
 *  - identity attributes must match,
 *  - identity must have an associated patient with a payment method where E.person_id = PM.member_id where:
 *    - E: an eligibility record (mysql tenants.go_users_eligiblie)
 *    - PM: a patient payment record (postgres telenutrition.schedule_patient_payment_method)
 * 
 * @param context 
 * @param accountId
 * @param organizationId 
 * @param options 
 */
async function associateIdentitiesWithEligiblity(context: IContext, accountId: number, organizationId: number, options?: AssociateIdentitiesWithEligibilityOptions): Promise<Result<AssociateIdentitiesWithEligibilityResult, ErrCode>[]> {
  const { logger } = context
  const TAG = [ ...MTAG, 'associateIdentityWithEligibility' ]

  const isDryRun = options?.isDryRun ?? false

try {
    const getUpdatesSql = `
with 
  -- 
  -- Eligibilities with associated identities 
  --
  unassociated_eligibilities as (
    select 
      E.id as eligible_id,
      E.person_id as person_id,
      E.firstname as firstname,
      E.lastname as lastname,
      E.birthday as birthday,
      E.zip_code as zip_code 
    from fq_foodapp_tenants.go_users_eligible E 
    left join fq_common_telenutrition.iam_identity I ON 
      E.id = I.eligible_id 
    where 
      E.organization_id = ${organizationId}
      AND 
      I.identity_id IS NULL 
  ),
  unassociated_eligibilities_count as (
    select count(*) as count from unassociated_eligibilities 
  ),
  matched_identities as (
    select 
      * 
    from (
      select 
        UE.eligible_id as eligible_id,
        PM.payment_method_id as payment_method_id,
        I.identity_id as identity_id,
        I.first_name as first_name,
        I.last_name as last_name,
        I.birthday as birthday,
        I.zip_code as zip_code,
        row_number() over (
          partition by UE.eligible_id 
          order by I.identity_id DESC
        ) as identity_row
      from unassociated_eligibilities UE 
      left join fq_common_telenutrition.iam_identity I ON 
        LOWER(UE.firstname) = LOWER(I.first_name)
        AND 
        LOWER(UE.lastname) = LOWER(I.last_name)
        AND 
        LOWER(UE.birthday) = LOWER(I.birthday)
        AND 
        SUBSTRING(UE.zip_code, 1, 5) = SUBSTRING(I.zip_code, 1, 5) 
      inner join fq_common_telenutrition.schedule_patient SP ON I.identity_id = SP.identity_id 
      inner join fq_common_telenutrition.schedule_patient_payment_method PM ON SP.patient_id = PM.patient_id 
      where 
        I.eligible_id IS NULL 
        AND 
        I.identity_id IS NOT NULL 
        AND 
        SP.patient_id IS NOT NULL 
        AND 
        (
          (
            --
            -- Elevance has all digits in eligibiltiy, while payment method may have  non-digits.
            --
            PM.payment_method_type_id = 23 AND UE.person_id = REGEXP_REPLACE(PM.member_id, '\\D+', '')
          )
          OR
          (
            --
            -- All other payment methods are an exact mattch.
            --
            PM.payment_method_type_id != 23 AND UE.person_id = PM.member_id
          )
        )
    )
    where 
      identity_row = 1
  ),
  matched_identities_count as (
    select count(*) as count from matched_identities 
  )
select 
  MI.identity_id as identity_id,
  MI.payment_method_id as payment_method_id,
  MI.eligible_id as eligible_id,
  ${accountId} as account_id 
from 
  matched_identities MI 
ORDER BY MI.eligible_id ASC 
;
    `

    logger.info(context, TAG, 'sql', {
      account_id: accountId,
      getUpdatesSql,
    })
  
    const { redshift } = context
    const rspool = await redshift()
  
    const { rows } = await rspool.query<{ identity_id: number, payment_method_id: number, eligible_id: number }>(getUpdatesSql)
  
    logger.info(context, TAG, `Returned ${rows.length} rows`, {
      account_id: accountId,
      update_count: rows.length,
    })
  
    if (isDryRun) {
      return rows.map(row => ok({
        identityId: row.identity_id, 
        paymentMethodId: row.payment_method_id,
        eligibleId: row.eligible_id,
      }))
    }

    return promiseMap<AssociateIdentitiesWithEligibilityResult, ErrCode>(rows.map(row => {
      return async () => {
        logger.info(context, TAG, `Associating eligibility with identity`, {
          identityId: row.identity_id,
          paymentMethodId: row.payment_method_id,
          eligibleId: row.eligible_id
        })
  
        const identityUpdateResult = await updateIdentity(context, row.identity_id, { 
          eligibleId: row.eligible_id, 
          accountId: accountId 
        })
  
        if (identityUpdateResult.isErr()) {
          logger.error(context, `${TAG}.error`, `failed to update identity`, { error: identityUpdateResult.error, update: row })

          return err(identityUpdateResult.error)
        }

        const paymentUpdateResult = await updatePatientPaymentMethod(context, row.payment_method_id, { eligibleId: row.eligible_id })

        if (paymentUpdateResult.isErr()) {
          logger.error(context, `${TAG}.error`, `failed to update identity`, { error: paymentUpdateResult.error, update: row })

          return err(paymentUpdateResult.error)
        }

        return ok({
          identityId: row.identity_id,
          paymentMethodId: row.payment_method_id,
          eligibleId: row.eligible_id,
        })
      }
    }), { concurrency: 10 })
  
    return [err(ErrCode.NOT_IMPLEMENTED)]
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return [err[ErrCode.EXCEPTION]]
  }
}

interface CreateIdentitiesFromEligibilityOptions {
  isDryRun: boolean
}

async function createIdentityFromEligibility(context: IContext, account, options?: CreateIdentitiesFromEligibilityOptions): Promise<Result<number, ErrCode>[]> {
  const { logger } = context
  const TAG = [ ...MTAG, 'createIdentityFromEligibility' ]

  const isDryRun = options?.isDryRun ?? false

  let suborganizationIdsSql = ''

  if (Array.isArray(account.suborganizationIds) && account.suborganizationIds.length > 0) {
    suborganizationIdsSql = `AND UE.suborganization_id IN (${account.suborganizationIds.map(id => `'${id}'`).join(',')})`
  }

  const sql = `
      WITH
      eligibles AS (
        SELECT
          UE.id as eligible_id,
          ID.identity_id,
          UE.firstname,
          UE.lastname,
          NVL(UE.birthday, GU.birthday) as birthday,
          LEFT(NVL(UE.zip_code, GUI.zip),5) as zip_code
        FROM fq_foodapp_tenants.go_users_eligible UE
        LEFT JOIN fq_foodapp_tenants.go_users GU ON UE.id = GU.eligible_id
        LEFT JOIN fq_foodapp_tenants.go_user_infos GUI ON GU.id = GUI.user_id
        LEFT JOIN fq_common_telenutrition.iam_identity ID ON UE.id = ID.eligible_id
        WHERE
          UE.organization_id = ${account.organizationId}
          ${suborganizationIdsSql}
      ),
      identities AS (
        SELECT
          ID.eligible_id,
          ID.identity_id
        FROM fq_common_telenutrition.iam_identity ID
        WHERE
          ID.account_id = ${account.accountId}
      ),
      new_identities AS (
        SELECT
          ${account.accountId} as account_id,
          E.eligible_id,
          E.firstname as first_name,
          E.lastname as last_name,
          E.birthday,
          LEFT(E.zip_code,5) as zip_code
        FROM eligibles E
        LEFT JOIN identities I ON E.eligible_id = I.eligible_id
        WHERE E.identity_id IS NULL
      ),
      create_identities AS (
            SELECT
        NID.*
      FROM new_identities NID
      LEFT JOIN fq_common_telenutrition.iam_identity ID ON REGEXP_REPLACE(LOWER(ID.first_name), '[^a-z]', '')=REGEXP_REPLACE(LOWER(NID.first_name), '[^a-z]', '') AND REGEXP_REPLACE(LOWER(ID.last_name), '[^a-z]', '')=REGEXP_REPLACE(LOWER(NID.last_name), '[^a-z]', '') AND ID.birthday=NID.birthday AND ID.zip_code=LEFT(NID.zip_code,5)
      WHERE
        ID.identity_id IS NULL
        AND NID.first_name IS NOT NULL
        AND NID.last_name IS NOT NULL
        AND NID.birthday IS NOT NULL
        AND NID.zip_code IS NOT NULL
        AND NID.first_name <> 'NULL'
        AND NID.last_name <> 'NULL'
      )
      SELECT
        max(account_id) as account_id, max(eligible_id) AS eligible_id, first_name, last_name, birthday, zip_code
      FROM create_identities
      GROUP BY first_name, last_name, birthday, zip_code;      
    `

  logger.info(context, TAG, 'sql', {
    account_id: account.accountId,
    sql,
  })

  const { redshift } = context
  const rspool = await redshift()

  const { rows } = await rspool.query<{ account_id: number, eligible_id: number, first_name: string, last_name: string, birthday: Date, zip_code: string }>(sql)

  logger.info(context, TAG, `Returned ${rows.length} rows`, {
    account_id: account.accountId,
    eligible_count: rows.length,
  })

  if (isDryRun) {
    return rows.map(row => ok(row.eligible_id))
  }

  return promiseMap<number, ErrCode>(rows.map(row => {
    return async () => {
      logger.info(context, TAG, `create identity:`, {
        account_id: row.account_id,
        eligible_id: row.eligible_id,
        first_name: row.first_name,
        last_name: row.last_name,
        birthday: DateTime.fromJSDate(row.birthday).toSQLDate(),
        zip_code: row.zip_code
      })

      const result = await createIdentity(context, {
        accountId: row.account_id,
        eligibleId: row.eligible_id,
        firstName: row.first_name.trim(),
        lastName: row.last_name.trim(),
        birthday: row.birthday,
        zipCode: row.zip_code,
      })

      if (result.isErr()) {
        logger.error(context, `${TAG}.error`, `failed to create identity`, { error: result.error, identity: row })
        return err(result.error)
      }
      return ok(result.value.identityId)
    }
  }), { concurrency: 50 })
}

enum ResultSummaryType {
  Associate = 'Associatte',
  Create = 'Create',
  Update = 'Update',
}

interface ResultSummary {
  account: Account,
  type: ResultSummaryType,
  ids: number[],
  errors: ErrCode[],
}

export type UpsertIdentitiesResult = ResultSummary[]

export async function upsertIdentities(context: IContext): Promise<Result<UpsertIdentitiesResult, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'upsertIdentities' ]

  const isDryRun = false

  try {
    const result: UpsertIdentitiesResult = []
    
    for (let account of accounts.filter(a => a.skip !== true)) {
      const updateResults = await updateIdentitiesIneligible(context, account, { isDryRun, })

      const updateSummary: ResultSummary = updateResults.reduce((summary: ResultSummary, result) => {
        if (result.isOk()) {
          summary.ids.push(result.value)
        }
        else {
          summary.errors.push(result.error)
        }
        return summary
      }, {
        account,
        type: ResultSummaryType.Update,
        ids: [],
        errors: []
      })

      result.push(updateSummary)

      logger.info(context, TAG, 'Updated ineligible identities.', {
        account_id: account.accountId,
        update_count: updateSummary.ids.length,
        ids: updateSummary.ids,
        error_count: updateSummary.errors.length,
      })

      const associateResults = await associateIdentitiesWithEligiblity(context, account.accountId, account.organizationId, { isDryRun, })

      const associateSummary: ResultSummary = associateResults.reduce((summary: ResultSummary, result) => {
        if (result.isOk()) {
          summary.ids.push(result.value.identityId)
        }
        else {
          summary.errors.push(result.error)
        }
        return summary
      }, {
        account,
        type: ResultSummaryType.Associate,
        ids: [],
        errors: []
      })

      result.push(associateSummary)

      logger.info(context, TAG, 'Associated identities with eligibilities.', {
        account_id: account.accountId,
        update_count: associateSummary.ids.length,
        ids: associateSummary.ids,
        error_count: associateSummary.errors.length,
      })

      const createResults = await createIdentityFromEligibility(context, account, { isDryRun, })

      const createSummary: ResultSummary = createResults.reduce((summary: ResultSummary, result) => {
        if (result.isOk()) {
          summary.ids.push(result.value)
        }
        else {
          summary.errors.push(result.error)
        }
        return summary
      }, {
        account,
        type: ResultSummaryType.Create,
        ids: [],
        errors: []
      })
      
      result.push(createSummary)

      logger.info(context, TAG, 'Created eligible identities.', {
        account_id: account.accountId,
        create_count: createSummary.ids.length,
        ids: createSummary.ids,
        error_count: createSummary.errors.length,
      })
    }

    return ok(result)
  } catch (e) {
    logger.exception(context, `${TAG}.error`, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  upsertIdentities,
}