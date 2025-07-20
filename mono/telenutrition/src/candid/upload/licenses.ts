import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import CandidApi from '../api';
import { CandidApi as CandidSdkApi } from 'candidhealth';
import { z } from 'zod';
import * as db from 'zapatos/db';
import { uniq } from 'lodash'
import { FOODSMART_PROVIDER } from '../constants';
import { IContext } from '@mono/common/lib/context';
import { Err, Result, err, ok } from 'neverthrow';
import { ErrCode } from '@mono/common/lib/error';
import { DateTime } from 'luxon';


const MTAG = 'telenutrition.candid.upload.licenses';
const DateFormatSchema = z.string().transform(val => DateTime.fromISO(val).toFormat('yyyy-MM-dd'))
const UploadLicenseCsvRowSchema = z.object({
  providerid: z.string().transform(val => parseInt(val)),
  start: DateFormatSchema,
  end: DateFormatSchema,
  state: z.nativeEnum(CandidSdkApi.State)
});


interface UploadLicensesFromCsvToCandidReport {
  csvRowsCount: number,
  createdCredentialsCount: number,
  contractProviderIdCount: number,
}

export async function uploadLicensesFromCsvToCandid(context: IContext, filePath: string, payerId: string, payerName: string): Promise<Result<UploadLicensesFromCsvToCandidReport, ErrCode>> {
  const tag = `${MTAG}.uploadLicensesFromCsvToCandid`
  const { logger, store: { reader } } = context;
  const pool = await reader();

  logger.info(context, tag, 'Reading csv', { filePath })
  const readCsvResult = await readCsv(context, filePath)
  if (readCsvResult.isErr()) {
    logger.error(context, tag, 'Error reading csv');
    return err(ErrCode.INVALID_DATA);
  }
  const rows = readCsvResult.value;
  logger.info(context, tag, 'Read csv', { rowsCount: rows.length });

  const parseResult = z.array(UploadLicenseCsvRowSchema).safeParse(rows);
  if (!parseResult.success) {
    logger.error(context, tag, 'Input validation error', { error: parseResult.error });
    return err(ErrCode.INVALID_DATA);
  }
  const csvLicenses = parseResult.data


  const candidProvidersResult = await CandidApi.organizationProviders.getAllProviders(context, {
    limit: 100000,
  });
  if (candidProvidersResult.isErr()) {
    logger.error(context, tag, `Error fetching providers from candid`)
    return err(ErrCode.SERVICE);
  }
  if (candidProvidersResult.value.next_page_token) {
    logger.error(context, tag, `Paging not implemented`)
    return err(ErrCode.NOT_IMPLEMENTED);
  }
  const candidProviders = candidProvidersResult.value.items
    .filter(p => p.npi !== FOODSMART_PROVIDER.npi);

  const foodsmartCandidProvider = candidProvidersResult.value.items.find(p => p.npi === FOODSMART_PROVIDER.npi);
  if (!foodsmartCandidProvider) {
    logger.error(context, tag, `Could not get the foodsmart provider from candid`)
    return err(ErrCode.SERVICE);
  }

  const payersResult = await CandidApi.payers.getPayers(context, { search_term: payerName, limit: 100 });
  if (payersResult.isErr()) {
    logger.error(context, tag, `Error fetching payers from candid`)
    return err(ErrCode.SERVICE);
  }

  const candidPayer = payersResult.value.items.find(p => p.payer_id === payerId && p.payer_name === payerName)
  if (!candidPayer) {
    logger.error(context, tag, `Error getting the payer from candid`)
    return err(ErrCode.SERVICE);
  }

  const candidContractsResult = await CandidApi.contracts.getContracts(context);
  if (candidContractsResult.isErr()) {
    logger.error(context, tag, `Error fetching contracts from candid`)
    return err(ErrCode.SERVICE);
  }
  let contract = candidContractsResult.value
    .find(c => c.payer.payer_id === payerId && c.payer.payer_name === payerName)
  if (!contract) {
    logger.warn(context, tag, `Unable to get the contract from candid. Creating the contract`)

    const createContractResult = await CandidApi.contracts.createContract(context, {
      effective_date: DateTime.now().toFormat('yyyy-MM-dd'),
      contracting_provider_id: foodsmartCandidProvider.organization_provider_id,
      rendering_provider_ids: [],
      payer_uuid: candidPayer.payer_uuid,
    })
    if (createContractResult.isErr()) {
      return err(ErrCode.SERVICE);
    }
    logger.info(context, tag, `Created the contract`)
    contract = createContractResult.value
  }

  logger.info(context, tag, `Starting to process licenses`, { csvLicensesCount: csvLicenses.length })
  let candidProviderIds: string[] = [];
  let createdCredentialsCount = 0;
  for (const csvLicense of csvLicenses) {
    const storeProvider = await db.selectOne('telenutrition.schedule_provider', { provider_id: csvLicense.providerid }).run(pool);
    if (!storeProvider) {
      logger.error(context, tag, 'Could not fetch provider from store.', { providerid: csvLicense.providerid })
      continue;
    }
    if (!storeProvider.npi) {
      logger.error(context, tag, 'This provider does not have an npi.', { providerid: csvLicense.providerid })
      continue;
    }

    const candidProvider = candidProviders.find(p => Number(p.npi) === storeProvider.npi)
    if (!candidProvider) {
      logger.error(context, tag, 'The provider does not exist in candid.', { npi: storeProvider.npi })
      continue;
    }
    candidProviderIds.push(candidProvider.organization_provider_id);

    const createCredentialResult = await CandidApi.organizationProviders.createProviderCredentialingSpan(
      context,
      candidProvider.organization_provider_id,
      {
        rendering_provider_id: candidProvider.organization_provider_id,
        contracting_provider_id: foodsmartCandidProvider.organization_provider_id,
        payer_uuid: candidPayer.payer_uuid,
        start_date: csvLicense.start,
        end_date: csvLicense.end,
        regions: {
          type: 'states',
          states: [csvLicense.state]
        },
      }
    );
    if (createCredentialResult.isErr()) {
      continue;
    }

    logger.debug(context, tag, `Successfully created license in candid`, createCredentialResult.value)
    createdCredentialsCount++;
  }

  logger.info(context, tag, 'Finished creating the licenses. Starting to update the contract', { createdCredentialsCount })

  const existingContractProviderIds = Object.values(contract.rendering_providers)
    .map(p => p.organization_provider_id)
  const contractProviderIds = uniq([...existingContractProviderIds, ...candidProviderIds]);
  const updateContractResult = await CandidApi.contracts.updateContract(context, contract.contract_id, {
    rendering_provider_ids: contractProviderIds
  })
  if (updateContractResult.isErr()) {
    logger.error(context, tag, 'Error updating the candid contract.')
    return err(ErrCode.SERVICE);
  }

  logger.info(context, tag, 'Finished uploading licenses from csv to candid.')
  return ok({
    csvRowsCount: rows.length,
    createdCredentialsCount,
    contractProviderIdCount: contractProviderIds.length
  });
}

function readCsv(context: IContext, filePath: string): Promise<Result<unknown[], ErrCode>> {
  const tag = `${MTAG}.readCsv`
  const { logger } = context;

  return new Promise((resolve, reject) => {
    const rows: unknown[] = [];
    createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on("data", (data) => rows.push(data))
      .on('end', () => resolve(ok(rows)))
      .on("error", (e) => {
        logger.exception(context, tag, e);
        resolve(err(ErrCode.EXCEPTION));
      });
  });
}


export default {
  uploadLicensesFromCsvToCandid,
}