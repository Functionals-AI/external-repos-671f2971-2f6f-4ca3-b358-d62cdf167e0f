import { errorMonitor, EventEmitter } from 'node:events'
import { PassThrough, Readable } from 'node:stream'
import { Upload } from '@aws-sdk/lib-storage'
import { err, ok, Result } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { IOpsDataInbound, IOpsDataInboundOnly, IOpsDataInboundOutbound, IOpsDataS3Dest, OpsDataDestS3BucketType } from '../config'

const MTAG = [ 'ops', 'data', 'upload' ]

function getAsIOpsDataInbound(
  opsData: IOpsDataInboundOnly | IOpsDataInboundOutbound

): IOpsDataInbound | undefined {
  if (opsData.hasOwnProperty('inbound')) {
    return (opsData as IOpsDataInboundOutbound).inbound
  }

  return opsData as IOpsDataInboundOnly
}

export function getDestinations(
  context: IContext,
  filename: string,
  opsData: IOpsDataInboundOnly | IOpsDataInboundOutbound
): Result<IOpsDataS3Dest[], ErrCode> {
    const { logger } = context
    const TAG = [ ...MTAG, 'getEntryDestinations' ]
  
    try {
      const inbound = getAsIOpsDataInbound(opsData)

      if (!inbound) {
        logger.error(context, TAG, 'Inbound config not found in ops data.')

        return err(ErrCode.INVALID_CONFIG)
      }

      const dests = Array.isArray(inbound.dest) ? inbound.dest : [ inbound.dest ]
      const result: IOpsDataS3Dest[] = []
  
      for (const dest of dests) {
        const prefixMatch = Array.isArray(dest.filePrefixes) ? dest.filePrefixes.filter(p => filename.startsWith(p)).length > 0 : true
        const suffixMatch = Array.isArray(dest.fileSuffixes) ? dest.fileSuffixes.filter(s => filename.endsWith(s)).length > 0 : true
        const reMatch = Array.isArray(dest.fileRegexes) ? dest.fileRegexes.filter(r => filename.match(r)).length > 0 : true
  
        if (prefixMatch && suffixMatch && reMatch) {
          result.push(dest)
        }
      }
      return ok(result)
    }
    catch (e) {
      logger.exception(context, TAG, e)    
  
      return err(ErrCode.EXCEPTION)
    }
  }

export interface UploadResult {
    filename: string,
    destBucket: string,
    destKey: string,
  }
  
export async function upload(context: IContext, filename: string, stream: Readable, dests: IOpsDataS3Dest[]): Promise<Result<UploadResult[], ErrCode>> {
    const { logger, aws: { s3Client }, config } = context
    const TAG = [ ...MTAG, 'upload' ]
  
    try {
      const uploads: { upload: Upload, result: UploadResult }[] = []
      const streams = dests.map(d => dests.length ? stream.pipe(new PassThrough()) : stream)
  
      for (const dest of dests) {
        const destBucket = dest.s3BucketType === OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET ?
          config.ops_cdk.data?.destBuckets.eligibilityReady.name :
          config.ops_cdk.data?.destBuckets.externalData.name
    
        if (!destBucket) {
          logger.error(context, TAG, 'Dest bucket not in config, skipping....')
        }
        else {
          const destKeyPrefix = dest.prefix ? `${dest.prefix.replace(/\/$/, '')}/` : ''
          const destKey = `${destKeyPrefix}${filename}`
    
          logger.info(context, TAG, `Uploading.`, {
            filename,
            destBucket,
            destKey,
          })
  
          const destUpload = new Upload({
            client: s3Client,
            params: {
              Bucket: destBucket,
              Key: destKey,
              Body: streams.shift()
            },
            partSize: 1024 * 1024 * 50,
            leavePartsOnError: false,
          })

          Upload.prototype.on.call(destUpload, errorMonitor, (error) => {
            logger.error(context, TAG, 'Error on upload.', {
              filename,
              destBucket,
              destKey,
              error,
            })
          })

          destUpload.on('httpUploadProgress', (progress) => {
            logger.info(context, TAG, 'Upload progress.', {
              progress,
            })  
          })
  
          uploads.push({ upload: destUpload, result: { filename, destBucket, destKey}})
        }
      }

      logger.debug(context, TAG, 'Waiting on upload completion.')

      await Promise.all(uploads.map(u => u.upload.done()))

      logger.info(context, TAG, 'Uploads complete.', {
        filename,
        dests,
      })

      return ok(uploads.map(u => u.result))
    }
    catch (e) {
      logger.exception(context, TAG, e)
  
      return err(ErrCode.EXCEPTION)
    }
  }

  export default {
    getDestinations,
    upload,
  }