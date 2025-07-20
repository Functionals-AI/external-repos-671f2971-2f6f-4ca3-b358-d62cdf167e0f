import { err, ok, Result } from "neverthrow";

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"
import { IngestResult, TransformFunction } from '../../ingest'
import ingestFactory from '../../ingest'
import { transformHL7,transformErrors } from '../../../transforms/HL7toReferralCSV';

const SOURCE = 'aah'
const MTAG = [ 'ops', 'data', SOURCE, 'referral' ]


export async function ingestHL7(context: IContext, srcKey: string): Promise<Result<IngestResult, ErrCode>> {
  const { logger } = context;
  const TAG = [ ...MTAG, 'ingest' ];


  /**
 * Function to write transformed data to a .csv file in S3
 * 
 * @param keyword - modifier to original file name. Should be something like "modified" or "errors" 
 * @param transform - TransFormFunction to apply to original file 
 * @returns either an IngestResult or an ErrCode
 */
  async function getIngestResult(keyword:string, transform:TransformFunction) {
    
    const filename = (srcKey.split('/').pop() as string).replace('.hl7.pgp',`${keyword}.csv`);
    const factoryResult = ingestFactory(context, SOURCE, {
      destFilename: filename,
      transformFunction: transform,
    })
    
    if (factoryResult.isErr()) {
      logger.error(context, TAG, `Error generating ingest function for file ${srcKey}.`)
  
      return err(factoryResult.error)
    }
  
    const ingestFunction = factoryResult.value;
    const ingestResult = await ingestFunction(context, srcKey)
  
    return ingestResult
  
  }

  try {
        
    const HL7IngestResult = await getIngestResult('_normalized', transformHL7)
    const errorIngestResult = await getIngestResult('_errors', transformErrors)

    if (HL7IngestResult.isErr()) {   
      logger.error(context, TAG, `Failed to create referral CSV file for ${srcKey}.`)
      
      return err(ErrCode.EXCEPTION)
    }
    else if (errorIngestResult.isErr()) {
      logger.error(context, TAG, `Error generating error log report for file ${srcKey}.`)
      
      return err(ErrCode.EXCEPTION)
    }

    return ok(HL7IngestResult.value)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  ingestHL7,
}