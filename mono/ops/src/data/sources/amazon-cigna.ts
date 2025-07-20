/**
 * Amazon - Cigna ingest. 
 * 
 * Currently, assume inbound files will be XLSX as has been previously received, but test
 * file extension and fall back to no conversion.
 */
import { Readable, Transform } from 'node:stream'
import { err, ok, Result } from "neverthrow";
import { DateTime } from 'luxon'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"
import { xlsxToCsv } from '../xlsx'
import { IngestResult } from '../ingest'
import ingestFactory from '../ingest'

const SOURCE = 'amazon-cigna'

const MTAG = [ 'ops', 'data', SOURCE ]

function xlscTransform(context: IContext, data: Readable): Result<Readable, ErrCode> {
  return xlsxToCsv(context, data, {
    stringifierOptions: {
      delimiter: ',',
      header: true,
      cast: {
        date: (value, context) =>  {
          if (context.column === 'DOB') {
            return DateTime.fromJSDate(value).toFormat('yyyy-MM-dd')
          }
          return value.toISOString()
        }
      }
    },
  })
}

export async function ingest(context: IContext, srcKey: string): Promise<Result<IngestResult, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'ingest' ]

  try {
    const destFilename = srcKey.endsWith('.xlsx') ?
      (srcKey.split('/').pop() as string).replace(/\.xlsx$/, '.csv') :
      srcKey.split('/').pop() as string

    const factoryResult = ingestFactory(context, SOURCE, {
      destFilename,
      transformFunction: srcKey.endsWith('.xlsx') ? xlscTransform : undefined,
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
