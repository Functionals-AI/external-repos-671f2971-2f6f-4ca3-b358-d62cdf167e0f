import { IContext } from '@mono/common/lib/context';
import { Result, err, ok } from 'neverthrow';
import { ErrCode } from '@mono/common/lib/error';
import '@mono/common/lib/zapatos/schema';
import * as zs from 'zapatos/schema';
import * as db from 'zapatos/db';
import CandidApi from '../api'
import { differenceBy, intersectionBy, uniq, isEqual, min, max, orderBy, groupBy } from 'lodash'
import { UpdateOrganizationProviderApiRequest, UpdateProviderCredentialingSpansApiRequest } from '../api/organization-providers';
import { areIntervalsOverlapping } from 'date-fns';
import { OrganizationProvider, Payer } from '../api/types';
import { FOODSMART_PROVIDER } from '../constants';


const MTAG = `telenutrition.candid.sync.providers-and-licenses`

const MAX_PROVIDERS_TO_SYNC = 100000;
const MAX_LICENSES_PER_PROVIDER_TO_SYNC = 10000;
const CIGNA_PAYER = {
  payerId: '62308',
  payerName: 'CIGNA',
}
const TAXONOMY_CODE = '133V00000X';

interface SyncProvidersToCandidReport {
  candidProvidersCount: number,
  storeProvidersCount: number,
  providersToCreateCount: number,
  providersToUpdateCount: number,
  providersToDeleteCount: number,
  totalProvidersCount: number,
  uniqueProviderNpisCount: number,
  maxProvidersToSync: number,
  maxLicensesPerProviderToSync: number,
  providersAlreadyInSync,
  createdProvidersCount: number,
  updatedProvidersCount: number,
  deletedProvidersCount: number,
  failedToCreateProvidersCount: number,
  failedToUpdateProvidersCount: number,
  failedToDeleteProvidersCount: number,
  overlappingLicensesCount: number,
  licensesToCreateCount: number,
  licensesToUpdateCount: number,
  licensesToDeleteCount: number,
  licensesAlreadyInSync: number,
  createdLicensesCount: number,
  updatedLicensesCount: number,
  deletedLicensesCount: number,
  failedToCreateLicenseCount: number,
  failedToUpdateLicenseCount: number,
  failedToDeleteLicenseCount: number,
}

/**
 * Uses the candid api to create/update/delete providers/licenses so they match the providers/licenses in our store.
 * @param context 
 * @returns A report object
 */
