import { Readable } from 'stream'
import * as SFTPClient from 'ssh2-sftp-client'
import { ErrCode } from '@mono/common/lib/error'
import { ok, err, Result } from 'neverthrow'

import { ISFTPConfig } from '@mono/common/lib/config'
import { IContext } from '@mono/common/lib/context'

async function ensureRemoteDirectoryExists(
  sftp: SFTPClient,
  remotePath: string
): Promise<Result<undefined, ErrCode>> {
  try {
    await sftp.stat(remotePath) // Check if the directory exists
  } catch (error) {
    // SFTP error code 2 = "No such file"
    if (error.code === 2) {
      // the second parameter makes mkdir recursive.
      await sftp.mkdir(remotePath, true)
    } else {
      return err(ErrCode.SERVICE)
    }
  }

  return ok(undefined)
}

/***
 * Uploads a file to an SFTP server.
 * 
 * @param context - The context object.
 * @param sftpConfig - The SFTP configuration.
 * @param fileStream - The file stream to upload.
 * @param fileName - The name of the file.
 * @param remotePath - The remote path to upload the file to.
 */
export async function uploadToSFTP(
  context: IContext,
  sftpConfig: ISFTPConfig,
  fileStream: Readable,
  fileName: string,
  remotePath: string
): Promise<Result<undefined, ErrCode>> {
  const { logger } = context
  const TAG = ['ops', 'data', 'sftp', 'uploadToSFTP']

  const sftp = new SFTPClient()

  try {
    const connectConfig: any = {
      host: sftpConfig.host,
      port: sftpConfig.port || 22,
      username: sftpConfig.username,
    }

    connectConfig.privateKey = sftpConfig.privateKey
    connectConfig.password = sftpConfig.password
    if (!connectConfig.privateKey && !connectConfig.password) {
      logger.error(context, TAG, 'No private key or password provided for SFTP connection.', {
        host: sftpConfig.host,
        username: sftpConfig.username,
      })
      return err(ErrCode.INVALID_CONFIG)
    }

    await sftp.connect(connectConfig)

    // Ensure the remote directory exists
    const directoryResult = await ensureRemoteDirectoryExists(sftp, remotePath)

    if (directoryResult.isErr()) {
      return directoryResult
    }

    // Remove any trailing slash from the pathname so that we don't end up
    // with `/path//filename` when concatenating the path and filename.
    remotePath = remotePath?.replace(/\/$/, '') ?? ''

    await sftp.put(fileStream, `${remotePath}/${fileName}`)
    await sftp.end()

    return ok(undefined)
  } catch (error) {
    await sftp.end()
    return err(ErrCode.SERVICE)
  }
}

export default {
  uploadToSFTP,
}
