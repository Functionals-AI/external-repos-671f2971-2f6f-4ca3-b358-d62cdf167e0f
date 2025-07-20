import { Readable, Transform } from 'node:stream'
import { err, ok, Result } from "neverthrow";
import stringify = require('csv-stringify')
const excel = require('xlsx-parse-stream')

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"

const MTAG = [ 'ops', 'data', 'xlsx' ]

type XlsxToCsvOptions = {
  stringifierOptions?: any,
}

export function xlsxToCsv(context: IContext, data: Readable, options?: XlsxToCsvOptions): Result<Readable, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'loggingTransform' ]
  
  try {
    const loggingTransform = new Transform({
      writableObjectMode: true,
      readableObjectMode: true,
      transform(record, encoding, callback) {
        logger.debug(context, TAG, 'record', {
          record,
          dob: record.DOB,
          dob_is_date: record.DOB instanceof Date,
        })

        this.push(record)
        callback()
      },
    });

    const stringifier = stringify(options?.stringifierOptions ?? {
      delimiter: ',',
      header: true,
    })  
  
    return ok(data.pipe(excel()).pipe(loggingTransform).pipe(stringifier))
  }
  catch (e) {
    logger.exception(context, TAG, e)
  
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  xlsxToCsv,
}