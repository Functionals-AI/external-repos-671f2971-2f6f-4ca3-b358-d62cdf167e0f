import { IContext } from "@mono/common/src/context";
import { ErrCode } from "@mono/common/lib/error";
import { Result, err, ok } from "neverthrow";
import getClient from "./client"


const TAG = 'telenutrition.medallion.api.board-certificates'
const MAX_API_CALLS = 10000;


export type BoardCertificate = {
  id: string
  provider: string
  abms: string
  board_name: string
  is_board_certification: boolean
  specialty: string
  certification_number: string
  is_exam_passed: boolean | null
  issue_date: string | null
  is_indefinite: boolean
  expiration_date: string | null
  recertification_date: string | null
  exam_date: string | null
  moc_status: boolean | null
  is_meeting_moc: boolean | null
  moc_verification_date: string | null
  moc_annual_reverification_date: string | null
  requires_verification: boolean
  [x: string]: unknown
}


export type GetBoardCertificatesResponse = {
  count: number
  next: string
  previous: string
  results: BoardCertificate[]
}

export async function getBoardCertificates(context: IContext): Promise<Result<BoardCertificate[], ErrCode>> {
  const tag = `${TAG}.getBoardCertificates`
  const { logger, config } = context
  
  const client = getClient(context, tag);

  try {
    logger.debug(context, tag, 'starting to get board certificates from the medallion api')

    const medallionConfig = config.telenutrition.medallion
    if (!medallionConfig) {
      logger.error(context, tag, 'unable to get the medallion config.')
      return err(ErrCode.INVALID_CONFIG);
    }
    const { host, token } = medallionConfig;

    const { data } = await client.get<GetBoardCertificatesResponse>(`${host}/api/v1/org/board-certificates`, {
      headers: {
        'x-api-key': token
      },
    })

    let nextUrl: string | null = data.next;
    let results: BoardCertificate[] = data.results;
    for (let i = 0; i < MAX_API_CALLS; i++) {
      if (!nextUrl) {
        break;
      }
      if (i === MAX_API_CALLS - 1) {
        logger.error(context, tag, 'reached max api calls', { i, MAX_API_CALLS });
        return err(ErrCode.SERVICE)
      }

      logger.debug(context, tag, 'fetching next batch of board certificates from the medallion api.', { nextUrl })
      const { data } = await client.get<GetBoardCertificatesResponse>(nextUrl, {
        headers: {
          'x-api-key': token
        },
      })

      nextUrl = data.next;
      results = results.concat(data.results)
    }

    // Fail the process if the difference between data count and the actual result length is too far off (Racing condition on Medallion's end)
    if (Math.abs(data.count - results.length) > 5) {
      logger.error(context, tag, 'count mismatch during board certificates fetch', { apiCount: data.count, resultsCount: results.length })
      return err(ErrCode.SERVICE);
    }

    logger.debug(context, tag, 'finished getting board certificates from the medallion api', { apiCount: data.count, resultsCount: results.length })
    return ok(results)
  } catch (e) {
    logger.exception(context, tag, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  getBoardCertificates,
}
