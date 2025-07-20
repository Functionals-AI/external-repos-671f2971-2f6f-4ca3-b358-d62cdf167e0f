import { err, ok, Result } from "neverthrow"

import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import {
  importInboundReferrals,
  ReferralImportResult,
  ReferralSources
} from "../../service"
import { csvRecordTransformFactory } from "../csv-mapper"

import { CSV_MAPPING_CONFIG } from "./csv-map-settings"
import { recordLoader } from "./record-loader"

const SOURCE = ReferralSources.SantaClara
const MTAG = [ 'ops', 'referrals', 'sources', SOURCE ]

/**
 * Ingest data from the "external data" S3 Bucket identify by the s3 Key 'srcKey'.
 * 
 * @param context 
 * @param srcKey 
 */
export async function doImport(
  context: IContext,
  srcBucket: string,
  srcKey: string,
  input: object
): Promise<Result<ReferralImportResult, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'etl' ]

  try {
    const result = await importInboundReferrals(
      context,
      srcBucket,
      srcKey,
      csvRecordTransformFactory({
        mappingConfig: CSV_MAPPING_CONFIG,
      }),
      recordLoader
    )

    if (result.isErr()) {
      logger.error(context, TAG, 'Error performing ETL.', {
        srcKey,
        error: result.error,
      })

      return err(result.error)
    }
    return ok(result.value)
  }
  catch (e) {
    logger.error(context, TAG, 'Error importing santa clara referrals into DB', {
      error: e,
      s3Bucket: srcBucket,
      s3Key: srcKey,
    })

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  doImport,
}
