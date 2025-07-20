/**
 * Perform ETL on CalOptima data.
 */
import { Readable } from 'node:stream'
import { err, ok, Result } from "neverthrow"
import { createHash } from 'node:crypto'
import { DateTime, Settings as DateTimeSettings } from 'luxon'
import { parse } from 'csv-parse'
import { transform } from 'stream-transform'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"
import { AccountIds } from '@mono/common/lib/account/service'
import { languageToISO, toFirstOrLastName, toPhone } from '@mono/common/lib/data/normalize'
import { createEligibilityMember, selectEligibilityMemberByPolicyId } from '@mono/common/lib/eligibility/store'
import { ReferralService, ReferralStatus, Sources as ReferralSources, ReferralInboundRecord, createInboundReferral } from '@mono/common/lib/referral/service'
import { performReferralReauthActions, PerformReferralActionsOptions, ReauthData } from '@mono/common/lib/referral/sources/caloptima';
import { ReauthPatientData, recordToPatientReauthData } from '@mono/common/lib/referral/sources/caloptima/sheet';


import { NormalizedReferralInboundRecord, ReferralImportResult, RecordLoader, RecordTransformer, SourceReferralRecord, ValidationErrorReason, referralToEligibilityRecord, importInboundReferrals, validateNormalizedReferralRecord } from '../service'
import { ReferralStatus as CalOptimaReferralStatus, updateReferralStatus } from '@mono/common/lib/integration/cal-optima-connect/referral'
import {
  CalOptimaReferral,
  CalOptimaService,
  createCaloptimaConnectContext,
  destroyCaloptimaConnectContext,
  MedicalCondition,
  UtilizationCriteria
} from '@mono/common/lib/integration/cal-optima-connect/browser';

const SOURCE = ReferralSources.CalOptima
const MTAG = [ 'ops', 'referrals', 'sources', SOURCE ]

/**
 * Return a CalOptima record transformer. Handles filtration of dulicates. 
 * Creates a closure with a set of hashes to keep track of records.
 * 
 * CalOptima fields are as follows:
 * 
 * "PATIENT_UID",
 * "CIN",
 * "FIRST_NAME",
 * "LAST_NAME",
 * "DOB",
 * "ADDRESS_1",
 * "ADDRESS_2",
 * "CITY",
 * "STATE",
 * "POSTAL_CODE",
 * "PHONE",
 * "EMAIL",
 * "LANGUAGE_PREF",
 * "IS_ELIGIBLE",
 * "NEED_NAME",
 * "SERVICE_UID",
 * "SERVICE_CREATED_DATE",
 * "REFERRAL_DATE",
 * "REFERRED_BY",
 * "RELATIONSHIP_TO_MEMBER",
 * "REFERRING_PROV_NPI",
 * "REFERRING_PHONE",
 * "REFERRING_PHONE_EXT",
 * "REFERRING_FAX",
 * "REFERRING_EMAIL",
 * "REFERRING_ORG",
 * "BENEFIT_EXHAUSTED",
 * "CAFD_DISCHARGE_PLAN",
 * "CAFD_DIABETES",
 * "CAFD_KIDNEY",
 * "CAFD_HEART",
 * "CAFD_DISCHARGE",
 * "CAFD_RISK",
 * "CAFD_COORD",
 * "CAFD_COORD_DESC",
 * "CAFD_DIET",
 * "CAFD_DIET_DESC",
 * "CAFD_DELIVERY",
 * "CAFD_FRIDGE",
 * "CAFD_REHEAT",
 * "AUTH_NBR",
 * "EXT_AUTH_NBR",
 * "AUTH_STATUS",
 * "AUTH_FROM",
 * "AUTH_TO"
 */
