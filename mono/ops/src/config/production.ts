import { Result } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IConfig, } from './'
import { ClientDataConfig, OpsDataSourceType, OpsDataDestType, OpsDataDestS3BucketType, fetch } from './base'

const config: IConfig = {
  get isProduction() { return true },
  get isStaging() { return false },
  get isDevelopment() { return false },
  get isDevenv() { return false },
  env: 'production',
  aws: {
    region: 'us-west-2',
    accountId: '495477141215',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops-jO1yrU',
  },
  ops: {
    data: {},
  }
}

const clientDataConfigs: ClientDataConfig[] = [
  {
    client: 'aah',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.aah-2efGoQ',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'sftpgateway.aah.org',
          port: '2222',
          username: 'AAH-P-Foodsmart',
          password: 'sm::ops.data.aah.src.sftp.password',
        },
        remotePath: 'To_FoodSmart/',
        encrypted: true,
      },
      pgp: {
        privateKey: 'sm::base64::ops.data.aah.pgp.secret_key',
        passphrase: 'sm::ops.data.aah.pgp.passphrase',
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'aah/',
        }
      ]
    },
  },
  {
    client: 'advancedhealth',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'advancedhealth/inbound/',
        encrypted: false,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'advancedhealth/',
          filePrefixes: ['FoodSmart_Eligibility_AdvancedHealth'],
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
  {
    client: 'aahhealthyliving',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.aahhealthyliving-3DXU2Q',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'aahhealthyliving/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'aahhealthyliving/',
          filePrefixes: ['Foodsmart_Eligibility_File_'],
          fileSuffixes: ['.csv']
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'aahhealthyliving/'
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.aahhealthyliving.pgp.secret_key',
        passphrase: 'sm::ops.data.aahhealthyliving.pgp.passphrase',
      }
    }
  },
  {
    client: 'aetna-abhil',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.aetna-abhil-bmO7p2',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'st1.aetna.com',
          port: '2222',
          username: 'S060859',
          password: 'sm::ops.data.aetna-abhil.src.sftp.password',
        },
        remotePath: '/AetnaMBU/fromAetna/',
        encrypted: false,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'aetna-abhil/',
          filePrefixes: [
            'ABHIL_Foodsmart_Referral_',
            'Test_ABHIL_Foodsmart_Referral_'
          ],
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'aetna-abhil/',
        }
      ]
    },
  },
  {
    client: 'aetna-medicare',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.aetna-medicare-EIPffK',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'aetnamedicare/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'aetna-medicare/',
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'aetna-medicare/'
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.aetna-medicare.pgp.secret_key',
        passphrase: 'sm::ops.data.aetna-medicare.pgp.passphrase',
      }
    },
  },
  {
    client: 'aetna-mtbank',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.aetna-mtbank-SyWnCf',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'mtbank/inbound/',
        encrypted: false,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'aetna-mtbank/',
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'aetna-mtbank/',
        }
      ]
    }
  },
  {
    client: 'amazon-cigna',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.amazon-cigna-NmEPgh',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_DATA_BUCKET,
        externalDataBucketPrefix: 'amazon-cigna/inbound/',
        encrypted: false
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'amazon-cigna/'
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'amazon-cigna/'
        },
      ]
    }
  },
  {
    client: 'banner',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.banner-uI8e8C',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'bannerhealth/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'bannerhealth/',
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'bannerhealth/'
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.banner.pgp.secret_key',
        passphrase: 'sm::ops.data.banner.pgp.passphrase',
      }
    }
  },
  {
    //
    // Biomerieux / Vitality
    //
    client: 'biomerieux',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.vitality-7Knv33',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'secftp.thevitalitygroup.com',
          port: '22',
          username: 'biomerieux_foodsmart',
          password: 'sm::ops.data.vitality.src.sftp.password',
        },
        remotePath: '/Eligibility/FromTvg/',
        encrypted: true,
        isArmored: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'biomerieux/',
          filePrefixes: [
            'Event_Eligibility-'
          ],
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'biomerieux/',
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.vitality.pgp.secret_key',
        passphrase: 'sm::ops.data.vitality.pgp.passphrase',
      }
    }
  },
  {
    client: 'brmc',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.brmc-yxQWhE',
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
    client: 'caloptima',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.caloptima-C7n9up',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'caloptima/inbound/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'caloptima/',
          fileRegexes: [/^(\d{4})(\d{2})(\d{2})_CALAIM_mntExtract.*\.csv.*$/],
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'caloptima/'
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.caloptima.pgp.secret_key',
        passphrase: 'sm::ops.data.caloptima.pgp.passphrase',
      },
    }
  },
  {
    client: 'careoregon',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.careoregon-oKJdw0',
    data: {
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
          filePrefixes: ['CareOregon_FoodSmart_'],
          fileSuffixes: ['.csv']
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'careoregon/'
        }
      ]
    }
  },
  {
    client: 'cchp',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.cchp-q5HiRu',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'transfer.chw.org',
          username: 'foodsmart',
          password: 'sm::ops.data.cchp.src.sftp.password',
        },
        remotePath: '/Home/foodsmart/outgoing/',
        encrypted: false,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'cchp/',
          filePrefixes: ['CCHP_Foodsmart_Eligibility_'],
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'cchp/',
          filePrefixes: ['CCHP_Foodsmart_Eligibility_'],
        }
      ]
    },
  },
  {
    client: 'choc',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.choc-JDAM32',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'choc/uploads/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'choc/'
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'choc/',
        },
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.choc.pgp.secret_key',
        passphrase: 'sm::ops.data.choc.pgp.passphrase',
      }
    },
  },
  {
    client: 'cigna',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.cigna-3QPKB5',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'cigna/uploads/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'cigna/'
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'cigna/'
        },
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.cigna.pgp.secret_key',
        passphrase: 'sm::ops.data.cigna.pgp.passphrase',
      },
    },
  },
  {
    client: 'countycare',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.countycare-hVogg1',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'cookcounty/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'cookcounty/',
          filePrefixes: ['COUNTYCARE_ELIGIBILITY_']
        },
        {
          // Send everything decrypted to the data bucket.
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'countycare/'
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.countycare.pgp.secret_key',
        passphrase: 'sm::ops.data.countycare.pgp.passphrase',
      }
    },
  },
  //both Elevance VA and Elevance KS
  {
    client: 'elevance',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.elevance-uOajrt',
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
    client: 'elevance-house',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.elevancehouse-zw7YQR',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'efxprod.anthem.com',
          username: 'P_EXT_FDSMARTHA_BD',
          password: 'sm::ops.data.elevancehouse.src.sftp.password',
        },
        remotePath: 'Inbox/',
        encrypted: false,
      },
      dest: [
        //external data buckets - 1 for each cohort
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'elevance-house/food-benefit/',
          filePrefixes: [ 
            'FoodSmart_Eligibility_arm1_fsg',
            'FAM_consent_02192025_arm1'
          ]
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'elevance-house/nutrition-education/',
          filePrefixes: [
            'FoodSmart_Eligibility_arm2_ng',
            'FAM_consent_02192025_arm2'
          ]
        },
        //eligibility ready buckets - 1 for each cohort
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'elevance-house/food-benefit/',
          filePrefixes: [ 'FoodSmart_Eligibility_arm1_fsg' ]
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'elevance-house/nutrition-education/',
          filePrefixes: [ 'FoodSmart_Eligibility_arm2_ng' ]
        }
      ]
    },
  },
  {
    client: 'fidelis',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.fidelis-EKE1ku',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'sftp.centene.com',
          port: '22',
          username: 'nikko.vellios@foodsmart.com',
          password: 'sm::ops.data.fidelis.src.sftp.password',
        },
        remotePath: '/FromCentene/',
        encrypted: false,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'fidelis/',
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'fidelis/'
        }
      ]
    }
  },
  {
    client: 'flblue',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.flblue-v9hp31',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'flblue/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'flblue/',
          filePrefixes: ['FB_ZIPONGO_ENRL_PROD_'],
        },
        {
          // Send everything decrypted to the data bucket.
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'flblue/'
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.flblue.pgp.secret_key',
        passphrase: 'sm::ops.data.flblue.pgp.passphrase',
      }
    },
  },
  {
    client: 'hscsn',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.hscsn-yzXNJV',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'moveit.childrensnational.org',
          port: '22',
          username: 'foodsmart-sftp',
          privateKey: 'sm::base64::ops.data.hscsn.src.sftp.privateKey',
        },
        //
        // Home folder: FoodSmartEDI
        // path: /Outbound/
        // full path: /Home/cernerp135-sftp/HSCSN/FoodSmartEDI/Outbound
        //
        remotePath: '/Home/cernerp135-sftp/HSCSN/FoodSmartEDI/Outbound/',
        encrypted: false,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'hscsn/',
          filePrefixes: [
            'HSCSN_FoodSmart_Eligibility_'
          ],
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'hscsn/',
        }
      ]
    },
  },
  {
    client: 'ih',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.ih-iBOd3Y',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'filegateway.independenthealth.com',
          username: 'Zipongo',
          password: 'sm::ops.data.ih.src.sftp.password',
        },
        remotePath: '/Inbox/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'ih/',
          filePrefixes: ['Mbr_Elig_ZIPONGO_'],
          fileSuffixes: ['.csv']
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'ih/'
        },
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.ih.pgp.secret_key',
        passphrase: 'sm::ops.data.ih.pgp.passphrase',
      },
    },
  },
  {
    client: 'martinspoint',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.martinspoint-DV8J1l',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'martinspoint/uploads/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'martinspoint/',
          filePrefixes: ['MartinsPoint_GenerationsAdvantage_Eligibility_'],
        },
        {
          // Send everything decrypted to the data bucket.
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'martinspoint/'
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.martinspoint.pgp.secret_key',
        passphrase: 'sm::ops.data.martinspoint.pgp.passphrase',
      }
    },
  },
  {
    client: 'molina-il',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.molina-OTWVG3',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'moveit.molinahealthcare.com',
          port: '22',
          username: 'foodsmar',
          privateKey: 'sm::ops.data.molina.src.sftp.privateKey',
        },
        remotePath: 'PRODUCTION/FromMolina/',
        encrypted: false,
      },
      dest: [
        {  
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'molina/',
        },
        {  
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'molina/',
        },
      ]
    }
  },
  {
    client: 'pacificsource',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.pacificsource-HngASD',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'pacificsource/uploads/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'pacificsource/'
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'pacificsource/'
        },
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.pacificsource.pgp.secret_key',
        passphrase: 'sm::ops.data.pacificsource.pgp.passphrase',
      },
    }
  },
  {
    client: 'quartz',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.quartz-K8KOCO',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'quartz/',
        encrypted: true,
        isArmored: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'quartz/'
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'quartz/'
        },
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.quartz.pgp.secret_key',
        passphrase: 'sm::ops.data.quartz.pgp.passphrase',
      },
    }
  },
  {
    client: 'samaritan',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.samaritan-XbLF7O',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'samaritan/inbound/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'samaritan/',
          filePrefixes: ['SHP_Foodsmart_Eligibility_'],
          fileSuffixes: ['.txt']
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'samaritan/'
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.samaritan.pgp.secret_key',
        passphrase: 'sm::ops.data.samaritan.pgp.passphrase',
      }
    }
  },
  {
    client: 'tog',
    //
    // Data pulled from CCHP.
    //
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.cchp-q5HiRu',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'transfer.chw.org',
          username: 'foodsmart',
          password: 'sm::ops.data.cchp.src.sftp.password',
        },
        remotePath: '/Home/foodsmart/outgoing/',
        encrypted: false,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'tog/',
          filePrefixes: ['TOG_Foodsmart_Eligibility_'],
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'tog/',
          filePrefixes: ['TOG_Foodsmart_Eligibility_'],
        }
      ],
    }
  },
  {
    client: 'uhcdsnp',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.uhcdsnp-qiBxVT',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'uhcdsnp/FromUHC/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'uhcdsnp/',
          filePrefixes: ['DiabetesTargetPopulation']
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'uhcdsnp/',
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.uhcdsnp.pgp.secret_key',
        passphrase: 'sm::ops.data.uhcdsnp.pgp.passphrase',
      },
    }
  },
  {
    client: 'uhg',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.uhg-EepaXe',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'ecgpe.healthtechnologygroup.com',
          username: 'es10x1v',
          password: 'sm::ops.data.uhg.src.sftp.password',
        },
        remotePath: '/Inbound_From_Optum/',
        encrypted: false,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'uhg/',
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'uhg/',
        }
      ]
    }
  },
  {
    client: 'umpqua',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.umpqua-LbDjb8',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'umpqua/uploads/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'umpqua/',
          filePrefixes: ['D%3ATempUhaFoodsmartAutomationUmpquaHealth_EnrollmentFile_', 'UmpquaHealth_EnrollmentFile_']
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'umpqua/',
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.umpqua.pgp.secret_key',
        passphrase: 'sm::ops.data.umpqua.pgp.passphrase',
      },
    }
  },
  {
    client: 'umpqua-hma',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.umpquahma-4CpSuY',
    data: {
      src: {
        type: OpsDataSourceType.EXTERNAL_SFTP,
        sftp: {
          host: 'sftp.accesstpa.com',
          port: '9922',
          username: 'Foodsmart',
          privateKey: 'sm::base64::ops.data.umpquahma.src.sftp.privateKey'
        },
        remotePath: '/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'umpqua-hma/',
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.umpquahma.pgp.secret_key',
        passphrase: 'sm::ops.data.umpquahma.pgp.passphrase',
      }
    },
  },
  {
    client: 'zinghealth',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.zinghealth-F6Qbin',
    data: {
      src: {
        type: OpsDataSourceType.INTERNAL_SFTP,
        sftpArchivePrefix: 'zinghealth/',
        encrypted: true,
      },
      dest: [
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.ELIGIBILITY_READY_BUCKET,
          prefix: 'zinghealth/'
        },
        {
          type: OpsDataDestType.INTERNAL_S3,
          s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
          prefix: 'zinghealth/'
        }
      ],
      pgp: {
        privateKey: 'sm::base64::ops.data.zinghealth.pgp.secret_key',
        passphrase: 'sm::ops.data.zinghealth.pgp.passphrase',
      },
    }
  },
  {
    client: 'santa-clara',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops.data.santa-clara-vckzBz',
    data: {
      sftp: {
        host: 'sftp.scfhp.com',
        port: '22',
        username: 'foodsmart',
        password: 'sm::ops.data.santa-clara.src.sftp.password',
      },
      inbound: {
        src: {
          type: OpsDataSourceType.EXTERNAL_SFTP,
          sftp: {
            host: 'sftp.scfhp.com',
            port: '22',
            username: 'foodsmart',
            password: 'sm::ops.data.santa-clara.src.sftp.password',
          },
          remotePath: '/Outbound',
          encrypted: false,
        },
        dest: {
            type: OpsDataDestType.INTERNAL_S3,
            s3BucketType: OpsDataDestS3BucketType.EXTERNAL_DATA_BUCKET,
            prefix: 'santa-clara/',
        },
      },
      outbound: [
        {
          src: {
            type: OpsDataSourceType.EXTERNAL_DATA_BUCKET,
            externalDataBucketPrefix: 'santa-clara/outbound/',
            encrypted: false,
          },
          dest: [
            {
              type: OpsDataDestType.EXTERNAL_SFTP,
              remotePath: '/Inbound',
              encrypted: false,
            }
          ]
        }
      ],
    },
  },
]

//
// Generate the fetch method which results  in building a series of resolved configs.
//
const fetcher = fetch(config, clientDataConfigs)

export default {
  fetch: fetcher,
}
