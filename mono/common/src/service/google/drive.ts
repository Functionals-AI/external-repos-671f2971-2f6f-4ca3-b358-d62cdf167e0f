import { Readable } from 'node:stream'

import { IContext } from '../../context'
import { ErrCode } from '../../error'
import Logger from '../../logger'
import { err, ok, Result } from 'neverthrow'

import { GetObjectCommand } from '@aws-sdk/client-s3'
import { drive_v3 } from 'googleapis'

const MTAG = Logger.tag()

export interface DriveLocation {
  sharedDriveFolderId: string,
  folderId: string,
}

export interface FileExistsInDriveResult {
  exists: boolean,
  fileId?: string,
}

export interface SingleFile {
  fileName: string | null | undefined,
  fileId: string | null | undefined,
}

export type ListFilesResult = SingleFile[]

async function fileExistsInDrive(context: IContext, name: string, driveLocation: DriveLocation): Promise<Result<FileExistsInDriveResult, ErrCode>> {
  const { logger, google: { drive } } = context
  const { sharedDriveFolderId: driveId, folderId } = driveLocation
  const TAG = [ ...MTAG, 'fileExistsInDrive' ]

  try {
    const res = await drive.files.list({
      q: `parents in '${folderId}' and name='${name}'`,
      spaces: 'drive',
      driveId,
      corpora: 'drive',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    })
  
    if (res.data.files) {
      for (let file of res.data.files) {
        logger.debug(context, TAG, 'Existing file.', file)
      }
      if (res.data.files.length > 0) {
        const fileId = (res.data.files[0].id as string)

        return ok({
          exists: true,
          fileId,
        })
      }
    }
    return ok({ exists: false })
  }
  catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
  return err(ErrCode.SERVICE)
}

async function uploadToDriveFolder(context: IContext, filename: string, body: Readable, driveLocation: DriveLocation, existsInDrive: FileExistsInDriveResult): Promise<Result<drive_v3.Schema$File, ErrCode>> {
  const { logger, google: { drive } } = context
  const { sharedDriveFolderId: driveId, folderId } = driveLocation
  const TAG = [ ...MTAG, 'uploadToDriveFolder' ]

  if (existsInDrive.exists) {
    try {
      const fileId = (existsInDrive.fileId as string)

      logger.debug(context, TAG, 'Updating file in GDrive.', {
        filename,
        fileId,
      })

      const res = await drive.files.update({
        fileId,
        media: {
          mimeType: 'text/plain',
          body,
        },
        supportsAllDrives: true,
      })

      if (res.status === 200 && res.data) {
        return ok(res.data)
      }
      logger.error(context, TAG, 'File update error.', {
        filename,
        status: res.status,
        status_text: res.statusText,
      })
    }
    catch (e) {
      logger.exception(context, TAG, e, {
        filename,
        shared_drive_folder_id: driveId,
        drive_folder_id: folderId,
      })
    }
  }
  else {
    try {
      const res = await drive.files.create({
        requestBody: {
          driveId,
          name: filename,
          parents: [ folderId ],
        },
        media: {
          mimeType: 'text/plain',
          body,
        },
        supportsAllDrives: true,
      })

      if (res.status === 200 && res.data) {
        logger.debug(context, TAG, 'File uploaded to drive.', {
          driveId,
          folderId,
          filename
        })
        return ok(res.data)
      }
      logger.error(context, TAG, 'File create error.', {
        filename,
        status: res.status,
        status_text: res.statusText
      })
    }
    catch (e) {
      logger.exception(context, TAG, e, {
        filename,
        shared_drive_folder_id: driveId,
        drive_folder_id: folderId,
      })
    }
  }
  return err(ErrCode.UPLOAD_TO_S3_ERROR)
}