function recordTransfomerFactory(): RecordTransformer {
  DateTimeSettings.twoDigitCutoffYear = Number(DateTime.now().toFormat('yy'))

  const hashed = new Set()
  function hashRecord(record: SourceReferralRecord): string {
    const hash = createHash('md5')

    hash.update(Object.entries(record).map(e => `${e[0]}:${e[1]}`).join('\n'))

    return hash.digest('hex')
  }

  function recordTransformer(context: IContext, record: SourceReferralRecord): Result<Partial<NormalizedReferralInboundRecord> | null, ErrCode> {
    const { logger } = context
    const TAG = [ ...MTAG, 'recordTransformer' ]

    try {
      const hash = hashRecord(record)

      if (hashed.has(hash)) {
        logger.info(context, TAG, 'Duplication record.', record)

        return ok(null)
      }
      else {
        hashed.add(hash)

        const transformed: Partial<NormalizedReferralInboundRecord> = {
          referralSource: ReferralSources.CalOptima,
          referralService: ReferralService.HEALTH_ASSESSMENT,
          referralStatus: ReferralStatus.REQUESTED,
          //
          // IS_ELIGIBLE -> isEligible
          //
          isEligible: record.IS_ELIGIBLE === 'T' ? true : false,
          ...(record.REFERRAL_DATE && { referralDate: DateTime.fromFormat(record.REFERRAL_DATE as string, 'MM/dd/yyyy hh:mm:ss a', { zone: 'UTC' }).toJSDate() }),
          //
          // referral attributes:
          //
          //  SERVICE_UID -> referralExternalId
          //  PATIENT_UUID -> patientExternalId
          //  FIRST_NAME -> referralFirstName
          //  LAST_NAME  -> referralLastName
          //  DOB -> dob
          //  LANGUAGE_PREF -> referralLang
          //  PHONE -> referralPhone
          //  EMAIL -> referralEmail
          //  ADDRESS_1
          //  ADDRESS_2
          //  CITY
          //  STATE
          //  POSTAL_CODE
          //  CIN -> referralPolicyId
          //  REFERRAL_DATE
          //
          ...(record.SERVICE_UID && { referralExternalId: record.SERVICE_UID }),
          ...(record.PATIENT_UUID && { referralExternalPatientId: record.PATIENT_UUID }),
          ...(record.FIRST_NAME   && { referralFirstName: toFirstOrLastName(record.FIRST_NAME) }),
          ...(record.LAST_NAME    && { referralLastName: toFirstOrLastName(record.LAST_NAME) }),
          ...(record.DOB         && { referralDob: DateTime.fromFormat(record.DOB as string, 'MM/dd/yyyy', { zone: 'UTC' }).toJSDate() }),
          ...(record.LANGUAGE_PREF && { referralLang: languageToISO(record.LANGUAGE_PREF) }),
          ...(record.PHONE         && { referralPhone: toPhone(record.PHONE) }),
          ...(record.EMAIL         && { referralEmail: record.EMAIL }),
          ...(record.ADDRESS_1     && { referralAddress1: record.ADDRESS_1 }),
          ...(record.ADDRESS_2     && { referralAddress2: record.ADDRESS_2 }),
          ...(record.CITY          && { referralCity: record.CITY }),
          ...(record.STATE         && { referralState: record.STATE }),
          ...(record.POSTAL_CODE   && { referralZipcode: record.POSTAL_CODE }),
          ...(record.CIN           && { referralPolicyId: record.CIN }),

          //
          // referrer attributes:
          //
          //  REFERRED_BY -> referred_by
          //  REFERRING_EMAIL -> referrer_email
          //  REFERRING_PHONE -> referrer_phone 
          //  REFERRING_ORG -> referrer_organization
          //  REFERRING_PROV_NPI -> referrer_provider_npi,
          //
          ...(record.REFERRED_BY && { referredBy: record.REFERRED_BY as string }),
          ...(record.REFERRING_EMAIL && { referrerEmail: record.REFERRING_EMAIL as string }),
          ...(record.REFERRING_PHONE && { referrerPhone: toPhone(record.REFERRING_PHONE) }),
          ...(record.REFERRING_ORG   && { referrerOrganization: record.REFERRING_ORG }),
          ...(record.REFERRING_PROV_NPI && { referrerProviderNpi: Number(record.REFERRING_PROV_NPI) }),
          sourceData: record,
          accountId: AccountIds.CalOptima,
        }

        return ok(transformed)
      }
    }
    catch (e) {
      logger.exception(context, TAG, e)

      return err(ErrCode.EXCEPTION)
    }
  }

  return recordTransformer
}

