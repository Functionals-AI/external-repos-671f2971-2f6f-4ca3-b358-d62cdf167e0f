import { Readable } from 'node:stream'
import { err, ok, Result } from "neverthrow";
import { parse } from 'csv-parse'
import { transform } from 'stream-transform'
import stringify = require('csv-stringify')
import { DateTime } from 'luxon'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"
import { IngestResult } from '../ingest'
import ingestFactory from '../ingest'

const SOURCE = 'aetna-mtbank'

const MTAG = [ 'ops', 'data', SOURCE ]

const ELIGIBILITY_DELIMITER = ','
const EXPECTED_HEADER = 'RECTYP,EE-ID,MEM-ID,ALT-ID,HIC-NUM,LASTNAME,FIRSTNAME,MI,NMPR,NMSF,RLCD,SEX,DOB,SC,ME,MAILING-ADDRESS-LINE1,MAILING-ADDRESS-LINE2,CITY,ST,ZIP-CD,HOMEPHONENUMBER,WRK-PHONENUMBER,HIREDATE,REPORTINGFIELD,DIVISIONCODE,WRK-LOCZIPCODE,EE-CUMB-ID,DEP-CUMB-ID,SEQNO,TI,NONHMOH-F,ELRNO,CTRLNO,SFXNO,ACNTNO,PLNID,EFFDATE,TERMDATE,ORIGEFF-DT,OOA,CLMOF,MEDNTWRKID,PCP-NO,PSI,DENTPRVNO,PSD,IN-NETMEDCOIN,ET,EARNAMNT,CBCD,OONMEDCLCOINSR,OONMEDCLDEDCT,OONFAMILYCOINSR,OONFAMILYDEDCT,IN-NETMEDDEDCT,IN-NETFAMILYCOINSRN,PCI,LEI,IN-NETFAMILYDEDCTBL,PROVIDERCAP-OFC,COBRACOC-EXPDATE,COBRACOC-EVNTDATE,COBRACOC-LTHCNT,TIERLEVEL'

/**
 * Transform eligibility data. Performs the following:
 * 
 *  - Combine the first 3 lines into a single header line. Each column of the first 3 lines are concatenated.
 *  - Remove the last column. Appears to be non-text garbage.
 *  - Trim each column of extra text.
 * 
 * Final header should appear as EXPECTED_HEADER above.
 * 
 * @param context - Context
 * @param data    - Input stream of data.
 * @returns 
 */
function transformEligibility(context: IContext, data: Readable): Result<Readable, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'transformEligibility' ]
  
  try {
    const headers: any[] = [] // Multiple header lines that need to be transformed.
    const header: any[] = []  // Final header row.

    const transformer = transform(function(data) {
      const { info, record } = data

      if (info.lines < 3) {
        record.pop()
        headers.push(record)
    
        return null
      }
      else if (info.lines === 3) {
        //
        // Generate header, array of column names.
        //
        record.pop()
        headers.push(record)
    
        for ( const [ idx, col ] of headers[0].entries() ) {
          header.push( [ col.trim(), (idx < headers[1].length ? headers[1][idx].trim() : ''),  (idx < headers[2].length ? headers[2][idx].trim() : '') ].join('').trim() )
        }

        if (header.join(',') !== EXPECTED_HEADER) {
          logger.debug(context, TAG, 'Header does NOT match expected header.', {
            header: header.join(','),
            expected_header: EXPECTED_HEADER,
          })
        }
    
        return header // Return the first line, which is a header.
      }
      else if (!info.error) {
        record.pop() // Strip trailing column of junk.

        if (record.length !== header.length) {
          logger.info(context, TAG, 'Skipping record with inconsistent # of columns.', {
            header_length: header.length,
            record_length: record.length,
            info: info,
          })

          return null
        }

        return record.map(data => data.trim()) // cleanup
      }
      else {
        logger.info(context, TAG, 'Skipping record.', {
          record: record,
          info: info,
        })

        return null
      }
    })
  
    var parser = parse({ 
      delimiter: ELIGIBILITY_DELIMITER, 
      info: true,
      relaxColumnCount: true,
    })
  
    const stringifier = stringify({
      delimiter: ELIGIBILITY_DELIMITER,
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
    const filename = srcKey.split('/').pop() as string
    const filenameParts = filename.split('.')
    const suffix = filenameParts.length ? filenameParts.pop() : 'csv'

    //
    // Names coming in look like: MTBank.ReHrQNzQ.txt.
    // Ensure date is included in filename as part of the prefix.
    //
    const destFilename = `${[ ...filenameParts, DateTime.now().toFormat('yyyy-MM-dd') ].join('-')}.${suffix}`

    const factoryResult = ingestFactory(context, SOURCE, {
      destFilename,
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
