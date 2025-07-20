import { Result } from 'neverthrow'

import { ClientDataConfig, OpsDataSourceType, OpsDataDestType, OpsDataDestS3BucketType, fetch } from './base'
import { IConfig } from './'

const config: IConfig = {
  get isProduction() { return false },
  get isStaging() { return true },
  get isDevelopment() { return false },
  get isDevenv() { return false },
  env: 'staging',
  aws: {
    accountId: '288831299874',
    region: 'us-west-2',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:288831299874:secret:mono/common-6e0utY'
  },
  ops: {
  }
}

const clientDataConfigs: ClientDataConfig[] = [
  {
    client: 'aah',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:288831299874:secret:mono/ops.data.aah-SRa4Ke',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_DATA_BUCKET,
        externalDataBucketPrefix: 'aah/test/input/',
        encrypted: true,
        isArmored: false,
      },
      pgp: {
        privateKey: 'sm::base64::ops.data.aah.pgp.secret_key',
        passphrase: 'sm::ops.data.aah.pgp.passphrase',
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'aah/test/output/',
        }
      ]
    },
  },
  {
    client: 'brmc',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'brmc/inbound/',
        encrypted: false,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'brmc/',
          filePrefixes: ['FoodSmart_Eligibility_BRMC'],
          fileSuffixes: ['.csv']
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'brmc/'
        }
      ]
    }
  },
  {
    client: 'molina-il',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_DATA_BUCKET,
        externalDataBucketPrefix: 'molina/test/input/',
        encrypted: false,
      },
      dest: [
        {  
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'molina/test/output/',
        },
        {  
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'molina/',
        },
      ]
    }
  }
]

//
// Generate the fetch method which results  in building a series of resolved configs.
//
const fetcher = fetch(config, clientDataConfigs)
    
export default {
  fetch: fetcher,
}
