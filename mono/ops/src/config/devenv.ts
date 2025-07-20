import { ok, Result } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IConfig } from './'
import { OpsDataSourceType, OpsDataDestType, OpsDataDestS3BucketType } from './base'

const config: IConfig = {
  get isProduction() { return false },
  get isStaging() { return false },
  get isDevelopment() { return false },
  get isDevenv() { return true },
  env: 'devenv',
  aws: {
    region: 'us-west-2',
    accountId: '914374131125',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/common-HZIXmP'
  },
  ops: {
    data: {
      careoregon: {
        aws: {
          region: 'us-west-2',
          accountId: '914374131125',
          secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/common-HZIXmP'
        },
        src: {
          type: OpsDataSourceType.INTERNAL_SFTP,
          sftpArchivePrefix: 'careoregon/inbound/',
          encrypted: false,
        },
        dest: [
          {
            type: OpsDataDestType.INTERNAL_S3,
            s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
            prefix: 'careoregon/',
            filePrefixes: [ 'CareOregon_FoodSmart_' ],
            fileSuffixes: [ '.csv' ]
          },
          {
            type: OpsDataDestType.INTERNAL_S3,
            s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
            prefix: 'careoregon/'
          }
        ]
      },
    }
  }
}

async function fetch(): Promise<Result<IConfig, ErrCode>> {
  return ok(config)
}
    
export default {
  fetch,
}