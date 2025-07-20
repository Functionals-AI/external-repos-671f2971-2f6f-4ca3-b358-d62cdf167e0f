import Devenv from './devenv'
import Development from './development'
import Staging from './staging'
import Production from './production'
import type { ConnectionConfig as PgConnectionConfig, PoolConfig as PgPoolConfig } from 'pg'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { SubnetAttributes } from 'aws-cdk-lib/aws-ec2'

export { resolveSecrets } from './secrets'
export type Environment = 'devenv' | 'development' | 'staging' | 'production'

/**
 * SFTP Config
 */
export interface ISFTPConfig {
  host: string,
  port?: string,
  username: string,
  password?: string,
  privateKey?: string | Buffer,
}

export interface MysqlOptions {
  host: string,
  user: string,
  password: string,
  database: string,
  waitForConnections: boolean,
  connectionLimit: number,
  queueLimit: number,
  multipleStatements?: boolean,
}

export interface ILambdaEventSource {
  event: s3.EventType,
  functionName: string,
  functionArn: string,
  filter: {
    prefix: string,
  }
}

export interface IBaseConfig {
  readonly isProduction: boolean,
  readonly isStaging: boolean,
  readonly isDevelopment: boolean,
  readonly isDevenv: boolean,
  env: Environment,
  aws: {
    region: string,
    accountId: string,
    secretsmanagerArn: string,
  },
}

type ReferralSource = 'cal-optima'

interface ReferralBase {
  source: ReferralSource
}

export type CalOptimaVendor = 'bento' | 'ga_foods' | 'lifespring' | 'meals_on_wheels' | 'sunterra' | 'tangelo'

export type CalOptimaVendorOption = {
  option: string,
}

export interface CalOptimaReferralConfig extends ReferralBase {
  cal_optima_connect: {
    host: string,
    username: string,
    password: string,
    food_vendors: Partial<Record<CalOptimaVendor, CalOptimaVendorOption>>
  }
}

export type ReferralConfig = CalOptimaReferralConfig

export interface IDataExternalAPIConfig {
  apiKey?: string,
  apiUrl?: string,
}

