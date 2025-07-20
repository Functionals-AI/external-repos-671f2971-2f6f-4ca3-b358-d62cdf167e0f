import { Readable } from 'node:stream'
import { err, ok, Result } from 'neverthrow'
import { transform } from 'stream-transform'
import stringify = require('csv-stringify')

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib//error'
import { IngestResult } from '../ingest'
import ingestFactory from '../ingest'

const SOURCE = 'cigna'
const MTAG = [ 'ops', 'data', SOURCE]

const DELIMITER = '|'
const HEADER = `Record Identifier|Member Number|AMI - Alternate Member Identifier|SSN - Member Social Security Number|Relationship Code|Member First Name|Member Last Name|Vendor Structure ID|Branch Code|Branch Name|Member's Email Address|Date of Birth|Gender|Member ZIP Code|Work ZIP Code|Member's Current Structure Cancel Date|Account Number|Benefit Option Code|Product Type|Member Street Address 1|Member Street Address 2|Member City|Member State|Member Written Language|Member Verbal Language|Handicapped/Disabled Code|Member's Current Structure Effective Date|Provider Name|COB Medicare Type - A|COB Medicare Type - B|COB Medicare Type - C|COB Medicare Type - D|COB Primary Code - A|COB Primary Code - B|COB Primary Code - C|COB Primary Code - D|Product Group Type|Member Phone Number|Account Name|Employee ID|Filler Field`
const COLUMN_HEADERS = HEADER.split(DELIMITER)

const config = {
  inputFields: [
    {
      name: `Record Identifier`,
      length: 2,
    },
    {
      name: `Member Number`,
      length: 11,
    },
    {
      name: `AMI - Alternate Member Identifier`,
      length: 11,
    },
    {
      name: `SSN - Member Social Security Number`,
      length: 9,
    },
    {
      name: `Relationship Code`,
      length: 2,
    },
    {
      name: `Member First Name`,
      length: 15,
    },
    {
      name: `Member Last Name`,
      length: 30,
    },
    {
      name: `Vendor Structure ID`,
      length: 10,
    },
    {
      name: `Branch Code`,
      length: 6,
    },
    {
      name: `Branch Name`,
      length: 20,
    },
    {
      name: `Member's Email Address`,
      length: 50,
    },
    {
      name: `Date of Birth`,
      length: 8,
    },
    {
      name: `Gender`,
      length: 1,
    },
    {
      name: `Member ZIP Code`,
      length: 10,
    },
    {
      name: `Work ZIP Code`,
      length: 10,
    },
    {
      name: `Member's Current Structure Cancel Date`,
      length: 8,
    },
    {
      name: `Account Number`,
      length: 7,
    },
    {
      name: `Benefit Option Code`,
      length: 5,
    },
    {
      name: `Product Type`,
      length: 6,
    },
    {
      name: `Member Street Address 1`,
      length: 30,
    },
    {
      name: `Member Street Address 2`,
      length: 30,
    },
    {
      name: `Member City`,
      length: 20,
    },
    {
      name: `Member State`,
      length: 2,
    },
    {
      name: `Member Written Language`,
      length: 2,
    },
    {
      name: `Member Verbal Language`,
      length: 2,
    },
    {
      name: `Handicapped/Disabled Code`,
      length: 1,
    },
    {
      name: `Member's Current Structure Effective Date`,
      length: 8,
    },
    {
      name: `Provider Name`,
      length: 30,
    },
    {
      name: `COB Medicare Type - A`,
      length: 1,
    },
    {
      name: `COB Medicare Type - B`,
      length: 1,
    },
    {
      name: `COB Medicare Type - C`,
      length: 1,
    },
    {
      name: `COB Medicare Type - D`,
      length: 1,
    },
    {
      name: `COB Primary Code - A`,
      length: 1,
    },
    {
      name: `COB Primary Code - B`,
      length: 1,
    },
    {
      name: `COB Primary Code - C`,
      length: 1,
    },
    {
      name: `COB Primary Code - D`,
      length: 1,
    },
    {
      name: `Product Group Type`,
      length: 6,
    },
    {
      name: `Home Telephone Number`,
      length: 10,
    },
    {
      name: `Account Name`,
      length: 25,
    },
    {
      name: `Employee ID`,
      length: 6,
    },
    {
      name: `Filler Field`,
      length: 6,
    }
  ]
}

type TransformedRecord = Record<string, string>

function transformLine(context: IContext, line: string): Result<TransformedRecord | undefined, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'transformLine' ]

  try {
    let offset = 0

    const record: TransformedRecord = {}
  
    for (const [fieldNo, field] of config.inputFields.entries()) {
      const columnHeader = COLUMN_HEADERS[fieldNo]
      const value = line.substring(offset, offset + field.length).trim()
  
      if (field.name === `Filler Field`) {
        //
        // In order to diff with old files for QA.
        //
        record[columnHeader] = value.trim().length === 0 ? ' ' : value
      }
      else if (field.name === `AMI - Alternate Member Identifier` && value.trim().length === 0) {
        //
        // The record should be skipped as the this column is required.
        //
        return ok(undefined)
      }
      else {
        record[columnHeader] = line.substring(offset, offset + field.length)
      }
      offset = offset + field.length
    }
  
    return ok(record)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

function transformEligibility(context: IContext, data: Readable): Result<Readable, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'transformEligibility' ]

  try {
    const transformer = transform(function(line) {
      const transformLineResult = transformLine(context, line)

      if (transformLineResult.isErr()) {
        logger.info(context, TAG, 'Skipping record.', {
          line,
          error: transformLineResult.error,
        })

        return null
      }

      //
      // logger.debug(context, TAG, 'Trarnsformed line.', {
      //  line,
      //  transformed: transformLineResult.value
      //})
      //
      return transformLineResult.value
    })

    let chunks: string[] = []

    data.on('readable', () => {
      let chunk: Buffer | null = null

      while (null !== (chunk = data.read())) {
        chunks.push(chunk.toString())
      }

      const lines = chunks.join('').split('\n')

      for (const [lineNo, line] of lines.entries()) {
        if (lineNo < lines.length - 1) {
          transformer.write(line)
        }
        else {
          chunks = [ line ]
        }
      }
    })

    data.on('end', () => {
      if (chunks.length === 1) {
        transformer.write(chunks[0])
      }
      else if (chunks.length > 1) {
        logger.error(context, TAG, 'Have more than one chunk on end.')

        return err(ErrCode.STATE_VIOLATION)
      }
      transformer.end()
      logger.info(context, TAG, 'Transform completed.')
    })

    const stringifier = stringify({
      delimiter: DELIMITER,
      header: true,
    })
    
    return ok(transformer.pipe(stringifier))
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function ingest(context: IContext, srcKey: string): Promise<Result<IngestResult, ErrCode>> {
    const { logger } = context;
    const TAG = [ ...MTAG, 'ingest' ]
  
    try {
      const factoryResult = ingestFactory(context, SOURCE, {
        destFilename: (srcKey.split('/').pop() as string).replace(/\.pgp$/, ''),
        transformFunction: transformEligibility,
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