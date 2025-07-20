import { err, ok, Result } from "neverthrow";
import { DateTime } from 'luxon'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error";
import { IngestResult } from '../ingest'
import ingestFactory from '../ingest'

const SOURCE = 'pacific-source'
const MTAG = [ 'ops', 'data', SOURCE ]

/**
 * Ingest Pacific Source E-File.
 * 
 * @param context - context
 * @param date - Date associated with file, ie: date file was upload to Foodsmart's SFTP service.
 * @param srcKey - S3 key of file in SFTP archive bucket.
 * @returns 
 */
export async function ingest(context: IContext, srcKey: string): Promise<Result<IngestResult, ErrCode>> {
  const { logger } = context;
  const TAG = [ ...MTAG, 'ingest' ]

  try {
    const date = new Date()
    const formatedDate = DateTime.fromJSDate(date, { zone: 'utc' }).toFormat('yyyy-MM-dd')
    const destFilename = `${(srcKey.split('/').pop() as string).replace(/\.txt\.pgp$/, '')}-${formatedDate}.csv`

    const factoryResult = ingestFactory(context, SOURCE, {
      destFilename,
    })

    if (factoryResult.isErr()) {
      logger.error(context, TAG, 'Error generating ingest function.')

      return err(factoryResult.error)
    }

    const ingestFunction = factoryResult.value

    const ingestResult = await ingestFunction(context, srcKey)

    if (ingestResult.isErr()) {
      logger.error(context, TAG, 'Ingest error.')

      return err(ingestResult.error)
    }

    return ok(ingestResult.value)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  ingest,
}