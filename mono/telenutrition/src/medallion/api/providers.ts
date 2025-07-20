import { IContext } from "@mono/common/src/context";
import { ErrCode } from "@mono/common/lib/error";
import { Result, err, ok } from "neverthrow";
import getClient from "./client"


const TAG = 'telenutrition.medallion.api.providers'
const MAX_API_CALLS = 10000;


export type Provider = {
  id: string
  npi: number | null
  first_name: string | null
  last_name: string | null
  percent_complete: number
  profile_completion_state: 'complete' | 'incomplete' | 'new_fields' | 'new_request' | 'new_service' | 'new_request_and_service'
  percent_complete_last_checked: string
  verification_status: 'needs_attention' | 'in_progress' | 'verified' | 'manually_verified' | 'not_requested'
  verification_status_last_checked: string
  credentialing_committee_status: null | 'approved' | 'pending' | 'rejected' | 'closed_without_decision'
  caqh_number: string | null
  initial_credentialing_date: string | null
  latest_credentialing_date: string | null
  credentialing_step: null | 'not_requested' | 'in_progress' | 'ready' | 'in_committee' | 'file_approved' | 'file_rejected' | 'file_expired' | 'scheduled'
  [x: string]: unknown
}


export type GetProvidersResponse = {
  count: number
  next: string
  previous: string
  results: Provider[]
}

export async function getProviders(context: IContext): Promise<Result<Provider[], ErrCode>> {
  const tag = `${TAG}.getProviders`
  const { logger, config } = context

  const client = getClient(context, tag);

  try {
    logger.debug(context, tag, 'starting to get providers from the medallion api')

    const medallionConfig = config.telenutrition.medallion
    if (!medallionConfig) {
      logger.error(context, tag, 'unable to get the medallion config.')
      return err(ErrCode.INVALID_CONFIG);
    }
    const { host, token } = medallionConfig;

    const { data } = await client.get<GetProvidersResponse>(`${host}/api/v1/org/providers`, {
      headers: {
        'x-api-key': token
      },
    })

    let nextUrl: string | null = data.next;
    let results: Provider[] = data.results;
    for (let i = 0; i < MAX_API_CALLS; i++) {
      if (!nextUrl) {
        break;
      }
      if (i === MAX_API_CALLS - 1) {
        logger.error(context, tag, 'reached max api calls', { i, MAX_API_CALLS });
        return err(ErrCode.SERVICE)
      }

      logger.debug(context, tag, 'fetching next batch of providers from the medallion api.', { nextUrl })
      const { data } = await client.get<GetProvidersResponse>(nextUrl, {
        headers: {
          'x-api-key': token
        },
      })

      nextUrl = data.next;
      results = results.concat(data.results)
    }

    // Fail the process if the difference between data count and the actual result length is too far off (Racing condition on Medallion's end)
    if (Math.abs(data.count - results.length) > 5) {
      logger.error(context, tag, 'count mismatch during provider fetch', { apiCount: data.count, resultsCount: results.length })
      return err(ErrCode.SERVICE);
    }

    logger.debug(context, tag, 'finished getting providers from the medallion api', { apiCount: data.count, resultsCount: results.length })
    return ok(results)
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  getProviders,
}
