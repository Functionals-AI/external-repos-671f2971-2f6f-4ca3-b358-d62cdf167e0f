import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { err, ok, Result } from 'neverthrow'
import InComm from '@mono/foodcards/lib/incomm'
import Logger from '@mono/common/lib/logger'
import { ScriptHandlerInput, ScriptHandlerOutput } from '@mono/common/lib/tasks/script'

const MTAG = Logger.tag()

async function sftpUpload(context: IContext, input: ScriptHandlerInput): Promise<Result<ScriptHandlerOutput, ErrCode>> {
  const TAG = [...MTAG, 'sftpUpload']
  const {logger} = context

  try {
    //
    // Input parameter should be an array containing at most ONE s3 urls.
    // Constrain to one as the result of each upload should be verified before
    // uploading the subsequent file.
    //
    if (input.length !== 1) {
      logger.error(context, TAG, `Error uploading files to InComm SFTP, one file is needed at a time`)
      return err(ErrCode.ARGUMENT_ERROR)
    }

    // TBD if s3 url regex check needed

    logger.info(context, TAG, 'Started InComm SFTP upload')
    logger.info(context, TAG, `Started sending ${input[0]} file to InComm SFTP`)

    const uploadResult = await InComm.SftpUpload.upload(context, input)

    if (uploadResult.isErr()) {
      logger.error(context, TAG, 'InComm sftp upload error', { errCode: uploadResult.error })
      return err(ErrCode.SERVICE)
    }

    const count = uploadResult.value

    logger.info(context, TAG, `Finished sending ${input} files to InComm SFTP`, {count})
    logger.info(context, TAG, 'Finished InComm SFTP upload files', {count})

    const output = {
      count,
    }

    return ok(output)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

async function sftpDownloadResponse(context: IContext, input: ScriptHandlerInput): Promise<Result<ScriptHandlerOutput, ErrCode>> {
  const TAG = [...MTAG, 'sftpDownloadResponse']
  const {logger} = context

  try {
    // input parameter should be an array containing two files' s3 url
    if (input.length !== 1) {
      logger.error(context, TAG, `Error downloading files from InComm SFTP, one file is needed at a time`)
      return err(ErrCode.EXCEPTION)
    }

    // TBD if s3 url regex check needed

    logger.info(context, TAG, 'Started InComm SFTP download')
    logger.info(context, TAG, `Started pulling ${input[0].slice(0, -4)}-R.csv file from InComm SFTP`)

    const downloadResult = await InComm.SftpDownloadResponse.sftpDownloadResponse(context, input)

    if (downloadResult.isErr()) {
      logger.error(context, TAG, 'InComm sftp download error', { errCode: downloadResult.error })
      return err(ErrCode.SERVICE)
    }

    const count = downloadResult.value

    logger.info(context, TAG, `Finished pulling ${input[0].slice(0, -4)}-R.csv file from InComm SFTP`, {count})
    logger.info(context, TAG, 'Finished InComm SFTP download file', {count})

    const output = {
      count,
    }

    return ok(output)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  sftpUpload,
  sftpDownloadResponse,
}
