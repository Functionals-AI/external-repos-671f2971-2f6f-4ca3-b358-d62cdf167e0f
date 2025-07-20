import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import { err, ok, Result } from 'neverthrow'
import { GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3'


import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'

const MTAG = [ 'ops', 'data', 's3' ]

/**
 * @typedef {Object} S3ObjectMetaData - S3 Object meta-data. Note:
 * 
 * @property bucket - S3 bucket
 * @property key - S3 object key
 * @property size - Size in bytes.
 * @property etag - S3 E-Tag. Use caution. Consult the docs.. E-Tags are different
 *                  when multi-part uploads are performed vs. otherwise. See the
 *                  "hash" property.
 * @property versionId - S3 version ID.
 * @property sequencer - S3 sequencer.
 * @property hash - MD5 checksum.
 */
export interface S3ObjectMetaData {
  bucket: string,
  key: string,
  size?: number,
  etag?: string,
  lastModified?: Date,
  versionId?: string,
  hash: string,
}

/**
 * Compute object metadata, which includes:
 * 
 */
export async function getObjectMetaData(context: IContext, s3Bucket: string, s3Key: string): Promise<Result<S3ObjectMetaData, ErrCode>> {
  const { logger, aws: { s3Client } } = context
  const TAG = [ ...MTAG, 'getObjectMetaData' ]

  try {
    let getS3ObjectResult: GetObjectCommandOutput

    try {
      //
      // Get the object and compute the hash.
      //
      const getS3ObjectCommand = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key,
      })

      getS3ObjectResult = await s3Client.send(getS3ObjectCommand)
    }
    catch (e) {
      logger.error(context, TAG, 'S3 Object not found.', {
        s3Bucket,
        s3Key,
      })

      return err(ErrCode.NOT_FOUND)
    }

    if (getS3ObjectResult === undefined) {
      logger.error(context, TAG, 'Unable to get S3 Object.', {
        s3Bucket,
        s3Key,
      })

      return err(ErrCode.SERVICE)
    }

    const s3Hash: string = await new Promise((resolve, reject) => {
      const hash = createHash('md5')
      const readable = getS3ObjectResult.Body as Readable

      readable.pipe(hash).on('finish', () => {
        resolve(hash.read().toString('hex'))
      }).on('error', e => reject(e))
    })

    return ok({
      bucket: s3Bucket,
      key: s3Key,
      ...(getS3ObjectResult.ContentLength !== undefined && { size: getS3ObjectResult.ContentLength }),
      ...(getS3ObjectResult.ETag !== undefined && { etag: getS3ObjectResult.ETag }),
      ...(getS3ObjectResult.LastModified !== undefined && { lastModified: getS3ObjectResult.LastModified }),
      ...(getS3ObjectResult.VersionId !== undefined && { versionId: getS3ObjectResult.VersionId }),
      hash: s3Hash,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface CreateReadStreamOptions {
  encoding?: 'utf8'
}

export async function createReadStream(context: IContext, s3Bucket: string, s3Key: string, options?: CreateReadStreamOptions): Promise<Result<Readable, ErrCode>> {
  const { logger, aws: { s3Client } } = context
  const TAG = [ ...MTAG, 'createReadStream' ]

  try {
    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
    })
      
    const item = await s3Client.send(command);
      
    if (item.Body === undefined || !(item.Body instanceof Readable)) {
      logger.error(context, TAG, `no response from s3`)
  
      return err(ErrCode.SERVICE)
    }

    const readable = item.Body

    if (options?.encoding) {
      readable.setEncoding(options.encoding)
    }
  
    return ok(readable)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default { 
  getObjectMetaData,
  createReadStream,
}