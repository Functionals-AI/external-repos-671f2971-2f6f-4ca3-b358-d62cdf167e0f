import { IContext } from '@mono/common/lib/context';
import MedallionApi from '../medallion/api';
import { Provider } from '../medallion/api/providers'
import { Result, err, ok } from 'neverthrow';
import { ErrCode } from '@mono/common/lib/error';
import '@mono/common/lib/zapatos/schema';
import * as zs from 'zapatos/schema';
import * as db from 'zapatos/db';
import { chunk } from 'lodash'
import { License } from './api/licenses';


const MTAG = `telenutrition.medallion.sync`


interface SyncProvidersFromMedallionReport {
  medallionProvidersCount: number,
  updatedProvidersCount: number
}

/**
 * Fetches providers from the Medallion API and updates them in store.
 * @param context 
 * @returns A report object
 */
export async function syncProvidersFromMedallion(context: IContext): Promise<Result<SyncProvidersFromMedallionReport, ErrCode>> {
  const TAG = `${MTAG}.syncProvidersFromMedallion`
  const { logger, store: { writer } } = context

  try {
    const pool = await writer();

    const fetchResult = await MedallionApi.Providers.getProviders(context);
    if (fetchResult.isErr()) {
      return err(fetchResult.error)
    }
    const medallionProviders = fetchResult.value
    logger.info(context, TAG, `Fetched ${medallionProviders.length} providers from the Medallion Api`)

    if (medallionProviders.length === 0) {
      logger.info(context, TAG, `Received 0 providers from medallion. Aborting sync.`)
      return err(ErrCode.SERVICE)
    }

    /**
     * Save all providers returned from MedallionApi into medallion_provider table
     */
    const medallionProviderTableUpdateResult = await updateMedallionProviderTable(medallionProviders, context, pool);
    logger.info(context, TAG, "medallionProviderTableUpdateResult", medallionProviderTableUpdateResult)

    /**
     * Proceed with our previous workflow of updating schedule_provider table
    */
    const scheduleProviderTableUpdateResult = await updateScheduleProviderTable(medallionProviders, context, pool);
    logger.info(context, TAG, "scheduleProviderTableUpdateResult", scheduleProviderTableUpdateResult)

    return ok(medallionProviderTableUpdateResult);
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

async function updateMedallionProviderTable(medallionProviders: Provider[], context: IContext, pool) {
  const TAG = `${MTAG}.updateMedallionProviderTable`;
  const { logger } = context;
  
  const storeProviders = await db.select('telenutrition.schedule_provider', { npi: db.conditions.isNotNull }).run(pool);
  const storeEmployees = await db.sql<zs.common.employee.SQL, zs.common.employee.Selectable[]>`
                          SELECT * FROM common.employee 
                          WHERE JSONB_EXISTS(custom_fields, 'Provider NPI');
                          `.run(pool);

  const providerIdMap = new Map(
    storeProviders.filter(p => p.npi != null)
                  .map(p => [p.npi, p.provider_id])
  );

  const employeeIdMap = new Map<number, number>();
  for(let employee of storeEmployees) {
    const npi = employee.custom_fields ? Number(employee.custom_fields["Provider NPI"]) : null;
    if(npi) {
      employeeIdMap.set(npi, employee.employee_id);
    }
  }

  const medallionProvidersWithoutNpi = medallionProviders.filter(p => p.npi == null);
  logger.info(context, TAG, `There are ${medallionProvidersWithoutNpi.length} Medallion Providers without a NPI.`);

  const upsertableMedallionProviders = medallionProviders
                                          .map(p => {
                                            let insertable = buildInsertableMedallionProvider(context, p); 
                                            insertable.employee_id = employeeIdMap.get(p.npi ?? -1) ?? null;
                                            insertable.provider_id = providerIdMap.get(p.npi ?? -1) ?? null;
                                            return insertable;
                                          });
  logger.info(context, TAG, `Proceed to upsert ${upsertableMedallionProviders.length} Medallion Providers.`)

  let updatedProviderIds: number[] = [];
  
  for (const chunkToUpsert of chunk(upsertableMedallionProviders, 500)) {
    const medallionProvidersUpsertResult = await db.upsert(
      'telenutrition.medallion_provider', 
      chunkToUpsert, 
      [ 'medallion_id' ],
      { 
        returning: [ 'provider_id' ],
        updateColumns: ['provider_id', 'employee_id', 'first_name', 'last_name', 'npi', 'percent_complete', 
          'profile_completion_state', 'percent_complete_last_checked', 'verification_status', 'verification_status_last_checked', 
          'credentialing_committee_status', 'initial_credentialing_date', 'latest_credentialing_date', 'credentialing_step', 'caqh_number'],
      }
    ).run(pool);

    updatedProviderIds = medallionProvidersUpsertResult.reduce<number[]>((providerIds, upsertResult) => {
      let id = upsertResult.provider_id ?? 0;
      if(id) {
        providerIds.push(id);
      }    
      return providerIds;
    }, updatedProviderIds);
  }

  return {
    medallionProvidersCount: medallionProviders.length,
    updatedProvidersCount: updatedProviderIds.length,
  };
}

async function updateScheduleProviderTable(medallionProviders: Provider[], context: IContext, pool) {
  const TAG = `${MTAG}.updateScheduleProviderTable`;
  const { logger } = context;

  let updatedProviderIds: number[] = [];
  for (const medallionProvider of medallionProviders) {
    if (!medallionProvider.npi) {
      continue;
    }

    const updatable = buildUpdatableScheduleProvider(context, medallionProvider);
    const updatedStoreProviders = await db.update(
      'telenutrition.schedule_provider',
      updatable,
      { npi: medallionProvider.npi }
    ).run(pool);

    updatedProviderIds = updatedProviderIds.concat(updatedStoreProviders.map(p => p.provider_id));
  }

  // Clear synced fields if the provider is not in medallion.
  const clearedStoreProviders = await db.update(
    'telenutrition.schedule_provider',
    {
      medallion_id: null,
      medallion_percent_complete: null,
      medallion_profile_completion_state: null,
      medallion_percent_complete_last_checked: null,
      verification_status: null,
      verification_status_last_checked: null,
      credentialing_committee_status: null,
      initial_credentialing_date: null,
      latest_credentialing_date: null,
      credentialing_step: null,
      caqh_number: null,
    },
    { provider_id: db.conditions.isNotIn(updatedProviderIds) }
  ).run(pool);

  return {
    medallionProvidersCount: medallionProviders.length,
    updatedProvidersCount: updatedProviderIds.length,
    clearedProvidersCount: clearedStoreProviders.length,
  };
}

function buildUpdatableScheduleProvider(context: IContext, medallionProvider: Provider): zs.telenutrition.schedule_provider.Updatable {
  const verifiedProvider = verifyMedallionProviderFields(context, medallionProvider);
  return {
    medallion_id: verifiedProvider.medallion_id,
    medallion_percent_complete: verifiedProvider.percent_complete,
    medallion_profile_completion_state: verifiedProvider.profile_completion_state,
    medallion_percent_complete_last_checked: verifiedProvider.percent_complete_last_checked as any,
    verification_status: verifiedProvider.verification_status,
    verification_status_last_checked: verifiedProvider.verification_status_last_checked as any,
    credentialing_committee_status: verifiedProvider.credentialing_committee_status,
    initial_credentialing_date: verifiedProvider.initial_credentialing_date as any,
    latest_credentialing_date: verifiedProvider.latest_credentialing_date as any,
    credentialing_step: verifiedProvider.credentialing_step,
    caqh_number: verifiedProvider.caqh_number ? verifiedProvider.caqh_number : null
  };
}

function buildInsertableMedallionProvider(context: IContext, medallionProvider: Provider): zs.telenutrition.medallion_provider.Insertable {
  const verifiedMedallionProvider = verifyMedallionProviderFields(context, medallionProvider);
  return verifiedMedallionProvider;
}

function verifyMedallionProviderFields(context: IContext, medallionProvider: Provider) {
  const TAG = `${MTAG}.mapMedallionProviderToUpdatable`
  const { logger } = context
  
  let profile_completion_state: string | null = null;
  switch (medallionProvider.profile_completion_state) {
    case 'complete':
    case 'incomplete':
    case 'new_fields':
    case 'new_request':
    case 'new_service':
    case 'new_request_and_service':
      profile_completion_state = medallionProvider.profile_completion_state;
      break;
    case null:
      profile_completion_state = null;
      break;
    default:
      logger.warn(context, TAG, 'unmapped profile_completion_state', { medallionProvider })
      profile_completion_state = null
  }

  let verification_status: string | null = null;
  switch (medallionProvider.verification_status) {
    case 'needs_attention': 
    case 'in_progress':
    case 'verified':
    case 'manually_verified':
    case 'not_requested':
      verification_status = medallionProvider.verification_status;
      break;
    case null:
      verification_status = null;
      break;
    default:
      logger.warn(context, TAG, 'unmapped verification_status', { medallionProvider })
      verification_status = null
  }


  let credentialing_committee_status: string | null = null;
  switch (medallionProvider.credentialing_committee_status) {
    case 'approved':
    case 'pending':
    case 'rejected':
    case 'closed_without_decision':
      credentialing_committee_status = medallionProvider.credentialing_committee_status;
      break;
    case null:
      credentialing_committee_status = null;
      break;
    default:
      logger.warn(context, TAG, 'unmapped credentialing_committee_status', { medallionProvider })
      credentialing_committee_status = null
  }

  let credentialing_step: string | null = null;
  switch (medallionProvider.credentialing_step) {
    case 'not_requested':
    case 'in_progress': 
    case 'ready':
    case 'in_committee':
    case 'file_approved':
    case 'file_rejected': 
    case 'file_expired':
    case 'scheduled':
      credentialing_step = medallionProvider.credentialing_step;
      break;
    case null:
      credentialing_step = null;
      break;
    default:
      logger.warn(context, TAG, 'unmapped credentialing_step', { medallionProvider })
      credentialing_step = null
  }

  return {
    medallion_id: medallionProvider.id,
    npi: medallionProvider.npi,
    first_name: medallionProvider.first_name,
    last_name: medallionProvider.last_name,
    percent_complete: medallionProvider.percent_complete,
    profile_completion_state: profile_completion_state,
    percent_complete_last_checked: medallionProvider.percent_complete_last_checked as any,
    verification_status: medallionProvider.verification_status,
    verification_status_last_checked: medallionProvider.verification_status_last_checked as any,
    credentialing_committee_status,
    initial_credentialing_date: medallionProvider.initial_credentialing_date as any,
    latest_credentialing_date: medallionProvider.latest_credentialing_date as any,
    credentialing_step,
    caqh_number: medallionProvider.caqh_number ? medallionProvider.caqh_number : null
  }
}


enum LicenseSource {
  Admin = 'admin',
  Medallion = 'medallion',
}

interface SyncLicensesFromMedallionReport {
  medallionLicensesCount: number,
  storeLicensesCount: number,
  licensesToUpsert: number,
  upsertedLicensesCount: number,
  deletedLicensesCount: number,
  failedToUpsertLicensesCount: number,
}

/**
 * Uses the medallion api to fetch the licenses and upsert them in the store.
 * @param context 
 * @returns A report object
 */
export async function syncLicensesFromMedallion(context: IContext): Promise<Result<SyncLicensesFromMedallionReport, ErrCode>> {
  const TAG = `${MTAG}.syncLicensesFromMedallion`
  const { logger, store: { writer } } = context

  try {
    const pool = await writer();

    const fetchResult = await MedallionApi.Licenses.getLicenses(context);
    if (fetchResult.isErr()) {
      return err(fetchResult.error)
    }
    const medallionLicenses = fetchResult.value
    logger.info(context, TAG, `Fetched ${medallionLicenses.length} licenses from the Medallion Api`)

    if (medallionLicenses.length === 0) {
      logger.info(context, TAG, `Received 0 licenses from medallion. Aborting sync.`)
      return err(ErrCode.SERVICE)
    }

    const storeStates = await db.select('common.state', db.all).run(pool);
    const storeProviders = await db.select('telenutrition.medallion_provider', { medallion_id: db.conditions.isNotNull }).run(pool);
    const storeLicenses = await db.select('telenutrition.provider_license', { source: LicenseSource.Medallion }).run(pool);

    const supportedStates = new Set(storeStates.map(s => s.state));
    const storeProvidersByMedallionIdMap = new Map(storeProviders.map(p => [p.medallion_id, p]));

    const licensesToUpsert: zs.telenutrition.provider_license.Insertable[] = medallionLicenses
      .filter(l => {
        if (supportedStates.has(l.state)) {
          return true
        }

        logger.info(context, TAG, 'filtered out license from medallion sync', { 
          id: l.id,
          state: l.state,
        })
        return false;
      })
      .map(l => mapMedallionLicenseToInsertable(context, l, storeProvidersByMedallionIdMap));
    let upsertedLicenseIds: number[] = []
    for (const chunkToUpsert of chunk(licensesToUpsert, 500)) {
      const upsertResult = await db.upsert(
        'telenutrition.provider_license', 
        chunkToUpsert, 
        ['medallion_id'],
        { 
          updateColumns: ['provider_id', 'status', 'state', 'issue_date', 'expiration_date', 'certificate_type', 'license_number', 'verification_status', 'updated_by', 'updated_at', 'cached_verified_at', 'cached_verified_expiration_date'], 
          noNullUpdateColumns: ['cached_verified_at', 'cached_verified_expiration_date'] 
        }
      ).run(pool);
      upsertedLicenseIds = upsertedLicenseIds.concat(upsertResult.map(l => l.license_id))
      logger.info(context, TAG, `Upserted chunk of ${upsertResult.length} provider licenses into the store.`)
    }

    const deleteResult = await db.deletes('telenutrition.provider_license', {
      source: LicenseSource.Medallion,
      license_id: db.conditions.isNotIn(upsertedLicenseIds)
    }).run(pool);
    logger.info(context, TAG, `Deleted ${deleteResult.length} provider licenses from the store.`)

    return ok({
      medallionLicensesCount: medallionLicenses.length,
      storeLicensesCount: storeLicenses.length,
      licensesToUpsert: licensesToUpsert.length,
      upsertedLicensesCount: upsertedLicenseIds.length,
      deletedLicensesCount: deleteResult.length,
      failedToUpsertLicensesCount: licensesToUpsert.length - upsertedLicenseIds.length,
    });
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

function mapMedallionLicenseToInsertable(context, medallionLicense: License, storeProvidersByMedallionIdMap: Map<string | null, zs.telenutrition.medallion_provider.JSONSelectable>): zs.telenutrition.provider_license.Insertable {
  const TAG = `${MTAG}.mapMedallionLicenseToInsertable`
  const { logger } = context
  
  let status: string | null = null;
  switch (medallionLicense.status) {
    case 'pending':
    case 'active':
    case 'inactive':
      status = medallionLicense.status;
      break;
    default:
      logger.warn(context, TAG, 'Unmapped license status', { medallionId: medallionLicense.id, status: medallionLicense.status })
      status = null
  }

  let verificationStatus: string | null = null;
  switch (medallionLicense.verification_status) {
    case 'pending_manual_verification':
    case 'manually_verified':
    case 'needs_attention':
    case 'pending_automatic_verification':
    case 'automatically_verified':
    case 'not_requested':
      verificationStatus = medallionLicense.verification_status;
      break;
    default:
      logger.warn(context, TAG, 'Unmapped verification status', { medallionId: medallionLicense.id, verificationStatus: medallionLicense.verification_status })
      verificationStatus = null
  }

  const verified = medallionLicense.verification_status === 'automatically_verified' || medallionLicense.verification_status === 'manually_verified';
  const cachedVerifiedAt = verified ? new Date() : null
  const cachedVerifiedExpirationDate = verified ? medallionLicense.expiration_date : null

  const currentDate = new Date()
  return {
    source: LicenseSource.Medallion,
    medallion_id: medallionLicense.id,
    provider_id: storeProvidersByMedallionIdMap.get(medallionLicense.provider)?.provider_id ?? null,
    status,
    state: medallionLicense.state,
    issue_date: medallionLicense.issue_date as `${number}-${number}-${number}` | null,
    expiration_date: medallionLicense.expiration_date as `${number}-${number}-${number}` | null,
    certificate_type: medallionLicense.certificate_type,
    license_number: medallionLicense.license_number ? medallionLicense.license_number : null,
    verification_status: verificationStatus,
    created_by: 'bot@foodsmart.com',
    created_at: currentDate,
    updated_by: 'bot@foodsmart.com',
    updated_at: currentDate,
    cached_verified_at: cachedVerifiedAt,
    cached_verified_expiration_date: cachedVerifiedExpirationDate as `${number}-${number}-${number}` | null
  }
}


enum BoardCertificateSource {
  Admin = 'admin',
  Medallion = 'medallion',
}

interface SyncBoardCertificatesFromMedallionReport {
  medallionBoardCertificatesCount: number,
  certificatesToUpsertCount: number,
  upsertedCertificateIdsCount: number,
  deletedCertificatesCount: number,
  failedToUpsertCertificatesCount: number,
}

export async function syncBoardCertificatesFromMedallion(context: IContext): Promise<Result<SyncBoardCertificatesFromMedallionReport, ErrCode>> {
  const TAG = `${MTAG}.syncBoardCertificatesFromMedallion`
  const { logger, store: { writer } } = context

  try {
    const pool = await writer();

    const fetchResult = await MedallionApi.BoardCertificates.getBoardCertificates(context);
    if (fetchResult.isErr()) {
      return err(fetchResult.error)
    }
    const medallionBoardCertificates = fetchResult.value
    logger.info(context, TAG, `Fetched ${medallionBoardCertificates.length} board certificates from the Medallion Api`)

    if (medallionBoardCertificates.length === 0) {
      logger.info(context, TAG, `Received 0 board certificates from medallion. Aborting sync.`)
      return err(ErrCode.SERVICE)
    }

    const storeProviders = await db.select('telenutrition.medallion_provider', { medallion_id: db.conditions.isNotNull }).run(pool);
    const storeProvidersByMedallionIdMap = new Map(storeProviders.map(p => [p.medallion_id, p]));

    const currentDate = new Date();
    const certificatesToUpsert: zs.telenutrition.provider_board_certificate.Insertable[] = medallionBoardCertificates
      .map(mbc => ({
        medallion_id: mbc.id,
        provider_id: storeProvidersByMedallionIdMap.get(mbc.provider)?.provider_id ?? null,
        source: BoardCertificateSource.Medallion,
        abms: mbc.abms ? mbc.abms : null,
        board_name: mbc.board_name,
        is_board_certification: mbc.is_board_certification,
        specialty: mbc.specialty,
        certification_number: mbc.certification_number ? mbc.certification_number : null,
        is_exam_passed: mbc.is_exam_passed,
        issue_date: mbc.issue_date as any,
        is_indefinite: mbc.is_indefinite,
        expiration_date: mbc.expiration_date as any,
        recertification_date: mbc.recertification_date as any,
        exam_date: mbc.exam_date as any,
        moc_status: mbc.moc_status,
        is_meeting_moc: mbc.is_meeting_moc,
        moc_verification_date: mbc.moc_verification_date as any,
        moc_annual_reverification_date: mbc.moc_annual_reverification_date as any,
        requires_verification: mbc.requires_verification,
        updated_at: currentDate,
        created_at: currentDate,
      }));

    let upsertedCertificateIds: number[] = []
    for (const chunkToUpsert of chunk(certificatesToUpsert, 500)) {
      const upsertResult = await db.upsert(
        'telenutrition.provider_board_certificate', 
        chunkToUpsert, 
        ['medallion_id'],
        { updateColumns: ['provider_id', 'source', 'abms', 'board_name', 'is_board_certification', 'specialty', 'certification_number', 'is_exam_passed', 'issue_date', 'is_indefinite', 'expiration_date', 'recertification_date', 'exam_date', 'moc_status', 'is_meeting_moc', 'moc_verification_date', 'moc_annual_reverification_date', 'requires_verification', 'updated_at'] }
      ).run(pool);
      upsertedCertificateIds = upsertedCertificateIds.concat(upsertResult.map(c => c.certificate_id))
      logger.info(context, TAG, `Upserted chunk of ${upsertResult.length} board certificates into the store.`)
    }

    const deleteResult = await db.deletes('telenutrition.provider_board_certificate', {
      source: BoardCertificateSource.Medallion,
      certificate_id: db.conditions.isNotIn(upsertedCertificateIds)
    }).run(pool);
    logger.info(context, TAG, `Deleted ${deleteResult.length} board certificates from the store.`)

    return ok({
      medallionBoardCertificatesCount: medallionBoardCertificates.length,
      certificatesToUpsertCount: certificatesToUpsert.length,
      upsertedCertificateIdsCount: upsertedCertificateIds.length,
      deletedCertificatesCount: deleteResult.length,
      failedToUpsertCertificatesCount: certificatesToUpsert.length - upsertedCertificateIds.length,
    });
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  syncProvidersFromMedallion,
  syncLicensesFromMedallion,
  syncBoardCertificatesFromMedallion,
}
