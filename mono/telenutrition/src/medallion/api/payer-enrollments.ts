import { IContext } from "@mono/common/src/context";
import { ErrCode } from "@mono/common/lib/error";
import { Result, err, ok } from "neverthrow";
import axios from "axios";


const TAG = 'telenutrition.medallion.api.payer-enrollments'
const MAX_API_CALLS = 10000;


export type PayerEnrollment = {
  id: string,
  provider: string | null,
  kind: 'group-profile' | 'provider'
  payer_name: string,
  payer_entity: string,
  state: string,
  effective_date: string | null,
  end_date: string | null,
  revalidation_date: string | null,
  [x: string]: unknown
}


export type GetPayerEnrollmentsResponse = {
  count: number
  next: string
  previous: string
  results: PayerEnrollment[]
}

export async function getPayerEnrollments(context: IContext): Promise<Result<PayerEnrollment[], ErrCode>> {
  const tag = `${TAG}.getPayerEnrollments`
  const { logger, config } = context

  try {
    logger.debug(context, tag, 'starting to get payer enrollments from the medallion api')

    const medallionConfig = config.telenutrition.medallion
    if (!medallionConfig) {
      logger.error(context, tag, 'unable to get the medallion config.')
      return err(ErrCode.INVALID_CONFIG);
    }
    const { host, token } = medallionConfig;

    const { data } = await axios.get<GetPayerEnrollmentsResponse>(`${host}/p/api/v1/payer-enrollments`, {
      headers: {
        'x-api-key': token
      },
    })

    let nextUrl: string | null = data.next;
    let results: PayerEnrollment[] = data.results;
    for (let i = 0; i < MAX_API_CALLS; i++) {
      if (!nextUrl) {
        break;
      }
      if (i === MAX_API_CALLS - 1) {
        logger.error(context, tag, 'reached max api calls', { i, MAX_API_CALLS });
        return err(ErrCode.SERVICE)
      }

      logger.debug(context, tag, 'fetching next batch of payer enrollments from the medallion api.', { nextUrl })
      const { data } = await axios.get<GetPayerEnrollmentsResponse>(nextUrl, {
        headers: {
          'x-api-key': token
        },
      })

      nextUrl = data.next;
      results = results.concat(data.results)
    }

    if (data.count !== results.length) {
      logger.error(context, tag, 'count mismatch during payer enrollments fetch', { apiCount: data.count, resultsCount: results.length })
      return err(ErrCode.SERVICE);
    }

    logger.debug(context, tag, 'finished getting payer enrollments from the medallion api', { apiCount: data.count, resultsCount: results.length })
    return ok(results)
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  getPayerEnrollments,
}