export async function syncS3BucketToDriveFolder(context: IContext, s3Bucket: string, s3ObjectKeys: string[], driveLocation: DriveLocation): Promise<Result<number, ErrCode>> {
  const { aws: { s3Client }, logger } = context
  const TAG = [ ...MTAG, 'syncS3BucketToDriveFolder' ]

  let uploadSuccessCount = 0
  let uploadErrCount = 0
  let errCount = 0

  try {
    for (let s3ObjectKey of s3ObjectKeys) {
      const command = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: s3ObjectKey,
      })
        
      const item = await s3Client.send(command);
        
      if (item.Body === undefined || !(item.Body instanceof Readable)) {
        logger.error(context, TAG, `no response from s3`)
    
        return err(ErrCode.SERVICE)
      }
  
      const readable = item.Body
  
      const filename = (s3ObjectKey.split('/').pop() as string)
      const existsInDriveResult = await fileExistsInDrive(context, filename, driveLocation)

      if (existsInDriveResult.isErr()) {
        //
        // Test for existence failed.
        //
        logger.error(context, TAG, 'Error testing for existence in GDrive.')

        errCount++
      }
      else {
        const existsInDrive = existsInDriveResult.value
        const uploadResult = await uploadToDriveFolder(context, filename, readable, driveLocation, existsInDrive)

        if (uploadResult.isOk()) {
          uploadSuccessCount++
        }
        else {
          uploadErrCount++
          errCount++
        }
      }
    }

    if (errCount) {
      logger.error(context, TAG, 'Errors uploading to GDrive.', {
        errCount,
      })

      return err(ErrCode.SERVICE)
    }
    else {
      return ok(uploadSuccessCount)
    }  
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function listFiles(context: IContext, driveLocation: DriveLocation): Promise<Result<ListFilesResult, ErrCode>> {
  const { logger, google: { drive } } = context
  const { sharedDriveFolderId: driveId, folderId } = driveLocation
  const TAG = [ ...MTAG, 'listFiles' ]

  try {
    // this only retrieves files, not folders
    const res = await drive.files.list({
      q: `parents in '${folderId}' and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
      spaces: 'drive',
      driveId,
      corpora: 'drive',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    })

    const filesList: ListFilesResult = []

    if (res.data.files) {
      for (let file of res.data.files) {
        filesList.push({
          fileName: file.name,
          fileId: file.id
        })
      }
    }
    return ok(filesList)

  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function getFileContent(context: IContext, fileId: string): Promise<Result<Buffer, ErrCode>> {
  const { logger, google: { drive } } = context
  const TAG = [ ...MTAG, 'getFileContent' ]

  try {
    // this only retrieves files, not folders
    const res = await drive.files.get({
      fileId,
      supportsAllDrives: true,
      alt: 'media'
    });

    if (res.data) {
      return ok(Buffer.from(res.data as string))
    }
    return err(ErrCode.SERVICE)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function moveFileToFolder(context: IContext, fileId: string, folderId: string): Promise<Result<drive_v3.Schema$File, ErrCode>> {
  const { logger, google: { drive } } = context
  const TAG = [ ...MTAG, 'moveFileToFolder' ]

  try {
    const file = await drive.files.get({
      fileId: fileId,
      supportsAllDrives: true,
      fields: 'parents',
    });
  
    let previousParents
    if (file.data.parents) {
      previousParents = file.data.parents.join(',')
    }

    logger.info(context, TAG, `Previous Parents for file - ${fileId} is - ${previousParents}`)
  
    const updatedFile = await drive.files.update({
      fileId: fileId,
      addParents: folderId,
      removeParents: previousParents,
      supportsAllDrives: true, 
      supportsTeamDrives: true
    });

    if (updatedFile && updatedFile.status === 200) {
      return ok(updatedFile.data)
    }

    logger.error(context, TAG, 'File update error.', {
      fileId,
      status: updatedFile.status,
      status_text: updatedFile.statusText,
    })
    return err(ErrCode.SERVICE)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  syncS3BucketToDriveFolder,
}