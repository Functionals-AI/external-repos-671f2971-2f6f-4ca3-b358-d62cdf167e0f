import { Readable } from 'node:stream'
import { err, ok, Result } from "neverthrow";
import { parse } from 'csv-parse'
import { transform } from 'stream-transform'
import stringify = require('csv-stringify')

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"
import { IngestResult } from '../ingest'
import ingestFactory from '../ingest'

const SOURCE = 'aetna-medicare'

const MTAG = [ 'ops', 'data', SOURCE ]

const ELIGIBILITY_HEADER = 'MemberID~Birthdate~Gender~EffectiveDate~TerminationDate~FirstName~MI~LastName~Mailing_Address1~Mailing_Address2~Mailing_City~Mailing_State~Mailing_Zipcode~Residential_Address1~Residential_Address2~Residential_City~Residential_State~Residential_Zipcode~PhoneNumber~AlternatePhoneNbr~Member_Language~Contract~PBP~Plan_Eff_Date~Plan_name~Company_Code_Group_Number~Group_Name~Filler1~Filler2~Filler3~Filler4~Filler5'
const ELIGIBILITY_DELIMITER = '~'

function transformEligibility(context: IContext, data: Readable): Result<Readable, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'transformEligibility' ]
  
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
  
    var parser = parse({ 
      columns: ELIGIBILITY_HEADER.split(ELIGIBILITY_DELIMITER), 
      delimiter: ELIGIBILITY_DELIMITER, 
      info: true,
      relaxColumnCount: true,
    })
  
    const stringifier = stringify({
      delimiter: ELIGIBILITY_DELIMITER,
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
      destFilename: (srcKey.split('/').pop() as string).replace(/\.txt\.pgp$/, '.csv'),
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
