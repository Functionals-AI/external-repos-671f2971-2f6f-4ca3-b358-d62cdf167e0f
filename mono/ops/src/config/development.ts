import { Result } from 'neverthrow'
import { ClientDataConfig, OpsDataSourceType, OpsDataDestType, OpsDataDestS3BucketType, fetch } from './base'

import { ErrCode } from '@mono/common/lib/error'
import { IConfig } from './'

const config: IConfig = {
  get isProduction() { return false },
  get isStaging() { return false },
  get isDevelopment() { return true },
  get isDevenv() { return false },
  env: 'development',
  aws: {
    region: 'us-west-2',
    accountId: '914374131125',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/common-HZIXmP'
  },
  ops: {
    data: {},
  },
}

const clientDataConfigs: ClientDataConfig[] = [
  {
    client: 'outboundsftptest',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/common-HZIXmP',
    data: {
      outbound: {
        src: {
          type: OpsDataSourceType.EXTERNAL_DATA_BUCKET,
          externalDataBucketPrefix: 'outboundsftptest/outbound/',
          encrypted: false,
        },
        dest: {
          type: OpsDataDestType.EXTERNAL_SFTP,
          sftp: {
            host: 'sftp.zipongo.com',
            port: '22',
            username: '<NEED TO SUPPLY>',
            password: '<NEED TO SUPPLY>',
          },
          remotePath: '/',
          encrypted: false,
        }
      }
    }
  },
  {
    client: 'aah',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/ops.data.aah-sGv790',
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
  /**
  {
    client: 'advancedhealth',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/ops.data.advancedhealth-????',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'advancedhealth/inbound',
        encrypted: false,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'advancedhealth/',//should match config
          filePrefixes: ['test-members'], // should match config
          fileSuffixes: ['.csv']
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'advancedhealth/'
        }
      ]
    }
  },
  */
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
  //both Elevance VA and Elevance KS
  {
    client: 'elevance',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/ops.data.elevance-DGU0W9',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'mgft.amerigroup.com',
          port: '8443',
          username: 'tpfsmtsftp001',
          password: 'sm::ops.data.elevance.src.sftp.password',
        },
        remotePath: '/tpfsmtsftp001/v_fsmt_001/from_elvhlth',
        encrypted: false,
      },
      dest: [
        //Elevance VA
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'elevance/elevance-VA/',
          filePrefixes: ['FoodSmart_Eligibility_2'],
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'elevance/elevance-VA/',
          filePrefixes: [ 'FoodSmart_Eligibility_2' ]
        },
        //Elevance KS
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'elevance/elevance-KS/',
          filePrefixes: [ 'FoodSmart_Eligibility_KS' ],
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'elevance/elevance-KS/',
          filePrefixes: [ 'FoodSmart_Eligibility_KS' ]
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