export interface IConfig extends IBaseConfig {
  server: {
    port: number,
  },
  mysql: {
    reader: MysqlOptions,
    writer: MysqlOptions,
  },
  smartystreets: {
    endpoint: string,
    id: string,
    token: string,
  },
  athena: {
    snowflake: {
      warehouse: string,
      account: string,
      username: string,
      password: string,
      role?: string,
    },
    s3StorageIntegration: {
      awsUserArn: string,
      awsExternalId: string,
    }
  },
  redshift: {
    connection: PgConnectionConfig,
    credentials?: Record<string, {user: string, password: string}>,
    commonStore: {
      fqRoleArn: string,
      fqSecretsmanagerArn: string,
    },
    foodappStore: {
      fqRoleArn: string,
      fqSecretsmanagerArn: string,
    },
  },
  analytics_cdk: {
    events: {
      bucketKeyArn: string,
      bucketName: string,
      firehoseArn: string,
      kinesisArn: string,
      redshiftRole: string,
    }
  }
  telenutrition: {
    athena: {
      disabled?: boolean,
      practice: string,
      api: {
        key: string,
        secret: string,
        host: string,
      },
    },
    candidhealth: {
      host: string,
      clientId: string,
      clientSecret: string
    },
    medallion?: {
      host: string,
      token: string,
    },
    scheduling: {
      departments: {
        exclude: number[],
      },
      providers: {
        exclude: number[],
      },
      auth: {
        foodapp_token_secret: string,
        call_center_token_secret: string,
        jwt_secret: string,
      },
      zipongo_app_api_base: string,
      zipongo_app_web_base: string,
    },
    googleapis: {
      credentials: string,
    },
    enrollment: {
      default_url: string,
      secret: string,
    },
    intercom: {
      app_id: string,
      hmac_secret_key: string,
    },
  },
  foodcards: {
    incomm: {
      sftp: {
        host: string,
        port: string,
        username: string,
        password: string,
      },
      publicKey: string,
      decryption: {
        passphrase: string,
        privateKey: string,
      },
      sftpWaitBetweenUploads: number,
      googleDrive: {
        sharedDriveFolderId: string,
        folderId: string,
      },
    },
    s3BucketName: string,
  },
  foodapp?: {
    eligibility: {
      waitBeforeCommit: number,
      googleDrive: {
        sharedDriveFolderId: string,
        folderId: string,
        performanceKitchenOutFolderId: string,
        performanceKitchenOutArchivedFolderId: string,
        umojaOutFolderId: string,
        umojaOutArchivedFolderId: string,
        quartzOutFolderId: string,
        quartzOutArchivedFolderId: string,
      },
      s3BucketName: string,
      appStackId: string,
    },
    foodVendor: {
      umoja: {
        sftp: {
          host: string,
          port: string,
          username: string,
          password: string,
        },
        s3BucketName: string,
        googleDrive: {
          sharedDriveFolderId: string,
          folderId: string,
        },
      },
      quartz: {
        sftp: {
          host: string,
          port?: string,
          username: string,
          password: string,
        },
      }
    }
  },
  telenutrition_api: {
    server: {
      port: number,
      count: number,
    },
    cluster?: {
      size: number
    },
    albListenerRulePrefix: string,
    retool: {
      baseUrl: string,
      secret: string,
    }
  },
  telenutrition_web: {
    server: {
      port: number,
      count: number,
    },
    google_analytics: {
      measurement_id: string,
    },
    plasmic?: {
      project_id: string,
      token: string,
    }
    baseUrl: string,
    retool: {
      app_base_url: string
    },
    cdn: {
      bucketName: string,
      // The path within the bucket where telenutrition-web static assets are stored
      bucketSubPath: string,
      // Refers to /public folder within the docker app
      nextjsPublicPath: string,
      // The url that will be used by NextJS when fetching assets in production
      cdnBaseUrl: string,
    },
  },
  telenutrition_cdk: {
    athena: {
      unloadS3Bucket: string,
      storageIntegration: string,
      redshiftS3CopyRoleArn: string,
    },
    telenutrition_app: {
      apiLogGroupName: string,
    }
  },
  marketing: {
    qualtrics?: {
      surveys: {
        [id: string]: string,
      }
    },
    callrail?: {
      accountId: string,
      token: string,
      host: string,
    },
    customerio: {
      api_token: string,
      tracking_token: string,
    },
  },
  marketing_cdk: {
    marketing_web_ecs?: {
      cluster_name: string,
      service_name: string
    },
    customerio: {
      s3BucketName: string,
    },
  },
  marketing_web?: {
    server: {
      port: number,
      count: number,
    },
    google_analytics: {
      measurement_id: string,
    },
    plasmic?: {
      project_id: string,
      token: string,
      cms_id: string,
      cms_public_key: string,
      cms_secret_key: string
    },
    base_url: string,
  },
  common: {
    store: {
      writer: PgPoolConfig,
      reader: PgPoolConfig,
    },
    gpg: Record<string, {
      encrypt?: {
        publicKey: string,
        pgpConfig?: {},
      },
      decrypt?: {
        privateKey: string,
        passphrase?: string,
      }
    }>,
    referrals?: ReferralConfig[],
    slack: {
      slack_token: string,
    },
    googleapis: {
      credentials: string,
    },
    twilio?: {
      sid: string,
      secret: string,
      authToken: string,
      foodsmartPhoneNumber: string,
      url: string,
    },
    shortlink: {
      salt: string,
    },
    lokalise?: {
      apiKey: string,
    },
    zoom: {
      accountOwner: string,
      accountId: string,
      clientId: string,
      clientSecret: string,
      webhookSecret: string,
    },
    rippling?: {
      fnn: {
        host: string,
        token: string,
      },
      fnnV2: {
        host: string,
        token: string,
      },
    },
    workramp?: {
      apiKey: string,
      academyId: string,
    },
  },
  common_cdk: {
    certificates?: Record<string, string>,
    route53?: Record<string, {public: {zoneId: string, domain: string}}>,
    dockerhub?: {
      password: string
    },
    flows: {
      scratchBucket: {
        name: string,
      }
    },
    vpcs: {
      default?: IVpcConfig,
      management?: IVpcConfig,
    },
    common_cache: {
      shortlink_table_arn?: string,
      ratelimit_table_arn?: string,
    },
    common_network: {
      alb: {
        protocol: string,
        domain: string,
      }
    },
    common_warehouse?: {
      security_group: string;
    }
  },
  ops: {
    eligibility?: {
      appStackId?: string
      imports: {
        active: boolean,
        s3Prefix: string,
        spec: string,
        orgId: number,
        subOrgId?: string,
        accountId?: number,
        nameRegex?: RegExp,
        nameMonthMatch?: number,
        nameDayMatch?: number,
        nameYearMatch?: number,
        eligibilityAPI?: IDataExternalAPIConfig,
      }[]
    },
    retool?: {
      host: string,
      user: string,
    },
  },
  ops_cdk: {
    data?: {
      redshiftS3CopyRoleArn: string,
      destBuckets: {
        externalData: {
          name: string,
          kmsKeyArn: string,
        },
        commonData: {
          name: string,
          arn: string,
          kmsKeyArn: string,
        },
        eligibilityReady: {
          name: string,
          kmsKeyArn: string,
        },
      },
    },
    ecs?: {
      taskBucketName: string,
    },
    vpn?: {
      cidr: string,
      samlMetadata: string,
    },
    sftp: {
      serverId?: string,
      ipAllocationId: string,
      sftpArchiveBucket?: {
        name: string,
        lambdaEventSources?: ILambdaEventSource[]
      },
      sftpServerBucket: {
        name: string,
      }
    },
    sns: {
      alertsCalOptimaReferralsArn?: string,
      alertsIncentivesInstacartArn?: string,
      alertsFlowsArn: string,
      alertsLogsArn: string,
      eligibilityArn?: string
    }
    vpcs?: {
      default?: IVpcConfig,
    },
  },
  zpipe_cdk?: {
    secretsmanagerArn: string,
    outputS3Bucket: string,
  },
  okta: {
    host: string,
    redirectUri: string,
    clientId: string,
    clientSecret: string,
    serviceClientId: string,
    appIds: {
      zoom: string
    }
  },
  twilio: {
    accountId: string,
    authToken: string,
    sid: string,
    secret: string,
    senderNumber: string,
  },
  security_cdk?: {
    crowdstrike?: {
      assumedBy: string,
      cloudwatch?: {
        externalId: string,
        loggroups: string[],
      },
      cloudtrail?: {
        externalId: string,
      },
    },
    sumologic?: {
      assumedBy: string,
      cloudwatch?: {
        externalId: string,
        loggroups: string[],
        snsurl: string,
      },
      cloudtrail?: {
        externalId: string,
      },
    }
  }
}