enum LoadRecordStatus {
  'LOADED' = 'loaded',
  'SKIPPED' = 'skipped'
}

enum LoadSkippedReason {
  CALOPTIMA_SERVICE_NOT_FOUND,
  CALOPTIMA_IN_ELIGIBLE,
  MISSING_REQUIRED_ELIGIBILITY_INFO,
  DRY_RUN
}

type LoadRecordResult = {
  loadStatus: LoadRecordStatus,
  skippedReason?: LoadSkippedReason,
  normalizedRecord: NormalizedReferralInboundRecord,
  loadedRecord?: ReferralInboundRecord,
}

type CaloptimaService = {
  firstName: string,
  lastName: string,
  dob: Date,
  service: string,
  serviceDate: Date,
  patientId: string,
  serviceId: string,
}

function compareServiceDate(d1: Date, d2: Date): boolean {
  const dt1 = DateTime.fromJSDate(d1).set({seconds: 0})
  const dt2 = DateTime.fromJSDate(d2).set({seconds: 0})

  return dt1.equals(dt2)
}

const _PAYER_ID = 20

interface LoadRecordOptions {
  dryRun?: boolean
}

async function loadRecord(context: IContext, record: NormalizedReferralInboundRecord, services: CaloptimaService[], options?: LoadRecordOptions): Promise<Result<LoadRecordResult, ErrCode>> {
  const { logger, store: { writer } } = context
  const TAG = [ ...MTAG, 'loadRecord' ]

  try {
    const isDryRun = options?.dryRun ?? false
    
    logger.debug(context, TAG, 'Loading record.', record)

    const service = services.find(service => {
      return (
        service.firstName.toLowerCase() === record.referralFirstName.toLowerCase() && 
        service.lastName.toLowerCase() === record.referralLastName.toLowerCase() && 
        DateTime.fromJSDate(service.dob).equals(DateTime.fromJSDate(record.referralDob)) && 
        compareServiceDate(service.serviceDate, record.referralDate)
        )
    })

    if (service === undefined) {
      logger.info(context, TAG, `No matching service found for referral.`, record)

      return ok({
        loadStatus: LoadRecordStatus.SKIPPED,
        skippedReason: LoadSkippedReason.CALOPTIMA_SERVICE_NOT_FOUND,
        normalizedRecord: record,
      })
    }

    if (record.isEligible === false) {
      //
      // Received ineligible record. Will have to decline.
      //
      logger.info(context, TAG, 'Declining ineligible referral record.', {
        record,
        service,
      })

      const declineResult = await updateReferralStatus(context, service.patientId, service.serviceId, CalOptimaReferralStatus.DECLINED, { dryRun: isDryRun, })

      if (declineResult.isErr()) {
        logger.error(context, TAG, 'Error declining service for ineligible record.', {
          record,
          service,
        })

        return err(declineResult.error)
      }

      return ok({
        loadStatus: LoadRecordStatus.SKIPPED,
        skippedReason: LoadSkippedReason.CALOPTIMA_IN_ELIGIBLE,
        normalizedRecord: record,
      })
    }

    const validationResult = validateNormalizedReferralRecord(context, record)

    if (validationResult.isErr()) {
      logger.error(context, TAG, 'Error validating record.', {
        record,
        error: validationResult.error,
      })

      return err(validationResult.error)
    }

    const validation = validationResult.value

    if (!validation.isValid && validation.validationErrors && validation.validationErrors.find(e => e.reason === ValidationErrorReason.MISSING_REQUIRED_ELIGIBILITY_INFO)) {
      //
      // Cannot lookup or create eligibility, ie NO CIN.
      //
      logger.info(context, TAG, `Required eligibility attributes are missing.`, record)

      return ok({
        loadStatus: LoadRecordStatus.SKIPPED,
        skippedReason: LoadSkippedReason.MISSING_REQUIRED_ELIGIBILITY_INFO,
        normalizedRecord: record,
      })
    }

    if (!validation.isValid) {
      //
      // Record is invalid. Log it, set status to invalid and decline. Record will be persisted.
      //
      logger.info(context, TAG, 'Record is invalid and will be declined.', {
        record,
        validation,
      })
      record.referralStatus = ReferralStatus.INVALID

      const declineResult = await updateReferralStatus(context, service.patientId, service.serviceId, CalOptimaReferralStatus.DECLINED, { dryRun: isDryRun })

      if (declineResult.isErr()) {
        logger.error(context, TAG, 'Error declining service for ineligible record.', {
          record,
          service,
        })

        return err(declineResult.error)
      }
    }

    const pgpool = await writer()
    const referralPolicyId = record.referralPolicyId ?? ''

    let eligibilityId: number | null = null
    let identityId: number | null = null

    const selectMemberResult = await selectEligibilityMemberByPolicyId(context, referralPolicyId, AccountIds.CalOptima)

    if (selectMemberResult.isErr() && selectMemberResult.error !== ErrCode.NOT_FOUND) {
      logger.error(context, TAG, 'Error looking up eligibility.', record)

      return err(selectMemberResult.error)
    }
    else if (selectMemberResult.isErr()) {
      const referralToEligibilityResult = referralToEligibilityRecord(context, record)

      if (referralToEligibilityResult.isErr()) {
        logger.error(context, TAG, 'Error converting referral to eligibility.', record)

        return err(referralToEligibilityResult.error)
      }

      if (isDryRun) {
        logger.debug(context, TAG, 'Skipping eligibility creation for record, dry run...', {
          record,
          service,
        })

        return ok({
          loadStatus: LoadRecordStatus.SKIPPED,
          skippedReason: LoadSkippedReason.DRY_RUN,
          normalizedRecord: record,
        })
      }

      const createResult = await createEligibilityMember(context, referralToEligibilityResult.value)

      if (createResult.isErr()) {
        logger.error(context, TAG, 'Error creating eligibility', record)

        return err(createResult.error)
      }

      const eligibility = createResult.value

      eligibilityId = eligibility.eligibilityId

      const identityResult = await pgpool.query(`
INSERT INTO telenutrition.iam_identity (eligible_id, account_id, first_name, last_name, birthday, zip_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING identity_id;
`,
        [
          eligibilityId, 
          AccountIds.CalOptima, 
          record.referralFirstName, 
          record.referralLastName,
          DateTime.fromJSDate(record.referralDob).toISODate(), 
          record.referralZipcode
        ]
      )

      if (identityResult.rows.length !== 1) {
        logger.error(context, TAG, 'Error inserting identity.', record)

        return err(ErrCode.SERVICE)
      }
      identityId = identityResult.rows[0].identity_id

      logger.info(context, TAG, `created identity: identity_id: ${identityId}`)
    }
    else {
      const member = selectMemberResult.value

      eligibilityId = member.eligibilityId

      const identityResult = await pgpool.query(`SELECT identity_id FROM telenutrition.iam_identity WHERE eligible_id=$1;`, [eligibilityId])

      if (identityResult.rows.length !== 1) {
        logger.error(context, TAG, 'Error getting identity.', {
          record,
          member,
        })

        return err(ErrCode.SERVICE)
      }
      identityId = identityResult.rows[0].identity_id
    }

    if (isDryRun) {
      logger.debug(context, TAG, 'Skipping inbound referral record creation, dry run...', {
        record,
        service,
      })

      return ok({
        loadStatus: LoadRecordStatus.SKIPPED,
        skippedReason: LoadSkippedReason.DRY_RUN,
        normalizedRecord: record,
      })
    }

    //
    // There should now be an eligibility / identity.
    // Insert a inbound referral record.
    //
    const insertResult = await createInboundReferral(context, {
      ...record,
      referralSource: ReferralSources.CalOptima,
      identityId: identityId ?? 0,
      payerId: _PAYER_ID,
      referralExternalId: service.serviceId,
      referralExternalPatientId: service.patientId,
    })

    if (insertResult.isErr()) {
      logger.error(context, TAG, 'Error inserting referral.', record)

      return err(insertResult.error)
    }

    return ok({
      loadStatus: LoadRecordStatus.LOADED,
      normalizedRecord: record,
      loadedRecord: insertResult.value,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Create a closure to make flow task input available.
 * 
 * @param input 
 * @returns 
 */
function recordLoaderFactory(input: object): RecordLoader {
  async function recordLoader(context: IContext, record: NormalizedReferralInboundRecord): Promise<Result<ReferralInboundRecord, ErrCode>> {
    const { logger } = context
    const TAG = [ ...MTAG, 'recordLoader' ]

    try {
      const services = input['services'].map(s => ({
        ...s,
        dob: new Date(s.dob),
        serviceDate: new Date(s.serviceDate)
       }))

      const result = await loadRecord(context, record, services, {
        dryRun: false,
      })

      if (result.isErr()) {
        logger.error(context, TAG, 'Load error.', {
          record,
          error: result.error,
        })

        return err(result.error)
      }

      const loadResult = result.value

      if (loadResult.loadStatus === LoadRecordStatus.LOADED && loadResult.loadedRecord) {
        return ok(loadResult.loadedRecord)
      }
      else {
        return err(ErrCode.INVALID_DATA)
      }
    }
    catch (e) {
      return err(ErrCode.EXCEPTION)
    }
  }

  return recordLoader
}

/**
 * Import data from the "external data" S3 Bucket identify by the s3 Key 'srcKey'.
 * Note, 'import' is a reserved word. Name locally as doImport.
 * 
 * @param context 
 * @param srcKey 
 */
async function doImport(context: IContext, srcBucket: string, srcKey: string, input: object): Promise<Result<ReferralImportResult, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'import' ]

  try {
    const result = await importInboundReferrals(context, srcBucket, srcKey, recordTransfomerFactory(), recordLoaderFactory(input))

    if (result.isErr()) {
      logger.error(context, TAG, 'Error performing ETL.', {
        srcKey,
        error: result.error,
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

async function writeReauthErrorRecords(context: IContext, records: string[][], header: string[], s3Bucket: string, s3Key:  string): Promise<void> {
  const { aws: { s3Client }} = context
  const data = [ header, ...records ].map(r => r.join('\t')).join('\n')
  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: s3Key,
    Body: data,
  })

  await s3Client.send(command);
}

interface ProcessReferralsForReauthOptions {
  csvDelimiter?: string,
  dryRun?: boolean,
  headed?: boolean,
  errorsOutputS3Bucket?: string,
  errorsOutputS3Prefix?:  string,
}

interface ProcessReferralsForReauthResult {
  s3Bucket: string,
  s3Key: string,
  records:  number,
  parseErrors: number,
  toProcess: number,
  processed:  number,
  skipped: number,
  processErrors: number,
  errorsOutputS3Key?: string,
}

/**
 * Process referrals for "re-auth".
 * 
 * @param context 
 * @param s3Bucket 
 * @param s3Key 
 */
export async function processReferralsForReauth(
  context: IContext,
  s3Bucket: string,
  s3Key: string,
  options?: ProcessReferralsForReauthOptions
): Promise<Result<ProcessReferralsForReauthResult, ErrCode>> {
  const { logger, aws: { s3Client } } = context
  const TAG = [ ...MTAG, 'processReferralsForReauth' ]
  const dryRun = options?.dryRun ?? false
  const headed = options?.headed ?? false
  const csvDelimiter = options?.csvDelimiter ?? '\t'

  try {
    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
    })

    const item = await s3Client.send(command);
      
    if (item.Body === undefined || !(item.Body instanceof Readable)) {
      logger.error(context, TAG, `no response from s3`)
  
      return err(ErrCode.SERVICE)
    }

    const stream = item.Body

    const parser = parse({
      columns: false, // Get arrays of records.
      relaxColumnCount: true,
      info: true,
      delimiter: csvDelimiter,
      trim: true,
      relax_quotes: true,
    })

    let records= 0
    let parseErrors = 0

    interface TransformedRecord {
      record: string[],
      patient: ReauthPatientData,
    }

    let header: string[] = []
    const transformedRecords: TransformedRecord[] = []

    const transformStream = transform(function(data) {
      const { info } = data
      const TRANSFORM_TAG = [ ...TAG, 'transform' ]

      records++

      if (!info.error) {
        logger.debug(context, TRANSFORM_TAG, 'info', { info, })
        const record = data.record

        if  (info.records === 1) {
          header = record
        }
        else {
          logger.debug(context, TRANSFORM_TAG, 'transforming record.', { record, })
          const patientDataResult = recordToPatientReauthData(context, record)

         if (patientDataResult.isErr()) {
            parseErrors++
            logger.error(context, TRANSFORM_TAG, 'Error transforming patient record.', {
              record,
            })
          }
          else {
            transformedRecords.push({
              record,
              patient: patientDataResult.value
            })
          }
        }
      }
      else {
        parseErrors++
        logger.error(context, TRANSFORM_TAG, 'Error parsing record.', info)
      }

      return null
    })

    await stream.pipe(parser).pipe(transformStream)

    const createCaloptimaConnectContextResult = await createCaloptimaConnectContext(context, headed);

    if (createCaloptimaConnectContextResult.isErr()) {
      logger.error(context, TAG, 'Error creating CalOptima Connect context.', {
         error: createCaloptimaConnectContextResult.error
      });

      return err(createCaloptimaConnectContextResult.error);
    }

    console.log(`\t\tCalOptima Connect context created\n\n\tAttempting to process ${transformedRecords.length} reauthorization referrals...\n`);

    const calOptimaConnectContext = createCaloptimaConnectContextResult.value;

    const toProcess = transformedRecords.length
    let processed = 0
    let skipped = 0
    let processErrors = 0

    const errorRecords: string[][] = []
  
    for (const { record, patient } of transformedRecords ) {
      if (patient.Medical_conditions_other_list.length > 0) {
        patient.Medical_conditions_list.push('Other');
      }

      const service: CalOptimaService = {
        cin: patient.Cin,
        taskDate: patient.Service_date,
        appointmentDate: patient.Service_date,
        serviceRequestDescription: patient.Description,
        taskDescription: patient.Message,
        note: patient.Dietitian_recommendation,
        agencyRelationship: 'Foodsmart',
        referredBy: 'Foodsmart',
        benefitExhausted: true, // per Chitra/Hollie this needs to be true for all reauths
        dischargePlan: patient.Referral_discharge_plan_with_mtm,
        medicalConditions: patient.Medical_conditions_list as MedicalCondition[],
        otherMedicalConditionDescription: patient.Medical_conditions_other_list.length > 0 ? patient.Medical_conditions_other_list.join(', ') : undefined,
        utilizationCriteria: ([(patient.Referral_member_recently_discharged || patient.Recent_inpatient_yn) && 'Recently Discharged', patient.Cafd_risk && 'High Risk of Hospitalization', patient.Cafd_coord && 'Extensive Care Coordination Needs'].filter(Boolean)) as UtilizationCriteria[],
        careCoordinationNeedDescription: patient.Cafd_coord_desc ? patient.Cafd_coord_desc : undefined,
        specialDiet: patient.Diet_types_list[0] ? true : false,
        specialDietDescription: patient.Diet_types_list[0] || undefined,
        otherDeliveryServices: false,
        hasFridge: true,
        hasReheat: true,
      };

      const referral: CalOptimaReferral = {
        patientId: '',
        serviceId: '',
        riskScore: patient.Risk_score,
        diagnosisIcd10: patient.Diagnosis_icd_10,
        foodBenefit: patient.Food_benefit,
        frequency: patient.Frequency,
        duration: patient.Duration,
        allergies: patient.Food_allergies_list,
        mechanicalAlteredDiet: patient.Mechanical_altered_diet,
        foodVendorOption: patient.VendorID,
        foodVendorName: patient.VendorName,
        dietitianRecommendation: patient.Dietitian_recommendation,
        specialRequest: patient.Diet_types_list[0] || undefined,
        serviceDate: patient.Service_date,
        description: patient.Description,
        message: patient.Message,
      };

      const originalReferralId = +patient.Original_referral_id;

      if (!originalReferralId) {
        skipped++
        logger.error(context, TAG, `\t\tReauth - error: Original referral ID not a valid number`, {
          records,
          parseErrors,
          processed,
          skipped,
          processErrors,
        });
        continue;
      }

      const reauthData: ReauthData = {
        service,
        referral,
        originalReferralId,
      };

      const options: PerformReferralActionsOptions = {
        sourceContext: calOptimaConnectContext,
        dryRun,
      }

      const performReferralReauthActionsResult = await performReferralReauthActions(context, reauthData, options);

      if (performReferralReauthActionsResult.isErr()) {
        processErrors++
        errorRecords.push(record)
        logger.error(context, TAG, 'Error performing reauth.', {
          record,
          error: performReferralReauthActionsResult.error,
        });
      } else {
        processed++
        logger.info(context, TAG, `Reauth success`, {
          records,
          parseErrors,
          processed,
          skipped,
          processErrors,
        });
      }
    }

    logger.info(context, TAG, `Processed ${processed} reauthorization referrals, destroying CalOptima Connect context...`,  {
      records,
      parseErrors,
      processed,
      skipped,
      processErrors,
    })

    const destroyResult = await destroyCaloptimaConnectContext(context, calOptimaConnectContext);

    if (destroyResult.isErr()) {
      logger.error(context, TAG, 'Error destroying CalOptima context.', {
        error: destroyResult.error,
      });
    } else {
      logger.info(context, TAG, `\t\tCalOptima Connect context destroyed`);
    }

    if (processErrors > 0 && errorRecords.length) {
      const { errorsOutputS3Bucket, errorsOutputS3Prefix } = options ?? {}

      if (errorsOutputS3Bucket && errorsOutputS3Prefix) {
        const filename = s3Key.split('/').pop()
        const errorOutputFilename = (filename as string).replace('.tsv', `_error_rows_${new Date().toISOString() .replace(/-/g, '').replace(/:/g, '').replace(/\..+/, '')}.tsv`);
        const errorsOutputS3Key = `${errorsOutputS3Prefix.replace(/\/$/, '')}/${errorOutputFilename}`

        logger.info(context, TAG, `Reauth error (writing tsv errors to error file)`, {
          records,
          parseErrors,
          processed,
          skipped,
          processErrors, 
          errorsOutputS3Bucket,
          errorsOutputS3Key,
        })

        await writeReauthErrorRecords(context, errorRecords, header, errorsOutputS3Bucket, errorsOutputS3Key)
      }
    }

    logger.debug(context, TAG, 'Completed processing re-auths.')

    return ok({
      s3Bucket,
      s3Key,
      records,
      parseErrors,
      toProcess,
      processed,
      skipped,
      processErrors,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export { doImport as importInboundReferrals };

export default {
  importInboundReferrals: doImport,
  processReferralsForReauth,
}