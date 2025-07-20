import { Readable } from 'node:stream'
import { err, ok, Result } from 'neverthrow'
import { Parse } from 'unzipper'
import { parse } from 'csv-parse'
import { transform } from 'stream-transform'
import stringify = require('csv-stringify')

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { IConfig as IDomainConfig } from '../../config'
import { createReadStream as createS3ReadStream } from '../s3'
import { getDestinations, upload, UploadResult } from '../upload'

const _WHITELISTED_MEMBER_IDS = require('../../../data/elevance-whitelist.json')

const MTAG = [ 'ops', 'data', 'elevance' ]

const _MEDICAL_PLAN_HEADER_COL = 'MEDICAL_PLAN'
const _MEDICAL_PLAN_EXCLUSION_LIST: string[] = [
  'VACCDBHC',
  'VACCDBIW',
  'VACCDBRC',
  'VACCDCLW',
  'VACCDDD0',
  'VACCDEDC',
  'VACCDEHI',
  'VACCDEMC',
  'VACCDEPS',
  'VACCDFHC',
  'VACCDFIS',
  'VACCDHMC',
  'VACCDHRC',
  'VACCDICF',
  'VACCDLHC',
  'VACCDLMC',
  'VACCDLTH',
  'VACCDNMC',
  'VACCDNWC',
  'VACCDPHC',
  'VACCDPRC',
  'VACCDSNF',
  'VACCDTEC',
  'VACCDUTC',
  'VACCDVSB',
  'VACCDVSP',
  'VACCDWHC',
  'VACCDWMC',
  'VACCDWRC',
  'VACCLDHI',
  'VACCLDMO',
  'VACDBHVH',
  'VACDBHVM',
  'VACDCNH1',
  'VACDCNL1',
  'VACDCNM1',
  'VACDDFH1',
  'VACDEDHC',
  'VACDEDHI',
  'VACDEIH1',
  'VACDEIL1',
  'VACDEIM1',
  'VACDEPH1',
  'VACDFCHC',
  'VACDFCL1',
  'VACDFCM1',
  'VACDFFH1',
  'VACDFFL1',
  'VACDFFM1',
  'VACDHPH1',
  'VACDHPL1',
  'VACDHPM1',
  'VACDHSH1',
  'VACDHSL1',
  'VACDHSM1',
  'VACDMDH1',
  'VACDMDL1',
  'VACDMDM1',
  'VACDNOWH',
  'VACDNOWM',
  'VACDNUTC',
  'VACDPHHI',
  'VACDPHMO',
  'VACDPWH1',
  'VACDPWL1',
  'VACDPWM1',
  'VACDSEH1',
  'VACDSEL1',
  'VACDSEM1',
  'VACDSMH1',
  'VACDSML1',
  'VACDSMM1',
  'VACDSSH1',
  'VACDSSL1',
  'VACDSSM1',
  'VACDVVH1',
  'VACFDHI0',
  'VACFDMOD',
  'VACMNDHI',
  'VACMNDMO',
  'VADCEHMO',
  'VADCEHRH',
  'VADCVDR1',
  'VADCVDR2'  
]
const _MEMBER_ID_COLUMN = 'SUBSCRIBER_MEMBER_ID'

/**
 * Filter eligibility records where 'MEDICAL_PLAN' is in an exclusion list.
 * 
 * @param context 
 * @param data 
 * @returns 
 */