export interface IVpcSubnetConfig {
  subnetId: string,
  availabilityZone: string,
  routeTableId: string,
  cidr?: string,
}

export interface IVpcConfig {
  id?: string,
  subnets?: Record<string, SubnetAttributes[]>,
  cidrBlock: string,
  securityGroups?: Record<string, {id: string}>,
}


export function getEnvironment(): Environment {
  if (process.env['NODE_ENV'] === undefined) {
    throw new Error(`NODE_ENV environmental variable is not defined.`)
  }
  const env = process.env['NODE_ENV']

  if (env === 'development' || env === 'devenv' || env === 'staging' || env === 'production') {
    return env
  }


  throw new Error(`Invalid NODE_ENV value: ${env}`)
}

async function from(env?: Environment): Promise<IConfig> {
  if (env === undefined) {
    env = getEnvironment()
  }

  if (env === 'devenv') {
    const result = await Devenv.fetch()

    if (result.isErr()) {
      throw new Error(`Error fetching config for env: ${env}`)
    }

    return result.value
  } else if (env === 'development') {
    const result = await Development.fetch()

    if (result.isErr()) {
      throw new Error(`Error fetching config for env: ${env}`)
    }

    return result.value
  }
  else if (env === 'staging') {
    const result = await Staging.fetch()

    if (result.isErr()) {
      throw new Error(`Error fetching config for env: ${env}`)
    }

    return result.value
  }
  else if (env === 'production') {
    const result = await Production.fetch()

    if (result.isErr()) {
      throw new Error(`Error fetching config for env: ${env}`)
    }

    return result.value
  }

  throw new Error(`invalid value for env: ${env}`)
}

export default {
  from,
  getEnvironment,
}
