import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { err, ok, Result } from 'neverthrow'
import * as openpgp from 'openpgp'
import s3 from './s3'
import {
  IConfig as IDomainConfig,
  IOpsDataInboundOutbound,
  IOpsDataOutbound,
  IPGPConfig,
  OpsDataDestType
} from '../config'
import { PassThrough, Readable } from 'stream'
import { uploadToSFTP } from './sftp'

export interface UploadOutboundFileDetails {
  bucket: string
  key: string

  source: string
}

async function encryptFileStream(inputStream: Readable, pgpConfig: IPGPConfig): Promise<Readable> {
  try {
    const publicKey = await openpgp.readKey({ armoredKey: pgpConfig.privateKey })

    const encryptedStream = new PassThrough()

    const encryptionResult = await openpgp.encrypt({
      message: await openpgp.createMessage({ binary: inputStream }),
      encryptionKeys: publicKey,
      format: 'binary',
    })

    // Ensure encryption result is a readable stream and pipe it
    const encryptedBinaryStream = encryptionResult as unknown as Readable
    encryptedBinaryStream.pipe(encryptedStream)

    return encryptedStream
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`)
  }
}

function getDestination(
  context: IContext,
  config: IOpsDataInboundOutbound,
  details: UploadOutboundFileDetails
): Result<IOpsDataOutbound, ErrCode> {
  const { logger } = context
  const TAG = ['ops', 'data', 'upload-outbound-file', 'getTaskDest']

  if (config.outbound === undefined) {
    logger.error(context, TAG, 'Outbound destination config NOT found!', details)
    return err(ErrCode.INVALID_CONFIG)
  }

  const destinations = Array.isArray(config.outbound) ? config.outbound : [config.outbound]

  let destination: IOpsDataOutbound | undefined
  destinations.forEach((dest) => {
    if (details.key.startsWith(dest.src.externalDataBucketPrefix)) {
      if (!destination) {
        destination = dest
      } else {
        if (destination.src.externalDataBucketPrefix.length < dest.src.externalDataBucketPrefix.length) {
          destination = dest
        }
      }
    }
  })

  if (!destination) {
    logger.error(context, TAG, "No destinations found for source/prefix pair.", details)
    return err(ErrCode.INVALID_CONFIG)
  }

  return ok(destination)
}

export async function uploadOutboundFile(
  context: IContext,
  details: UploadOutboundFileDetails
): Promise<Result<undefined, ErrCode>> {
  const { logger } = context
  const TAG = ['ops', 'data', 'upload-outbound-file', 'uploadOutboundFile']

  const opsConfigData = (context.domainConfig as IDomainConfig)?.ops?.data

  if (!opsConfigData) {
    logger.error(context, TAG, 'Ops config NOT found!')
    return err(ErrCode.INVALID_CONFIG)
  }

  let config = opsConfigData[details.source]

  if (!config) {
    logger.error(context, TAG, 'Ops config NOT found!', {
      details,
    })
    return err(ErrCode.INVALID_CONFIG)
  } else if (config.hasOwnProperty('outbound') === false) {
    logger.error(context, TAG, 'Expected IOpsDataInboundOutbound config, got IOpsDataInboundOnly.', {
      details,
    })
    return err(ErrCode.INVALID_CONFIG)
  }

  config = config as IOpsDataInboundOutbound
  const destResult = getDestination(context, config, details)
  if (destResult.isErr()) {
    logger.error(context, TAG, 'Failed to get destination', {
      details,
      error: destResult.error,
    })

    return err(destResult.error)
  }

  // `anySuccess` tracks that there was at least 1 successful upload.
  //
  // In most cases it won't matter, either it was successful and errCode is null
  // or errCode is set, but if there were no errors and no sftp based destinations
  // then we want to error out. That's not a super set business requirement but
  // untill we have a better understanding of other destinations types it will
  // have to be good enough.
  //
  // There are several checks for `if (!success) return err(errCode)` which should
  // just fails the flow if there are no successful writes yet, but if we have
  // had a success we should just log and skip the destination.
  // This isn't great but hopefully it then becomes
  // "dig through logs for the single failure and write that" or "re-run the flow" instead of
  // "dig through logs for the successes, figure out which were missing and then write those".
  let anySuccess: boolean = false

  let errCode: ErrCode | null = null
  const destination = destResult.value
  const dests = Array.isArray(destination.dest) ? destination.dest : [destination.dest]

  for (const dest of dests) {
    const s3Stream = await s3.createReadStream(context, details.bucket, details.key)
    if (s3Stream.isErr()) {
      logger.error(context, TAG, 'Failed to fetch file from S3', {
        details,
        error: s3Stream.error,
      })

      if (!anySuccess) {
        return err(s3Stream.error)
      }

      errCode = s3Stream.error
      continue
    }

    // `pop` will never return undefined here so cast it straight to string
    let outputFilename = details.key.split('/').pop() as string

    let fileStream: Readable = s3Stream.value

    // Encrypt file if needed
    if (dest.type === OpsDataDestType.EXTERNAL_SFTP && dest.encrypted) {
      if (!config.pgp) {
        logger.error(context, TAG, 'PGP config missing for encryption', {
          details,
          host: dest.sftp?.host,
        })

        if (!anySuccess) {
          return err(ErrCode.INVALID_CONFIG)
        }

        errCode = ErrCode.INVALID_CONFIG
        continue
      }

      // Replace the s3 fileStream with the encrypted fileStream
      fileStream = await encryptFileStream(fileStream, config.pgp)
    }

    if (dest.type === OpsDataDestType.EXTERNAL_SFTP) {
      if (!dest.sftp) {
        logger.error(context, TAG, 'SFTP config missing for upload', {
          details,
        })

        if (!anySuccess) {
          return err(ErrCode.INVALID_CONFIG)
        }

        errCode = ErrCode.INVALID_CONFIG
        continue
      }

      const result = await uploadToSFTP(context, dest.sftp, fileStream, outputFilename, dest.remotePath)

      if (result.isOk()) {
        logger.info(context, TAG, 'Uploaded file to sftp', {
          details,
          host: dest.sftp?.host,
        })

        anySuccess = true
      } else {
        logger.error(context, TAG, 'Failed to upload file', {
          details,
          error: result.error,
        })

        if (!anySuccess) {
          return err(result.error)
        }

        errCode = result.error
      }
    } else {
      logger.warn(context, TAG, 'Invalid destination type', {
        details,
        type: dest.type,
      })

      continue
    }
  }

  if (errCode) {
    return err(errCode)
  }

  if (!anySuccess) {
    // This should only happen if there are no sftp based destinations configured,
    // otherwise the errCode check above would have triggered.
    logger.warn(context, TAG, 'No SFTP destinations found', {
      details,
    })

    return err(ErrCode.SERVICE)
  }

  return ok(undefined)
}

export default {
  uploadOutboundFile,
}
