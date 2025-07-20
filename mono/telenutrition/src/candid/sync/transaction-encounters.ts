import { IContext } from '@mono/common/lib/context';
import { Result, err, ok } from 'neverthrow';
import { ErrCode } from '@mono/common/lib/error';
import '@mono/common/lib/zapatos/schema';
import * as zs from 'zapatos/schema';
import * as db from 'zapatos/db';
import { CandidApi, CandidApiClient, CandidApiEnvironment } from "candidhealth";


const MTAG = `telenutrition.candid.sync.transaction-encounters`
const DEFAULT_LIMIT = 50;
const DEFAULT_SORT = 'created_at:desc';
const MAX_API_CALLS = 10000;


interface SyncTransactionEncountersOptions {
  limit?: number,
  sort?: CandidApi.encounters.v4.EncounterSortOptions,
}

interface SyncTransactionEncountersReport {
  encounterCount: number,
  updatedRowCount: number,
}

/**
 * Fetches all encounters from the candid API and updates the billing_transaction store table.
 * @param context
 * @returns A report object
 */
export async function syncAll(context: IContext, options?: SyncTransactionEncountersOptions): Promise<Result<SyncTransactionEncountersReport, ErrCode>> {
  const TAG = `${MTAG}.syncAll`
  const { logger, store: { writer } } = context

  try {
    const pool = await writer();

    const { host, clientId, clientSecret } = context.config.telenutrition.candidhealth
    const candidClient = new CandidApiClient({
      environment: host as CandidApiEnvironment,
      clientId,
      clientSecret,
    });

    let encounterCount = 0;
    let updatedRowCount = 0;
    let pageToken: CandidApi.PageToken | undefined = undefined;
    for (let i = 0; i < MAX_API_CALLS; i++) {
      const getEncountersResult = await candidClient.encounters.v4.getAll({ 
        limit: options?.limit ?? DEFAULT_LIMIT,
        sort: options?.sort ?? DEFAULT_SORT,
        pageToken,
      })
      if (getEncountersResult.ok) {
        const encounterBatch = getEncountersResult.body.items;
        pageToken = getEncountersResult.body.nextPageToken;

        logger.debug(context, TAG, 'Fetched encounter batch from candid', { encounterBatchCount: encounterBatch.length, pageToken })

        for (const encounter of encounterBatch) {
          encounterCount++;

          const filteredEncounter = {
            ...encounter,
            billingNotes: []
          }

          const updatedRows = await db.sql<zs.telenutrition.billing_transaction.SQL, zs.telenutrition.billing_transaction.JSONSelectable[]>`
            UPDATE ${'telenutrition.billing_transaction'}
            SET ${'meta'} = jsonb_set(
                ${'meta'}, 
                '{newEncounter}', 
                ${db.param(JSON.stringify(filteredEncounter), true)}, 
                true
            )
            WHERE ${'meta'}->'newEncounter'->>'encounterId' = ${db.param(encounter.encounterId)}
            RETURNING *;
          `.run(pool);
          updatedRowCount += updatedRows.length
        }
      } else {
        logger.error(context, TAG, 'Error fetching encounters from candid', getEncountersResult.error);
        return err(ErrCode.SERVICE);
      }
      if (!pageToken) {
        logger.debug(context, TAG, 'no more pages');
        break;
      }
      if (i === MAX_API_CALLS-1) {
        logger.error(context, TAG, 'reached max api calls', { apiCallCount: i, encounterCount, updatedRowCount });
        return err(ErrCode.SERVICE)
      }
    }

    return ok({ encounterCount, updatedRowCount });
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  syncAll,
}