function filterEligibility(context: IContext, data: Readable): Result<Readable, ErrCode> {
  const { logger } = context
  const TAG = [ ...MTAG, 'filterEligibility' ]

  try {
    const transformer = transform(function(data) {
      if (data.info.error) {
        logger.info(context, TAG, 'Skipping record.', {
          record: data.record,
          info: data.info,
        })

        return null
      }

      const medicalPlan = data.record[_MEDICAL_PLAN_HEADER_COL]
      const memberId = data.record[_MEMBER_ID_COLUMN]

      if (
        _MEDICAL_PLAN_EXCLUSION_LIST.includes(medicalPlan) &&
        !_WHITELISTED_MEMBER_IDS.includes(memberId)
      ) {
        logger.info(context, TAG, 'Filtering record.', {
          record: data.record,
        })

        return null
      }
      return data.record
    })

    var parser = parse({ 
      delimiter: '|', 
      columns: true, 
      skipRecordsWithError: true, 
      relaxColumnCount: true, 
      info: true 
    })

    const stringifier = stringify({
      delimiter: '|',
      header: true,
    })  

    return ok(data.pipe(parser).pipe(transformer).pipe(stringifier))
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

interface NextObjectEntity {
  stream: Readable,
  path: string,
  isZipEntry: boolean,
}

/**
 * nextObjectEntry - Helper to work with zip's or vanilla objects. 
 * Yields each entry in the ZIP if the s3Key ends in '.zip' (could test but its a stream),
 * otherwise just yields the S3 object stream.
 * 
 * Note: Probalby should refactor this somewhere.
 * 
 * @param context 
 * @param srcKey 
 * @param s3FileStream 
 */
async function *nextObjectEntity(context: IContext, srcKey: string, s3FileStream: Readable) {
  const { logger } = context
  const TAG = [ ...MTAG, 'nextObjectEntry' ]

  try {
    const filename = (srcKey.split('/').pop() as string)

    if (filename.endsWith('.zip')) {
      const zip = s3FileStream.pipe(Parse({ forceStream: true }))

      for await (const entry of zip) {
        yield ok({
          stream: entry,
          path: entry.path,
          isZipEntry: true,
        })
      }
    }
    else {
      yield ok({
        stream: s3FileStream,
        path: srcKey,
        isZipEntry: false,
      })
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    yield err(ErrCode.EXCEPTION)
  }
}

export interface IngestResult {
  srcS3Bucket: string,
  srcS3Key: string,
  uploadResults: UploadResult[]
}
  
export async function ingest(context: IContext, srcKey: string): Promise<Result<IngestResult, ErrCode>> {
  const { logger, aws: { s3Client }, config } = context;
  const domainConfig = context.domainConfig as IDomainConfig
  const TAG = [ ...MTAG, 'ingest' ]
  
  try {
    if (!config.isProduction) {
      logger.error(context, TAG, 'Only supported in production.')
  
      return err(ErrCode.NOT_IMPLEMENTED)
    }

    const srcBucket = config.ops_cdk?.data?.destBuckets?.externalData?.name
  
    const opsData = domainConfig?.ops?.data?.elevance
  
    if (!opsData || !srcBucket) {
      logger.error(context, TAG, 'Ops data config NOT found!')
 
      return err(ErrCode.INVALID_CONFIG)
    }

    const s3ReadStreamResult = await createS3ReadStream(context, srcBucket, srcKey)

    if (s3ReadStreamResult.isErr()) {
      logger.error(context, TAG, 'Error create s3 source stream.', {
        opsData,
      })

      return err(s3ReadStreamResult.error)
    }

    const s3ReadStream = s3ReadStreamResult.value

    const uploadResults: UploadResult[] = []

    for await (const nextEntityResult of nextObjectEntity(context, srcKey, s3ReadStream)) {
      if (nextEntityResult.isErr()) {
        logger.error(context, TAG, 'Error getting next s3 Object entity.', {
          srcKey,
          error: nextEntityResult.error,
        })

        return err(ErrCode.SERVICE)
      }

      const {
        stream: entityStream,
        path: entityPath,
      } = nextEntityResult.value

      const filterEligibilityResult = filterEligibility(context, entityStream)
  
      if (filterEligibilityResult.isErr()) {
        logger.error(context, TAG, 'Error filtering stream.', {
          error: filterEligibilityResult.error
        })

        return err(filterEligibilityResult.error)
      }

      const filtered = filterEligibilityResult.value

      const filename = (entityPath.split('/').pop() as string)

      const getDestinationsResult = getDestinations(context, filename, opsData)
  
      if (getDestinationsResult.isErr()) {
        logger.error(context, TAG, 'Error getting upload destinations.', {
          srcKey,
        })
  
        return err(ErrCode.INVALID_CONFIG)
      }

      const dests = getDestinationsResult.value
  
      const uploadResult = await upload(context, filename, filtered, dests)
  
      if (uploadResult.isErr()) {
        logger.error(context, TAG, 'Error uploading to s3.', {
          error: uploadResult.error
        })
  
        return err(uploadResult.error)
      }

      uploadResults.push(...uploadResult.value)
    }
    return ok({
      srcS3Bucket: srcBucket,
      srcS3Key: srcKey,
      uploadResults,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)
  
    return err(ErrCode.EXCEPTION)
  }
}
  
export default {
  ingest,
}