export async function syncProvidersAndLicensesToCandid(context: IContext): Promise<Result<SyncProvidersToCandidReport, ErrCode>> {
  const TAG = `${MTAG}.syncProvidersAndLicensesToCandid`
  const { logger, store: { writer } } = context

  try {
    const pool = await writer();

    // Get the cigna payer from candid to create licenses/credentials with
    const payersResult = await CandidApi.payers.getPayers(context, { search_term: CIGNA_PAYER.payerName, limit: 100 });
    if (payersResult.isErr()) {
      logger.error(context, TAG, `Error fetching payers from candid`)
      return err(ErrCode.SERVICE)
    }
    const candidPayer = payersResult.value.items.find(p => p.payer_id === CIGNA_PAYER.payerId && p.payer_name === CIGNA_PAYER.payerName)
    if (!candidPayer) {
      logger.error(context, TAG, `Error getting the cigna payer`)
      return err(ErrCode.SERVICE)
    }
    logger.info(context, TAG, `Fetched the cigna payer from candid`, candidPayer)

    // Get the current providers
    const candidProvidersResult = await CandidApi.organizationProviders.getAllProviders(context, {
      limit: MAX_PROVIDERS_TO_SYNC
    });
    if (candidProvidersResult.isErr()) {
      logger.error(context, TAG, `Error fetching providers from candid`)
      return err(ErrCode.SERVICE)
    }
    if (candidProvidersResult.value.next_page_token) {
      logger.error(context, TAG, `Paging not implemented`)
      return err(ErrCode.NOT_IMPLEMENTED)
    }
    const candidProviders = candidProvidersResult.value.items
      .filter(p => p.npi !== FOODSMART_PROVIDER.npi)
      .map(p => ({ ...p, npi: parseInt(p.npi) }))
    const storeProviders = await db.select('telenutrition.schedule_provider', { npi: db.conditions.isNotNull }, {
      lateral: {
        licenses: db.select('telenutrition.provider_license', { provider_id: db.parent('provider_id') })
      }
    }).run(pool);

    const candidProvidersByNpiMap = new Map(candidProviders.map(p => [p.npi, p]));

    // Sync the foodsmart organization provider with candid
    let foodsmartCandidProvider = candidProvidersResult.value.items.find(p => p.npi === FOODSMART_PROVIDER.npi);
    if (foodsmartCandidProvider) {
      logger.info(context, TAG, `Updating the foodsmart provider in candid`)

      const { qualifications, ...update } = FOODSMART_PROVIDER
      const createResult = await CandidApi.organizationProviders.updateProvider(context, foodsmartCandidProvider.organization_provider_id, update);
      if (createResult.isErr()) {
        logger.error(context, TAG, `Error updating the foodsmart provider in candid`)
        return err(ErrCode.SERVICE)
      }
      foodsmartCandidProvider = createResult.value;
      logger.info(context, TAG, `Updated the foodsmart provider in candid`)
    } else {
      logger.info(context, TAG, `Creating the foodsmart provider in candid`)

      const createResult = await CandidApi.organizationProviders.createProvider(context, FOODSMART_PROVIDER);
      if (createResult.isErr()) {
        logger.error(context, TAG, `Error creating the foodsmart provider in candid`)
        return err(ErrCode.SERVICE)
      }
      foodsmartCandidProvider = createResult.value;
      logger.info(context, TAG, `Created the foodsmart provider in candid`)
    }

    // Determine which providers need to be synced
    const providersToCreate = differenceBy(storeProviders, candidProviders, 'npi');
    const providersToUpdate = intersectionBy(storeProviders, candidProviders, 'npi')
    const providersToDelete = differenceBy(candidProviders, storeProviders, 'npi');

    const plannedReport = {
      candidProvidersCount: candidProviders.length,
      storeProvidersCount: storeProviders.length,
      providersToCreateCount: providersToCreate.length,
      providersToUpdateCount: providersToUpdate.length,
      providersToDeleteCount: providersToDelete.length,
    }

    // Validate the sync
    const totalProvidersCount = providersToCreate.length + providersToUpdate.length + providersToDelete.length;
    if (totalProvidersCount > MAX_PROVIDERS_TO_SYNC) {
      logger.error(context, TAG, `Abnormally large sync. Aborting sync.`, plannedReport);
      return err(ErrCode.SERVICE);
    }
    const candidProviderNpis = candidProviders.map(p => p.npi);
    const storeProviderNpis = storeProviders.map(p => Number(p.npi))
    const uniqueProviderNpisCount = uniq(candidProviderNpis.concat(storeProviderNpis)).length;
    const validatedReport = {
      ...plannedReport,
      totalProvidersCount,
      uniqueProviderNpisCount,
      maxProvidersToSync: MAX_PROVIDERS_TO_SYNC,
      maxLicensesPerProviderToSync: MAX_LICENSES_PER_PROVIDER_TO_SYNC,
    }
    if (uniqueProviderNpisCount !== totalProvidersCount || providersToUpdate.length > totalProvidersCount) {
      logger.error(context, TAG, `Failed sync validation.`, validatedReport);
      return err(ErrCode.SERVICE);
    }
    logger.info(context, TAG, `Validated the planned sync`, validatedReport);

    // Perform the actual sync
    let overlappingLicensesCount = 0;
    let createdLicensesCount = 0;
    let updatedLicensesCount = 0;
    let deletedLicensesCount = 0;
    let licensesAlreadyInSync = 0;
    let licensesToCreateCount = 0;
    let licensesToUpdateCount = 0;
    let licensesToDeleteCount = 0;

    // Delete providers (Providers in candid, but not in the store)
    // Candid doesn't let us delete providers for now
    let deletedProvidersCount = 0;

    // Update providers (Providers that are both in the store and in candid)
    let updatedProvidersCount = 0;
    let providersAlreadyInSync = 0;
    for (const storeProvider of providersToUpdate) {
      const candidProvider = candidProvidersByNpiMap.get(storeProvider.npi ?? -1);
      if (!candidProvider) {
        logger.error(context, TAG, `Could not get candid provider id during update.`, storeProvider);
        continue;
      }
      const current: UpdateOrganizationProviderApiRequest = {
        npi: String(candidProvider.npi),
        is_rendering: candidProvider.is_rendering,
        is_billing: candidProvider.is_billing,
        first_name: candidProvider.first_name,
        last_name: candidProvider.last_name,
        provider_type: candidProvider.provider_type,
        taxonomy_code: candidProvider.taxonomy_code,
        license_type: candidProvider.license_type,
      }
      const update: UpdateOrganizationProviderApiRequest = {
        npi: String(storeProvider.npi),
        is_rendering: true,
        is_billing: false,
        first_name: storeProvider.first_name,
        last_name: storeProvider.last_name,
        provider_type: 'INDIVIDUAL',
        taxonomy_code: TAXONOMY_CODE,
        license_type: 'RD',
      }
      if (isEqual(current, update)) {
        updatedProvidersCount++;
        providersAlreadyInSync++;
      } else {
        const updateResult = await CandidApi.organizationProviders.updateProvider(context, candidProvider.organization_provider_id, update);
        if (updateResult.isOk()) {
          updatedProvidersCount++;
        } else {
          logger.error(context, TAG, `Error updating a provder using the candid api.`, storeProvider);
        }
      }

      const syncProviderLicensesResult = await syncProviderLicensesToCandid(context, {
        storeProvider,
        candidProvider,
        foodsmartCandidProvider,
        candidPayer,
      });
      if (syncProviderLicensesResult.isOk()) {
        overlappingLicensesCount += syncProviderLicensesResult.value.overlappingLicensesCount;
        createdLicensesCount += syncProviderLicensesResult.value.createdLicensesCount;
        updatedLicensesCount += syncProviderLicensesResult.value.updatedLicensesCount;
        deletedLicensesCount += syncProviderLicensesResult.value.deletedLicensesCount;
        licensesAlreadyInSync += syncProviderLicensesResult.value.licensesAlreadyInSync;
        licensesToCreateCount += syncProviderLicensesResult.value.licensesToCreateCount;
        licensesToUpdateCount += syncProviderLicensesResult.value.licensesToUpdateCount;
        licensesToDeleteCount += syncProviderLicensesResult.value.licensesToDeleteCount;
      } else {
        logger.error(context, TAG, `Error syncing provider licenses.`, { storeProvider, candidProvider });
      }
    }

    // Create providers (Providers in the store, but not in candid)
    let createdProvidersCount = 0;
    for (const storeProvider of providersToCreate) {
      const createResult = await CandidApi.organizationProviders.createProvider(context, {
        npi: String(storeProvider.npi),
        is_rendering: true,
        is_billing: false,
        first_name: storeProvider.first_name,
        last_name: storeProvider.last_name,
        provider_type: "INDIVIDUAL",
        taxonomy_code: TAXONOMY_CODE,
        license_type: "RD",
        qualifications: [],
      });
      if (createResult.isOk()) {
        createdProvidersCount++;

        // Create the provider's licenses
        const excludeOverlappingLicensesResult = excludeOverlappingLicenses(context, storeProvider.licenses);
        if (excludeOverlappingLicensesResult.isErr()) {
          logger.error(context, TAG, `Error excluding overlapping licenses.`, storeProvider);
          return err(ErrCode.SERVICE);
        }
        const storeProviderLicenses = excludeOverlappingLicensesResult.value;

        overlappingLicensesCount += (storeProvider.licenses.length - storeProviderLicenses.length);
        licensesToCreateCount += storeProviderLicenses.length;

        for (const storeLicense of storeProviderLicenses) {
          const createLicenseResult = await CandidApi.organizationProviders.createProviderCredentialingSpan(
            context,
            createResult.value.organization_provider_id,
            {
              start_date: storeLicense.issue_date ?? undefined,
              end_date: storeLicense.expiration_date ?? undefined,
              regions: {
                type: 'states',
                states: [storeLicense.state]
              },
              rendering_provider_id: createResult.value.organization_provider_id,
              contracting_provider_id: foodsmartCandidProvider.organization_provider_id,
              payer_uuid: candidPayer.payer_uuid,
            }
          )
          if (createLicenseResult.isOk()) {
            // On success, update the license in the store with the new provider_credentialing_span_id from candid
            await db.update(
              'telenutrition.provider_license',
              { candid_provider_credentialing_span_id: createLicenseResult.value.provider_credentialing_span_id },
              { license_id: storeLicense.license_id }
            ).run(pool);
            createdLicensesCount++;
          } else {
            logger.error(context, TAG, `Error creating provider crendential span in candid during create provider.`, { storeProvider, storeLicense });
          }
        }
      } else {
        logger.error(context, TAG, `Error creating a provder using the candid api.`, storeProvider);
      }
    }

    const finalReport: SyncProvidersToCandidReport = {
      ...validatedReport,
      providersAlreadyInSync,
      createdProvidersCount,
      updatedProvidersCount,
      deletedProvidersCount,
      failedToCreateProvidersCount: providersToCreate.length - createdProvidersCount,
      failedToUpdateProvidersCount: providersToUpdate.length - updatedProvidersCount,
      failedToDeleteProvidersCount: providersToDelete.length - deletedProvidersCount,
      overlappingLicensesCount,
      licensesToCreateCount,
      licensesToUpdateCount,
      licensesToDeleteCount,
      licensesAlreadyInSync,
      createdLicensesCount,
      updatedLicensesCount,
      deletedLicensesCount,
      failedToCreateLicenseCount: licensesToCreateCount - createdLicensesCount,
      failedToUpdateLicenseCount: licensesToUpdateCount - updatedLicensesCount,
      failedToDeleteLicenseCount: licensesToDeleteCount - deletedLicensesCount,
    }
    return ok(finalReport)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


interface SyncProviderLicensesToCandidProps {
  foodsmartCandidProvider: OrganizationProvider,
  storeProvider: zs.telenutrition.schedule_provider.JSONSelectable & db.LateralResult<{
    licenses: db.SQLFragment<zs.telenutrition.provider_license.JSONSelectable[], never>;
  }>,
  candidProvider: Omit<OrganizationProvider, 'npi'> & { npi: number },
  candidPayer: Payer,
}

interface SyncProviderLicensesToCandidReport {
  overlappingLicensesCount: number,
  licensesToCreateCount: number,
  licensesToUpdateCount: number,
  licensesToDeleteCount: number,
  licensesAlreadyInSync: number,
  createdLicensesCount: number,
  updatedLicensesCount: number,
  deletedLicensesCount: number,
}

async function syncProviderLicensesToCandid(context: IContext, props: SyncProviderLicensesToCandidProps): Promise<Result<SyncProviderLicensesToCandidReport, ErrCode>> {
  const TAG = `${MTAG}.syncProviderLicensesToCandid`
  const { logger, store: { writer } } = context
  const { foodsmartCandidProvider, storeProvider, candidProvider, candidPayer } = props;

  try {
    const pool = await writer();

    let licensesAlreadyInSync = 0;
    let createdLicensesCount = 0;
    let updatedLicensesCount = 0;
    let deletedLicensesCount = 0;

    const candidProviderLicensesResult = await CandidApi.organizationProviders.getProviderCredentialingSpans(context, candidProvider.organization_provider_id);
    if (candidProviderLicensesResult.isErr()) {
      logger.error(context, TAG, `Could not fetch provider credential spans from candid during update.`, storeProvider);
      return err(ErrCode.SERVICE);
    }

    // For now, only sync cigna licenses
    const candidProviderLicenses = candidProviderLicensesResult.value
      .filter(l => l.payer.payer_id === CIGNA_PAYER.payerId && l.payer.payer_name === CIGNA_PAYER.payerName)
      .map(p => ({ ...p, candid_provider_credentialing_span_id: p.provider_credentialing_span_id }))

    const excludeOverlappingLicensesResult = excludeOverlappingLicenses(context, storeProvider.licenses);
    if (excludeOverlappingLicensesResult.isErr()) {
      logger.error(context, TAG, `Error excluding overlapping licenses.`, storeProvider);
      return err(ErrCode.SERVICE);
    }
    const storeProviderLicenses = excludeOverlappingLicensesResult.value;
    const overlappingLicensesCount = storeProvider.licenses.length - storeProviderLicenses.length;

    const licensesToCreate = differenceBy(storeProviderLicenses, candidProviderLicenses, 'candid_provider_credentialing_span_id');
    const licensesToUpdate = intersectionBy(storeProviderLicenses, candidProviderLicenses, 'candid_provider_credentialing_span_id')
    const licensesToDelete = differenceBy(candidProviderLicenses, storeProviderLicenses, 'candid_provider_credentialing_span_id');

    // Validate the license sync
    const totalProviderLicensesCount = licensesToCreate.length + licensesToUpdate.length + licensesToDelete.length;
    const plannedLicenseReport = {
      licensesToCreateCount: licensesToCreate.length,
      licensesToUpdateCount: licensesToUpdate.length,
      licensesToDeleteCount: licensesToDelete.length,
    }
    if (totalProviderLicensesCount > MAX_LICENSES_PER_PROVIDER_TO_SYNC) {
      logger.error(context, TAG, `Abnormally large license sync. Aborting license sync.`, plannedLicenseReport);
      ok({
        ...plannedLicenseReport,
        licensesAlreadyInSync,
        createdLicensesCount,
        updatedLicensesCount,
        deletedLicensesCount,
      });
    }
    logger.debug(context, TAG, 'Validated license sync', { plannedLicenseReport, npi: storeProvider.npi })

    // Perform the actual license sync

    // Delete the provider's licenses (Licenses that are in candid, but not in the store)
    for (const candidLicense of licensesToDelete) {
      const deleteLicenseResult = await CandidApi.organizationProviders.deleteProviderCredentialingSpan(
        context,
        candidProvider.organization_provider_id,
        candidLicense.provider_credentialing_span_id
      )
      if (deleteLicenseResult.isOk()) {
        deletedLicensesCount++
      } else {
        logger.error(context, TAG, `Error deleting provider crendential span in candid during update provider.`, { candidLicense });
      }
    }

    // Update the provider's licenses (Licenses that are both in the store and in candid)
    for (const storeLicense of licensesToUpdate) {
      if (!storeLicense.candid_provider_credentialing_span_id) {
        logger.error(context, TAG, `Error getting the candid_provider_credentialing_span_id from the store during update.`, { storeProvider, storeLicense });
        continue;
      }
      const candidLicense = candidProviderLicenses.find(l => l.candid_provider_credentialing_span_id === storeLicense.candid_provider_credentialing_span_id)
      if (!candidLicense) {
        logger.error(context, TAG, `Error getting the candid license during update.`, { storeProvider, storeLicense });
        continue;
      }

      const current: UpdateProviderCredentialingSpansApiRequest = {
        start_date: candidLicense.dates.start_date ?? undefined,
        end_date: candidLicense.dates.end_date ?? undefined,
        regions: {
          type: candidLicense.regions?.type as any,
          states: candidLicense.regions?.type === 'states' ? candidLicense.regions?.states : undefined
        },
      }
      const update: UpdateProviderCredentialingSpansApiRequest = {
        start_date: storeLicense.issue_date ?? undefined,
        end_date: storeLicense.expiration_date ?? undefined,
        regions: {
          type: 'states',
          states: [storeLicense.state]
        },
      }

      if (isEqual(current, update)) {
        updatedLicensesCount++;
        licensesAlreadyInSync++;
      } else {
        const createLicenseResult = await CandidApi.organizationProviders.updateProviderCredentialingSpan(
          context,
          candidProvider.organization_provider_id,
          storeLicense.candid_provider_credentialing_span_id,
          update
        )
        if (createLicenseResult.isOk()) {
          updatedLicensesCount++;
        } else {
          logger.error(context, TAG, `Error updating provider crendential span in candid during update provider.`, { storeProvider, storeLicense });
        }
      }
    }

    // Create the provider's licenses (Licenses that are in the store, but not in candid)
    for (const storeLicense of licensesToCreate) {
      const createLicenseResult = await CandidApi.organizationProviders.createProviderCredentialingSpan(
        context,
        candidProvider.organization_provider_id,
        {
          start_date: storeLicense.issue_date ?? undefined,
          end_date: storeLicense.expiration_date ?? undefined,
          regions: {
            type: 'states',
            states: [storeLicense.state]
          },
          rendering_provider_id: candidProvider.organization_provider_id,
          contracting_provider_id: foodsmartCandidProvider.organization_provider_id,
          payer_uuid: candidPayer.payer_uuid,
        }
      )
      if (createLicenseResult.isOk()) {
        // On success, update the license in the store with the new provider_credentialing_span_id from candid
        await db.update(
          'telenutrition.provider_license',
          { candid_provider_credentialing_span_id: createLicenseResult.value.provider_credentialing_span_id },
          { license_id: storeLicense.license_id }
        ).run(pool);
        createdLicensesCount++;
      } else {
        logger.error(context, TAG, `Error creating provider crendential span in candid during update provider.`, { storeProvider, storeLicense });
      }
    }

    return ok({
      ...plannedLicenseReport,
      overlappingLicensesCount,
      licensesAlreadyInSync,
      createdLicensesCount,
      updatedLicensesCount,
      deletedLicensesCount,
    });
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Excludes licenses that overlap based on the state and a date range (issue_date to expiration_date).
 * Licenses with the greatest expiration_date are included first.
 * Licenses with a missing issue_date or expiration_date are always included.
 * @param context 
 * @param licenses 
 * @returns An array of licenses that do not overlap
 */
export function excludeOverlappingLicenses(context: IContext, licenses: zs.telenutrition.provider_license.JSONSelectable[]): Result<zs.telenutrition.provider_license.JSONSelectable[], ErrCode> {
  const TAG = `${MTAG}.excludeOverlappingLicenses`
  const { logger } = context

  try {
    let result: zs.telenutrition.provider_license.JSONSelectable[] = [];

    for (const stateLicenses of Object.values(groupBy(licenses, 'state'))) {
      const stateResult: zs.telenutrition.provider_license.JSONSelectable[] = []
      const sortedLicenses = orderBy(stateLicenses, ['expiration_date', 'issue_date', 'license_id'], 'desc');

      let minStart: Date | undefined = undefined;
      let maxEnd: Date | undefined = undefined;
      for (const license of sortedLicenses) {
        if (!license.issue_date || !license.expiration_date) {
          stateResult.push(license)
          continue;
        }

        const start = new Date(license.issue_date);
        const end = new Date(license.expiration_date);

        const overlapping = minStart !== undefined && maxEnd !== undefined && areIntervalsOverlapping(
          { start: minStart, end: maxEnd },
          { start, end },
        )

        if (overlapping) {
          logger.info(context, TAG, 'Excluding provider license during candid sync', license)
        } else {
          minStart = min(minStart ? [minStart, start] : [start]);
          maxEnd = max(maxEnd ? [maxEnd, end] : [end]);
          stateResult.push(license)
        }
      }
      result = result.concat(stateResult);
    }
    return ok(result);
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  syncProvidersAndLicensesToCandid,
}
