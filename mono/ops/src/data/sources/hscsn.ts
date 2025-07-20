import { Readable } from 'node:stream'
import { err, ok, Result } from "neverthrow";
import { parse } from 'csv-parse'
import { transform } from 'stream-transform'
import stringify = require('csv-stringify')

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"
import { IngestResult } from '../ingest'
import ingestFactory from '../ingest'

const SOURCE = 'hscsn'

const MTAG = [ 'ops', 'data', SOURCE ]

function filterEligibility(context: IContext, data: Readable): Result<Readable, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'filterEligibility' ]
  
  try {
    const transformer = transform(function(data) {
      if (!data.info.error) {
        return data.record
      }
      logger.info(context, TAG, 'Skipping record.', {
        record: data.record,
        info: data.info,
      })
      return null
    })
  
    var parser = parse({ columns: true, relaxColumnCount: true, info: true })
  
    const stringifier = stringify({
      delimiter: ',',
      header: true,
    })  
  
    return ok(data.pipe(parser).pipe(transformer).pipe(stringifier))
  }
  catch (e) {
    logger.exception(context, TAG, e)
  
    return err(ErrCode.EXCEPTION)
  }
}

export async function ingest(context: IContext, srcKey: string): Promise<Result<IngestResult, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'ingest' ]

  try {
    const factoryResult = ingestFactory(context, SOURCE, {
      destFilename: srcKey.split('/').pop(),
      transformFunction: filterEligibility,
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
