import { ok, err } from 'neverthrow'
import { DateTime } from 'luxon'

import { ErrCode } from '@mono/common/lib/error'
import { succeed, task, workflow, JsonObject } from '@mono/common-flows/lib/builder'
import { Logger } from '@mono/common'
import { IConfig } from '@mono/common/lib/config'
import GoogleService from '@mono/common/lib/service/google'
import SFTPTasks from '@mono/common-flows/lib/tasks/sftp'
import { put as PutToGDriveTask } from '@mono/common-flows/lib/tasks/google/drive'
import { SFTPToS3Result } from '@mono/common-flows/lib/tasks/sftp'

const MTAG = Logger.tag()

enum State {
  SFTPGet = 'SFTPGet',
  SyncToGDrive = 'SyncToGDrive',
  Success = 'Success',
}

const DOWNLOAD_DIRS = [
  '/Out',
]

const ARCHIVE_KEY_PREFIX = 'providers/incomm/incoming'

export default workflow(function(config: IConfig) {
  return {
    cron: '0 * * * ? *',
    startAt: State.SFTPGet,
    states: {
      [State.SFTPGet]: SFTPTasks.mget({
        sftpConfig: {
          connectionConfig: config.foodcards.incomm.sftp,
          remotePath: DOWNLOAD_DIRS[0],
        },
        destBucket: config.foodcards.s3BucketName,
        destPrefix: `${ARCHIVE_KEY_PREFIX}${DOWNLOAD_DIRS[0]}/`,
        modifiedSince: DateTime.now().minus({ days: 90 }).toMillis(),
        noUpdateOnMatch: true,
        next: State.SyncToGDrive,
      }),
      [State.SyncToGDrive]: PutToGDriveTask({
        s3Bucket: config.foodcards.s3BucketName,
        s3Keys: (input) => {
          const sftpResults: SFTPToS3Result[] = input['results'] as any as SFTPToS3Result[]
          const s3ObjectKeys = sftpResults.map(r => r.destKey)

          return s3ObjectKeys
        },
        driveLocation: config.foodcards.incomm.googleDrive,
        next: State.Success,
      }),
      [State.Success]: succeed(),
    }
  }
  
})