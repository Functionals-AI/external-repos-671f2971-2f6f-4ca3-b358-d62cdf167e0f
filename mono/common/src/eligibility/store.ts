/**
 * Represents what is invisioned Eligibility data for members will look like. 
 * Currently, interfaces with the legacy MySQL data.
 */
import { Result, err, ok } from 'neverthrow'
import { RowDataPacket } from "mysql2";
import { DateTime } from 'luxon'
import * as db from 'zapatos/db'

import { IContext } from '../context'
import { ErrCode } from '../error'

const MTAG = [ 'common', 'eligibility', 'store' ]

export enum EligibilityMemberGender {
  'MALE' = 'M',
  'FEMALE' = 'F'
}

export interface EligibilityMemberRecord extends EligibilityMemberNewRecord {
  eligibilityId: number,
}

export interface EligibilityMemberNewRecord {
  accountId: number,
  organizationId?: number,
  externalId?: string,
  firstName: string,
  lastName: string,
  dob?: Date,
  lang?: string,
  gender?: EligibilityMemberGender,
  phone?: string,
  phoneMobile?: string,
  phoneWork?: string,
  phoneHome?: string,
  email?: string,
  addressLine1?: string,
  addressLine2?: string,
  city?: string,
  state?: string,
  zipcode?: string,
  groupId?: string,
  policyId?: string,
  isDependent?: boolean,
  eligibilityStartDate?: Date,
  eligibilityEndDate?: Date,
  sourceData?: db.JSONValue,
}

enum EligibilityMemberDBGender {
  'MALE' = 'MALE',
  'FEMALE' = 'FEMALE'
}

/**
 * Transform from DB to JS.
 * 
 * Note:
 *  - person_id, group_id, group_number: person_id is ussally the ins. group number.
 *      TODO: special case:
 *        person_id -> externalID,
 *        group_number -> policyId
 * 
 * @param record 
 */
function mapRecord(record: RowDataPacket): EligibilityMemberRecord {
  const keyMap = {
    id: 'eligibilityId',
    account_id: 'accountId',
    organization_id: 'organizationId',
    firstname: 'firstName',
    lastname: 'lastName',
    birthday: 'dob',
    language: 'lang',
    gender: 'gender',
    mobile_phone: 'phoneMobile',
    email_decrypt: 'email',
    address: 'addressLine1',
    city: 'city',
    state: 'state',
    zip_code: 'zipcode',
    group_id: 'groupId',
    //
    // TODO: Selectively map:
    //   person_id -> externalId,
    //   group_id     -> groupId
    //   group_number -> policyId
    //
    person_id: 'policyId',
    is_dependent: 'isDependent',
    raw_data: 'sourceData'
  }

  return Object.keys(record).reduce((target: EligibilityMemberRecord, k) => {
    const targetKey = keyMap[k]
    if (k in [
      'id',
      'account_id',
    ]) {
      target[targetKey] = record[k] ?? 0
    }
    else if (k in [
      'firstname',
      'lastname',
    ]) {
      target[targetKey] = record[k] ?? ''
    }
    else if (k === 'gender') {
      const dbGender = record[k]

      if (dbGender === EligibilityMemberDBGender.MALE) {
        target[targetKey] = EligibilityMemberGender.MALE
      }
      else if (dbGender === EligibilityMemberDBGender.FEMALE) {
        target[targetKey] = EligibilityMemberGender.FEMALE
      }
    }
    else if ((record[k] ?? '') !== '') { 
      target[targetKey] = record[k] 
    }
    return target
  }, {
    eligibilityId: 0,
    accountId: 0,
    firstName: '',
    lastName: '',
  })
}

