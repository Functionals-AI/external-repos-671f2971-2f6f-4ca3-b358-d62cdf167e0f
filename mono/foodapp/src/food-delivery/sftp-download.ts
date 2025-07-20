import { err, ok, Result } from 'neverthrow'
import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import * as SFTPClient from 'ssh2-sftp-client'
import Logger from '@mono/common/lib/logger'

const MTAG = Logger.tag()

async function downloadDir(context: IContext, dir: string, dstDir: string): Promise<Result<string[], ErrCode>> {
  const TAG = [...MTAG, 'downloadSftpOutDir']
  const { config, logger } = context

  try {
    const client = new SFTPClient()

    await client.connect(config.foodapp?.foodVendor.umoja.sftp)

    async function download(): Promise<string[]> {
      return new Promise((resolve, reject) => {
        try {
          const downloaded: string[] = []

          client.on('download', (info: { source: string, destination: string }) => {
            logger.info(context, TAG, 'Downloaded...', info)
            downloaded.push(info.destination)
          })

          client.on('end', () => resolve(downloaded))

          client.downloadDir(dir, dstDir).then(() => client.end())
        }
        catch (e) {
          reject(e)
        }
      })
    }

    const downloaded = await download()

    return ok(downloaded)
  }
  catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  downloadDir
}