/**
 * Ingest factory: Handles 99% of cases which are simply:
 * 
 *   pipeline = <s3 read>[.pipe(pgp decrypt)][.pipe(transform)]
 *   await upload(pipeline)
 */

import { Readable } from 'node:stream'
import { err, ok, Result } from 'neverthrow'
import { PartialConfig as OpenpgpPartialConfig } from 'openpgp'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from "@mono/common/lib/error"
import { IConfig as IDomainConfig, IOpsDataInboundOnly, IOpsDataInboundOutbound, IOpsDataInboundSource, OpsDataSourceType } from '../config'
import { createReadStream as createS3ReadStream } from './s3'
import { decryptStream } from './pgp'
import { getDestinations, upload, UploadResult } from './upload'

export type TransformFunction = (context: IContext, data: Readable) => Result<Readable, ErrCode>

export interface IngestFactoryOptions {
  destFilename?: string,
  transformFunction?: TransformFunction,
  openpgpConfig?: OpenpgpPartialConfig
}

export interface IngestResult {
  srcS3Bucket: string,
  srcS3Key: string,
  uploadResults: UploadResult[]
}

export type IngestFunction = (context: IContext, srcKey: string) => Promise<Result<IngestResult, ErrCode>>

function getIOpsDataInboundSource(
  opsData: IOpsDataInboundOnly | IOpsDataInboundOutbound
): Result<IOpsDataInboundSource, ErrCode> {
  let iopsSource: IOpsDataInboundSource | undefined
  
  if (opsData.hasOwnProperty('inbound') === true) {
    iopsSource = (opsData as IOpsDataInboundOutbound).inbound?.src
  } else {
    iopsSource = (opsData as IOpsDataInboundOnly).src
  }

  if (!iopsSource) {
    return err(ErrCode.INVALID_CONFIG)
  }

  return ok(iopsSource)
}

export default function factory(context: IContext, source: string, options?: IngestFactoryOptions): Result<IngestFunction, ErrCode> {
  const { config, logger } = context
  const MTAG = [ 'ops', 'data', source ]
  const TAG = [ ...MTAG, 'ingest', 'factory' ]
  const domainConfig = context.domainConfig as IDomainConfig
  const opsData = domainConfig?.ops?.data ? domainConfig.ops.data[source] : undefined

  if (false && !config.isProduction) {
    logger.error(context, TAG, 'Only supported in production.')

    return err(ErrCode.NOT_IMPLEMENTED)
  }
  if (!opsData) {
    logger.error(context, TAG, 'Ops data config NOT found!')

    return err(ErrCode.INVALID_CONFIG)
  }

  const iopsSourceResult = getIOpsDataInboundSource(opsData)
  if (iopsSourceResult.isErr()) {
    logger.error(context, TAG, 'Ops data config does NOT define source!')

    return err(iopsSourceResult.error)
  }

  const iopsSource = iopsSourceResult.value
  const srcBucket = (iopsSource.type === OpsDataSourceType.INTERNAL_SFTP) ? 
    config?.ops_cdk?.sftp?.sftpArchiveBucket?.name :
    config?.ops_cdk?.data?.destBuckets?.externalData?.name

  if (!srcBucket) {
    logger.error(context, TAG, 'Ops data config does NOT define src. bucket!')

    return err(ErrCode.INVALID_CONFIG)
  }

  const ingest = async function (context: IContext, srcKey: string): Promise<Result<IngestResult, ErrCode>> {
    const { logger, config } = context;
    const TAG = [ ...MTAG, 'ingest' ]

    try {
      const isEncrypted = iopsSource.encrypted !== false
      const isArmored = iopsSource.isArmored === true
      const s3ReadStreamResult = await createS3ReadStream(
        context, 
        srcBucket, 
        srcKey,
        isEncrypted && iopsSource.isArmored ? { encoding: 'utf8' } : undefined
      )
  
      if (s3ReadStreamResult.isErr()) {
        logger.error(context, TAG, 'Error create s3 source stream.', {
          srcBucket,
          srcKey,
        })
  
        return err(s3ReadStreamResult.error)
      }
  
      const s3ReadStream = s3ReadStreamResult.value

      let pipeline = s3ReadStream

      const hasPGPConfig = opsData.pgp !== undefined

      logger.debug(context, TAG, 'Is encrypted?', {
        isEncrypted,
        hasPGPConfig,
      })

      if (isEncrypted && opsData.pgp) {
        const decryptStreamResult = await decryptStream(
          context, 
          s3ReadStream,
          {
            ...opsData.pgp,
            isArmored,
          }, 
          options?.openpgpConfig
        )
  
        if (decryptStreamResult.isErr()) {
          logger.error(context, TAG, 'Error creating decrypt streawm.', {
            opsData,
          })
  
          return err(decryptStreamResult.error)
        }
  
        pipeline = decryptStreamResult.value
      }
      
      if (options?.transformFunction) {
        const transformStreamResult = options.transformFunction(context, pipeline)
  
        if (transformStreamResult.isErr()) {
          logger.error(context, TAG, 'Error generating transform stream.', {
            error: transformStreamResult.error
          })
  
          return err(transformStreamResult.error)
        }
  
        pipeline = transformStreamResult.value
      }
  
      const filename = options?.destFilename ? options.destFilename : (srcKey.split('/').pop() as string)
  
      const getDestinationsResult = getDestinations(context, filename, opsData)
  
      if (getDestinationsResult.isErr()) {
        logger.error(context, TAG, 'Error getting upload destinations.', {
          srcKey,
        })
  
        return err(ErrCode.INVALID_CONFIG)
      }
  
      const dests = getDestinationsResult.value
  
      const uploadResult = await upload(context, filename, pipeline, dests)
  
      if (uploadResult.isErr()) {
        logger.error(context, TAG, 'Error uploading to s3.', {
          error: uploadResult.error
        })
  
        return err(uploadResult.error)
      }
  
      return ok({
        srcS3Bucket: srcBucket,
        srcS3Key: srcKey,
        uploadResults: uploadResult.value
      })
    }
    catch (e) {
      logger.exception(context, TAG, e)
  
      return err(ErrCode.EXCEPTION)
    }
  }

  return ok(ingest)
}