export async function selectEligibilityMemberByPolicyId(context: IContext, policyId: string, accountId: number): Promise<Result<EligibilityMemberRecord, ErrCode>> {
  const { logger, mysql: { reader } } = context 
  const TAG = [ ...MTAG, 'selectMemberByPolicyId' ]

  try {
    const mysql = await reader()

    const result = await mysql.query(`
SELECT 
  *, 
  AES_DECRYPT(email_crypt, 'complicatedkeyforAESencryption') AS email_decrypt
FROM tenants.go_users_eligible WHERE person_id=? AND account_id=?;
`, [policyId, accountId])

    // @ts-ignore
    if (result[0].length > 0) {
      //@ts-ignore
      const record: RowDataPacket = result[0][0]

      return ok(mapRecord(record))
    }
    return err(ErrCode.NOT_FOUND)
  }
  catch(e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function createEligibilityMember(context: IContext, record: EligibilityMemberNewRecord): Promise<Result<EligibilityMemberRecord, ErrCode>> {
  const { logger, mysql: { writer }} = context
  const TAG = [ ...MTAG, 'createEligibilityMember']

  try {
    const mysql = await writer()

    const dob = record.dob ? DateTime.fromJSDate(record.dob).toISODate() : ''
    const gender = record.gender === EligibilityMemberGender.MALE ?
      EligibilityMemberDBGender.MALE :
      record.gender === EligibilityMemberGender.FEMALE ?
        EligibilityMemberDBGender.FEMALE : ''
    const mobilePhone = record.phoneMobile || record.phone || record.phoneHome || record.phoneWork || ''

    const rawValues = {
      account_id: record.accountId ?? '',
      person_id: record.policyId ?? '',
      firstname: record.firstName ?? '',
      lastname: record.lastName ?? '',
      organization_id: record.organizationId ?? '',
      zip_code: record.zipcode ?? '',
      birthday: dob,
      gender: gender,
      mobile_phone: mobilePhone,
      email: record.email ? record.email : null,
      email_crypt: record.email ? record.email : null,
      address: record.addressLine1 ?? '',
      city: record.city ?? '',
      state: record.state ?? '',
      language: record.lang ?? '',
      raw_data: record.sourceData ? JSON.stringify(record.sourceData) : null,
    }

    // Filter out `null` and empty values while preserving order
    const cleanEntries = Object.entries(rawValues).filter(([_, value]) => value !== null && value !== '');
    const cleanKeys = cleanEntries.map(([key]) => key);
    const cleanValues = cleanEntries.map(([_, value]) => value);

    // Construct SQL placeholders with hash/encrypt methods for email and email_crypt
    const placeholders = cleanKeys.map(key =>
      key === 'email_crypt' ? "aes_encrypt(?, 'complicatedkeyforAESencryption')" :
        key === 'email' ? 'md5(?)' : '?'
    ).join(',');

    logger.debug(context, TAG, 'Inserting', record)
    logger.debug(context, TAG, 'Keys:', cleanKeys)
    logger.debug(context, TAG, 'Values:', cleanValues)

    // Execute the query with placeholders and values
    const result = await mysql.query(
      `INSERT INTO tenants.go_users_eligible (${cleanKeys.join(',')}) VALUES (${placeholders});`,
      cleanValues
    )

    //@ts-ignore
    if (result.length === 0) {
      logger.error(context, TAG, `error creating eligible`, record)

      return err(ErrCode.SERVICE)
    }
    else {
      //@ts-ignore
      const eligibilityId = result[0].insertId

      return ok({
        eligibilityId,
        ...record,
      })
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(e)
  }
}

interface EligibilityImportLog extends RowDataPacket {
  summary: any
}

export interface ImportSummary {
  insertedEligibilities: number,
  updatedEligibilities: number,
  removedEligibilities: number,
  upgradedUsers: number,
  downgradedUsers: number,
  officeUpdatedUsers: number,
  loggedUpgrades: number,
  loggedDowngrades: number,
  removedHouseholdInvites: number,
  downgradedDependentUsers: number,
  loggedInviteRemovals: number,
  loggedDependentUsersDowngrades: number,
  otherOrgsContainingEligibleUsers: number[],
  has_previous_import: boolean, 
  stats_matching: boolean,
  summary: string,
  fileName: string,
  isCommit: string, // "dry-run",
  importDate:  string,
  orgId: number,
  spec: string,     // "import.efile.quartz.195.dry-run"
}

/**
 * @typedef ImportDateString - Date the import was executed (UTC), format YYYY-MM-DD
 */
export type ImportDateString = string

export enum CommitStatus {
  DryRun = 'dry_run',
  Commit = 'commit'
}

/**
 * selectImportSummary - Get import summary. Sample summary is as follows:
 * 
 *  {
 *    "insertedEligibilities":24,
 *    "updatedEligibilities":26,
 *    "removedEligibilities":0,
 *    "upgradedUsers":0,
 *    "downgradedUsers":0,
 *    "officeUpdatedUsers":0,
 *    "loggedUpgrades":0,
 *    "loggedDowngrades":0,
 *    "removedHouseholdInvites":0,
 *    "downgradedDependentUsers":0,
 *    "loggedInviteRemovals":0,
 *    "loggedDependentUsersDowngrades":0,
 *    "otherOrgsContainingEligibleUsers":[10,150,182,184,136,149,151],
 *    "has_previous_import":true,"stats_matching":false,
 *    "summary":"32 + 20 != 26 + 0",
 *    "fileName":"Quartz_Foodsmart_Eligibility_20241206.rSKZMSrp.txt with addons null",
 *    "isCommit":"dry-run",
 *    "spec":"import.efile.quartz.195.dry-run"
 *  }
 * 
 * @param context 
 * @param importDate 
 * @param orgId 
 * @param spec 
 * @returns 
 */
export async function selectImportSummary(context: IContext, importDate: ImportDateString, orgId: number, spec: string, commitStatus: CommitStatus): Promise<Result<ImportSummary, ErrCode>> {
  const { logger, mysql:  { reader }} = context 
  const TAG = [ ...MTAG, 'selectImportSummary' ]

  try {
    const pool = await reader()
    const sql = `
SELECT 
summary
FROM
tenants.go_users_eligible_import_log 
WHERE 
import_date>='${importDate}' AND 
organization_id=${orgId} AND
spec='${spec}' AND 
commit_status='${commitStatus}'
ORDER BY import_date DESC, id DESC
LIMIT 1
;
`
    const [dryrunLogs] = await pool.query<EligibilityImportLog[] & RowDataPacket[]>(sql)

    if (dryrunLogs.length === 0) {
      logger.error(context, TAG, `no dry run logs found..`)

      return err(ErrCode.EXCEPTION)
    }

    const summary = JSON.parse(dryrunLogs[0].summary)

    logger.info(context, TAG, `dryrunLogs are - ${JSON.stringify(summary)}`)

    return ok({
      ...summary,
      importDate,
      orgId,
      spec,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function updateEligibilityMember(
  context: IContext,
  record: EligibilityMemberRecord
): Promise<Result<null, ErrCode>> {
  const { logger, mysql: { writer }} = context
  const TAG = [ ...MTAG, 'updateEligibility']

  try {
    const pool = await writer()

    const dob = record.dob ? DateTime.fromJSDate(record.dob).toISODate() : ''
    const gender = record.gender === EligibilityMemberGender.MALE ? 
      EligibilityMemberDBGender.MALE : 
      record.gender === EligibilityMemberGender.FEMALE ? 
      EligibilityMemberDBGender.FEMALE : ''
    const mobilePhone = record.phoneMobile || record.phone || record.phoneHome || record.phoneWork || ''

    const values = new Map<string, any>([
      ['firstname', record.firstName],
      ['lastname', record.lastName],
      ['zip_code', record.zipcode],
      ['birthday', dob],
      ['gender', gender],
      ['mobile_phone', mobilePhone],
      ['address', record.addressLine1],
      ['city', record.city],
      ['state', record.state],
      ['language', record.lang],
    ])

    // Throws on failure
    await pool.query(`
      UPDATE tenants.go_users_eligible
      SET
        ${Array.from(values.keys()).map(k => `${k}=?`).join(',')}
      WHERE
        eligibility_id=?
    `, [
      ...Array.from(values.values()),
      record.eligibilityId,
    ])

    return ok(null)
  } catch(e) {
    logger.error(context, TAG, "Failed to update eligibility.", {
      record,
      error: e,
    })

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  selectEligibilityMemberByPolicyId,
  createEligibilityMember,
  selectImportSummary,
  updateEligibilityMember,
}
