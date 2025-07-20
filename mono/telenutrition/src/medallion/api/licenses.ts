import { IContext } from "@mono/common/src/context";
import { ErrCode } from "@mono/common/lib/error";
import { Result, err, ok } from "neverthrow";
import getClient from "./client"
import * as  _ from "lodash"


const TAG = 'telenutrition.medallion.api.licenses'
const MAX_API_CALLS = 10000;


export type License = {
  id: string
  provider: string
  status: 'active' | 'pending' | 'inactive' | 'superceded'
  state: string
  expiration_date: string | null
  issue_date: string | null
  npi: number | null,
  license_number: string,
  certificate_type: string,
  verification_status: 'pending_manual_verification' | 'manually_verified' | 'needs_attention' | 'pending_automatic_verification' | 'automatically_verified' | 'not_requested',
  [x: string]: unknown
}


export type GetLicensesResponse = {
  count: number
  next: string
  previous: string
  results: License[]
}


export async function getLicenses(context: IContext): Promise<Result<License[], ErrCode>> {
  const tag = `${TAG}.getLicenses`
  const { logger, config } = context

  const client = getClient(context, tag);

  try {
    logger.debug(context, tag, 'starting to get licenses from the medallion api')

    const medallionConfig = config.telenutrition.medallion
    if (!medallionConfig) {
      logger.error(context, tag, 'unable to get the medallion config.')
      return err(ErrCode.INVALID_CONFIG);
    }
    const { host, token } = medallionConfig;

    const { data } = await client.get<GetLicensesResponse>(`${host}/api/v1/org/licenses`, {
      headers: {
        'x-api-key': token
      },
    })

    let nextUrl: string | null = data.next;
    let results: License[] = data.results;
    for (let i = 0; i < MAX_API_CALLS; i++) {
      if (!nextUrl) {
        break;
      }

      if (i === MAX_API_CALLS - 1) {
        logger.error(context, tag, 'reached max api calls', { i, MAX_API_CALLS });
        return err(ErrCode.SERVICE)
      }

      logger.debug(context, tag, 'fetching next batch of licenses from the medallion api.', { nextUrl })
      const { data } = await client.get<GetLicensesResponse>(nextUrl, {
        headers: {
          'x-api-key': token
        },
      })

      nextUrl = data.next;
      results = results.concat(data.results)
    }

    // Fail the process if the difference between data count and the actual result length is too far off (Racing condition on Medallion's end)
    if (Math.abs(data.count - results.length) > 5) {
      logger.error(context, tag, 'count mismatch during license fetch', { apiCount: data.count, resultsCount: results.length })
      return err(ErrCode.SERVICE);
    }

    results = _.uniqBy(results, l => l.id)

    logger.debug(context, tag, 'finished getting licenses from the medallion api', { apiCount: data.count, resultsCount: results.length })
    return ok(results)
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  getLicenses,
}
