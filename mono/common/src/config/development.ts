import { err, ok, Result } from 'neverthrow'
import { IConfig } from '.'
import { ErrCode } from '../error'
import Secrets from './secrets'
import * as s3 from 'aws-cdk-lib/aws-s3'

const config: IConfig = {
  get isProduction() { return false },
  get isStaging() { return false },
  get isDevelopment() { return true },
  get isDevenv() { return false },
  env: 'development',
  server: {
    port: 3000,
  },
  aws: {
    region: 'us-west-2',
    accountId: '914374131125',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/common-HZIXmP'
  },
  mysql: {
    reader: {
      host: 'dev-rds-aurora-1-cluster.cluster-ro-clfse24y8e7x.us-west-2.rds.amazonaws.com',
      user: 'svc_common',
      password: 'sm::mysql.svc_common.password',
      database: 'telenutrition',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      multipleStatements: true
    },
    writer: {
      host: 'dev-rds-aurora-1-cluster.cluster-clfse24y8e7x.us-west-2.rds.amazonaws.com',
      user: 'svc_common',
      password: 'sm::mysql.svc_common.password',
      database: 'telenutrition',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      multipleStatements: true
    }
  },
  smartystreets: {
    endpoint: '',
    id: '',
    token: '',
  },
  athena: {
    snowflake: {
      warehouse: '',
      account: '',
      username: '',
      password: '',
    },
    s3StorageIntegration: {
      awsUserArn: '',
      awsExternalId: ''
    }
  },
  redshift: {
    connection: {
      user: 'svc_common',
      password: 'sm::redshift.svc_common.password',
      host: 'dev-analytics.cwtmozaldokv.us-west-2.redshift.amazonaws.com',
      database: 'analytics',
      port: 5439,
      ssl: {
        ca: 'sm::base64::redshift.awsCert'
      },
      statement_timeout: 300 * 1000,
    },
    credentials: {
      migrations: {
        user: 'svc_migration',
        password: 'sm::common.redshift.svc_migration.password',
      }
    },
    commonStore: {
      fqRoleArn: 'arn:aws:iam::914374131125:role/FoodsmartCommonRedshiftFederatedQueryRole',
      fqSecretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/common/warehouse/redshift_fq-qyrrxF',
    },
    foodappStore: {
      fqRoleArn: 'arn:aws:iam::914374131125:role/FoodsmartFoodappRedshiftFederatedQueryRole',
      fqSecretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/foodapp/warehouse/redshift_fq-8QU9gX',
    },
  },
  analytics_cdk: {
    events: {
      redshiftRole: 'arn:aws:iam::914374131125:role/FoodsmartAnalyticsEventsRedshiftRole',
      bucketKeyArn: 'arn:aws:kms:us-west-2:914374131125:key/1a1fad37-b7c7-46be-8446-dbada8983d4e',
      bucketName: 'foodsmart-development-analytics-events-app-us-west-2',
      firehoseArn: 'arn:aws:firehose:us-west-2:914374131125:deliverystream/analytics-events-app',
      kinesisArn: 'arn:aws:kinesis:us-west-2:914374131125:stream/app-events-dev',
    }
  },
  telenutrition: {
    athena: {
      disabled: true,
      practice: '207860',
      api: {
        host: 'api.preview.platform.athenahealth.com',
        key: 'sm::telenutrition.athena.api.key',
        secret: 'sm::telenutrition.athena.api.secret',
      },
    },
    candidhealth: {
      host: 'https://api-staging.joincandidhealth.com',
      clientId: 'sm::telenutrition.candidhealth.api_key',
      clientSecret: 'sm::telenutrition.candidhealth.api_secret',
    },
    scheduling: {
      departments: {
        exclude: []
      },
      providers: {
        exclude: [],
      },
      auth: {
        foodapp_token_secret: 'sm::telenutrition.auth.foodapp_token_secret',
        call_center_token_secret: 'sm::telenutrition.auth.call_center_token_secret',
        jwt_secret: 'sm::telenutrition.auth.jwt_secret',
      },
      zipongo_app_api_base: 'https://api.zipongo-dev.com/api/v2',
      zipongo_app_web_base: 'https://zipongo-dev.com',
    },
    googleapis: {
      credentials: '{}'
    },
    enrollment: {
      default_url: `https://foodsmart-dev.com/schedule/auth/register`,
      secret: 'z39z9*8Xvj#eO2c',
    },
    intercom: {
      app_id: 'k16gpn9q',
      hmac_secret_key: 'sm::telenutrition.intercom.secret_key'
    },
  },
  telenutrition_api: {
    server: {
      port: 8080,
      count: 1,
    },
    cluster: {
      size: 2,
    },
    albListenerRulePrefix: '/telenutrition/api/v1',
    retool: {
      baseUrl: 'https://foodsmart-dev.com/retool-api',
      secret: 'sm::telenutrition.retool.secret',
    },
  },
  telenutrition_web: {
    server: {
      port: 8081,
      count: 1,
    },
    google_analytics: {
      measurement_id: 'G-CEZDCYJV7B',
    },
    plasmic: {
      project_id: 'sm::telenutrition_web.plasmic.project_id',
      token: 'sm::telenutrition_web.plasmic.token',
    },
    baseUrl: 'https://foodsmart-dev.com/schedule',
    retool: {
      app_base_url: 'https://admin.foodsmart-dev.com/app/'
    },
    cdn: {
      bucketName: 'static.zipongo-dev.com',
      bucketSubPath: 'telenutrition-web',
      nextjsPublicPath: 'telenutrition-web/public',
      cdnBaseUrl: 'https://static.zipongo-dev.com',
    },
  },
  foodcards: {
    incomm: {
      sftp: {
        host: '74.122.144.61',
        port: '20024',
        username: 'HU5-UAT',
        password: 'sm::foodcards.incomm.sftp.password',
      },
      publicKey: 'sm::base64::foodcards.incomm.publicKey',
      decryption: {
        privateKey: '',
        passphrase: '',
      },
      sftpWaitBetweenUploads: 15,
      googleDrive: {
        sharedDriveFolderId: '0AG59dUPIqpH3Uk9PVA',
        folderId: '1nSzN-JQByRjBDNI1mYXnfN9EaC2hfxL-',
      },
    },
    s3BucketName: `foodsmart-development-foodcards-us-west-2`
  },
  foodapp: {
    eligibility: {
      waitBeforeCommit: 15,
      googleDrive: {
        sharedDriveFolderId: '0AIcbcNbNI97JUk9PVA',
        folderId: '1YFtDs5pVXEm9uY_EZDur6I5BMEPrabdV',
        performanceKitchenOutFolderId: '1UeqPICP1wVfiutZdafLfH_0GadhLjiUW',
        performanceKitchenOutArchivedFolderId: '1EVGvCyzWDYKTFNGCuZm0_fYct_NmQiMI',
        umojaOutFolderId: '1Wndl68sW1-LC_xT1K1wzsuyDaUmnovzk',
        umojaOutArchivedFolderId: '1FW3VA97-svKmx6q6PuIZx_ZmAcLpHDbS',
        quartzOutFolderId: '1h0nszqoN2vwYJS_wwmHyT8a3PKxH1k7Q',
        quartzOutArchivedFolderId: '11vwjWIqoU33NmMkZiYE0Nm8QxmHKSlZX',
      },
      s3BucketName: 'foodsmart-development-foodapp-eligibility-us-west-2',
      appStackId: 'arn:aws:cloudformation:us-west-2:914374131125:stack/app/77fe2960-c5c7-11e9-aa8d-0a1528792fce',
    },
    foodVendor: {
      umoja: {
        sftp: {
          host: '',
          port: '',
          username: '',
          password: '',
        },
        s3BucketName: '',
        googleDrive: {
          sharedDriveFolderId: '',
          folderId: ''
        }
      },
      quartz: {
        sftp: {
          host: '',
          username: '',
          password: '',
        },
      }
    }
  },
  telenutrition_cdk: {
    athena: {
      unloadS3Bucket: '',
      storageIntegration: '',
      redshiftS3CopyRoleArn: '',
    },
    telenutrition_app: {
      apiLogGroupName: '/foodsmart/telenutrition-api',
    }
  },
  marketing: {
    customerio: {
      api_token: 'sm::marketing.customerio.api_token',
      tracking_token: 'sm::marketing.customerio.tracking_token',
    },
  },
  marketing_cdk: {
    marketing_web_ecs: {
      cluster_name: 'arn:aws:ecs:us-west-2:914374131125:cluster/MarketingWeb',
      service_name: 'arn:aws:ecs:us-west-2:914374131125:service/MarketingWeb/MarketingWeb'
    },
    customerio: {
      s3BucketName: 'foodsmart-development-marketing-cio-us-west-2',
    }
  },
  marketing_web: {
    server: {
      port: 8081,
      count: 2,
    },
    google_analytics: {
      measurement_id: 'G-CEZDCYJV7B',
    },
    plasmic: {
      project_id: 'sm::marketing_web.plasmic.project_id',
      token: 'sm::marketing_web.plasmic.token',
      cms_id: 'fLQrLYThSLaDWux4kMFSeJ',
      cms_public_key: 'sm::marketing_web.plasmic.cms_public_key',
      cms_secret_key: 'sm::marketing_web.plasmic.cms_secret_key',
    },
    base_url: `https://foodsmart-dev.com`,
  },
  common: {
    store: {
      writer: {
        user: 'svc_common',
        password: 'sm::common.store.svc_common.password',
        host: 'foodsmart.cluster-clfse24y8e7x.us-west-2.rds.amazonaws.com',
        database: 'foodsmart',
        port: 5432,
        ssl: {
          rejectUnauthorized: false,
          ca: 'sm::base64::redshift.awsCert'
        }
      },
      reader: {
        user: 'svc_common',
        password: 'sm::common.store.svc_common.password',
        host: 'foodsmart.cluster-ro-clfse24y8e7x.us-west-2.rds.amazonaws.com',
        database: 'foodsmart',
        port: 5432,
        ssl: {
          rejectUnauthorized: false,
          ca: 'sm::base64::redshift.awsCert'
        }
      }
    },
    gpg: {
      'performance-kitchen': {
        encrypt: {
          publicKey: 'sm::base64::eligibility.performancekitchen.publicKeytest', // to be replaced
        }
      },
      'umoja': {
        encrypt: {
          publicKey: 'sm::base64::eligibility.performancekitchen.publicKeytest', // to be replaced
        }
      },
      'quartz': {
        encrypt: {
          publicKey: 'sm::base64::eligibility.performancekitchen.publicKeytest', // to be replaced
        }
      }
    },
    referrals: [
      {
        source: 'cal-optima',
        cal_optima_connect: {
          host: 'https://demo.caloptimaconnect.com',
          username: 'demo_foodsmart1',
          password: 'sm::ops.referrals.cal-optima.password',
          food_vendors: {
            'bento': {
              option: '6963400',
            },
            'ga_foods': {
              option: '6962351',
            },
            'lifespring': {
              option: '6962364',
            },
            'meals_on_wheels': {
              option: '6955797',
            },
            'sunterra': {
              option: '6962327',
            },
          }
        }
      }
    ],
    slack: {
      slack_token: 'sm::common.slack.slack_token'
    },
    googleapis: {
      credentials: 'sm::base64::common.googleapis.credentials.default',
    },
    twilio: {
      sid: 'sm::common.twilio.sid',
      secret: 'sm::common.twilio.secret',
      authToken: 'sm::common.twilio.auth_token',
      foodsmartPhoneNumber: 'sm::common.twilio.sender_phone',
      url: 'https://foodsmart-dev.com/webhooks/twilio/sms/events',
    },
    shortlink: {
      salt: '1sPMtU8syMUw*Z*5uPPAyDF^q^rM5uA0',
    },
    zoom: {
      accountOwner: 'admin@zipongo-stg.com',
      accountId: 'sm::common.zoom.account_id',
      clientId: 'sm::common.zoom.client_id',
      clientSecret: 'sm::common.zoom.client_secret',
      webhookSecret: 'sm::common.zoom.webhook_secret',
    },
  },
  common_cdk: {
    route53: {
      foodsmartcom: {
        public: {
          zoneId: 'Z05567351V0ILFJ825EY2',
          domain: 'foodsmart-dev.com',
        }
      },
      foodsmartco: {
        public: {
          zoneId: 'Z08028272HZ271X8DYQOP',
          domain: 'foodsmart-dev.co',
        }
      },
    },
    dockerhub: {
      password: 'sm::common_cdk.dockerhub.password',
    },
    flows: {
      scratchBucket: {
        name: 'foodsmart-development-common-flows-scratch-us-west-2'
      },
    },
    vpcs: {
      default: {
        id: 'vpc-7971e21e',
        cidrBlock: '10.10.0.0/16',
        subnets: {
          internal: [
            {subnetId: 'subnet-a6c709ef', availabilityZone: 'usw2-az1', routeTableId: 'rtb-9b2d1cfc'},
            {subnetId: 'subnet-ef853188', availabilityZone: 'usw2-az2', routeTableId: 'rtb-9a2d1cfd'},
          ],
          public: [
            {subnetId: 'subnet-a7c709ee', availabilityZone: 'usw2-az1', routeTableId: 'rtb-b4d8efd3'},
            {subnetId: 'subnet-ed85318a', availabilityZone: 'usw2-az2', routeTableId: 'rtb-b4d8efd3'},
          ],
          analytics: [	              
            {subnetId: 'subnet-ec85318b', availabilityZone: 'usw2-az1', routeTableId: 'rtb-1ec7f079'},
            {subnetId: 'subnet-b1c709f8', availabilityZone: 'usw2-az2', routeTableId: 'rtb-1dc7f07a'},
          ]
        },
        securityGroups: {
          admin_api: {
            id: 'sg-49f59431'
          },
          rds: {
            id: 'sg-4af59432'
          },
          rds_common_store: {
            id: 'sg-03e45757a995de153'
          },
          redshift: {
            id: 'sg-7c1bb507'
          },
          vpn: {
            id: 'sg-0fbb2ef6979e192a9'
          },
          island: {
            id:'sg-01d1cfde57c9660a9'
          },
          ops_store: {
            id: 'sg-00c798f7d54f2d898'
          }
        }
      }
    },
    common_cache: {
      shortlink_table_arn: 'arn:aws:dynamodb:us-west-2:914374131125:table/common_shortlink',
      ratelimit_table_arn: 'arn:aws:dynamodb:us-west-2:914374131125:table/common_ratelimit',
    },
    common_network: {
      alb: {
        protocol: 'https',
        domain: 'foodsmart-dev.com',
      }
    },
    common_warehouse: {
      security_group: 'sg-7c1bb507',
    }
  },
  ops: {
    eligibility: {
      appStackId: 'arn:aws:cloudformation:us-west-2:914374131125:stack/app/77fe2960-c5c7-11e9-aa8d-0a1528792fce',
      imports: [
        {
          active: true,
          s3Prefix: 'quartz',
          spec: 'quartz',
          orgId: 195
        },
        {
          //
          // elevance/FoodSmart_Eligibility_20240112.csv
          //
          active: true,
          s3Prefix: "elevance/elevance-VA/FoodSmart_Eligibility_2",
          spec: "anthemva",
          orgId: 201,
          accountId: 45,
          nameRegex: /^FoodSmart_Eligibility_(\d{4})(\d{2})(\d{2})\.csv/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // elevance-ks/FoodSmart_Eligibility_KS_20250331.csv
          //
          active: true,
          s3Prefix: "elevance/elevance-KS/FoodSmart_Eligibility_KS",
          spec: "healthyblueks",
          orgId: 213,
          accountId: 78,
          nameRegex: /^FoodSmart_Eligibility_KS_(\d{4})(\d{2})(\d{2})\.csv/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          // aetna-abhil/ABHIL_Foodsmart_Referral_20240208-test.csv
          //
          active: true,
          s3Prefix: 'aetna-abhil/ABHIL_Foodsmart_Referral_',
          spec: 'aetnaabhil',
          orgId: 202,
          accountId: 60,
          nameRegex: /^ABHIL_Foodsmart_Referral_(\d{4})(\d{2})(\d{2})\.csv/,
          nameMonthMatch: 2,
          nameDayMatch: 3,
          nameYearMatch: 1,
        },
        {
          //
          // brmc/FoodSmart_Eligibility_BRMC_20250324.csv
          //
          active: true,
          s3Prefix: 'brmc/FoodSmart_Eligibility_BRMC_',
          spec: 'brmc',
          orgId: 212,
          accountId: 77,
          nameRegex: /^FoodSmart_Eligibility_BRMC_(\d{4})(\d{2})(\d{2})\.csv/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // molina/Test_FoodSmart_Eligibility_MolinaIL_yyyymmdd.csv
          //
          active: true,
          s3Prefix: 'molina/Test_FoodSmart_Eligibility_MolinaIL_',
          spec: 'molinail',
          orgId: 214,
          accountId: 79,
          nameRegex: /Test_FoodSmart_Eligibility_MolinaIL_(\d{4})(\d{2})(\d{2}).*\.csv/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
                //
        // advancedhealth/AdvancedHealth_Eligibility_20240102.csv
        //
        {
          active: true,
          s3Prefix: 'advancedhealth/test-members', //name of path/file
          spec: 'advancedhealth', //double check api-new for this name
          orgId: 215,
          accountId: 80,
          nameRegex: /^test-members-(\d{4})(\d{2})(\d{2}).*\.csv/, //with date prefix
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
      ]
    },
    retool: {
      host: 'https://admin.foodsmart-dev.com',
      user: 'svc_retool',
    }
  },
  ops_cdk: {
    data: {
      redshiftS3CopyRoleArn: '',
      destBuckets: {
        externalData: {
          name: 'foodsmart-development-external-data-us-west-2',
          kmsKeyArn: 'arn:aws:kms:us-west-2:914374131125:key/1f557b55-6468-4247-9c7d-e9837aff5726',
        },
        commonData: {
          name: 'foodsmart-development-common-data-us-west-2',
          arn: 'arn:aws:s3:::foodsmart-development-common-data-us-west-2',
          kmsKeyArn: 'arn:aws:kms:us-west-2:914374131125:key/349e6cd2-8ae1-4c9e-84b9-c0e3562461ed'
        },
        eligibilityReady: {
          name: 'zipongo-dev-eligibility-ready-us-west-2',
          kmsKeyArn: 'arn:aws:kms:us-west-2:914374131125:key/46dacbe4-9495-4f7c-9f9c-796dcc79095b',
        }
      }
    },
    ecs: {
      taskBucketName: 'zipongo-dev-tasks-us-west-2'
    },
    sftp: {
      ipAllocationId: 'eipalloc-815b7abb',
      sftpArchiveBucket: {
        name: 'foodsmart-development-sftp-archive-us-west-2',
        lambdaEventSources: [
          {
            event: s3.EventType.OBJECT_CREATED,
            functionName: 'eligibility-decrypt-inbound',
            functionArn: 'arn:aws:lambda:us-west-2:914374131125:function:eligibility-decrypt-inbound',
            filter: {
              prefix: 'bind/',
            }
          },
          {
            event: s3.EventType.OBJECT_CREATED,
            functionName: 'eligibility-transform-inbound',
            functionArn: 'arn:aws:lambda:us-west-2:914374131125:function:eligibility-transform-inbound',
            filter: {
              prefix: 'cerneraetna/',
            }
          },
          {
            event: s3.EventType.OBJECT_CREATED,
            functionName: 'rewards-ss-transactions',
            functionArn: 'arn:aws:lambda:us-west-2:914374131125:function:rewards-ss-transactions',
            filter: {
              prefix: 'savingstar/',
            }
          },
          {
            event: s3.EventType.OBJECT_CREATED,
            functionName: 'eligibility-transform-inbound',
            functionArn: 'arn:aws:lambda:us-west-2:914374131125:function:eligibility-transform-inbound',
            filter: {
              prefix: 'texasstarplus/',
            }
          },
          {
            event: s3.EventType.OBJECT_CREATED,
            functionName: 'eligibility-decrypt-inbound',
            functionArn: 'arn:aws:lambda:us-west-2:914374131125:function:eligibility-decrypt-inbound',
            filter: {
              prefix: 'toysrus/',
            }
          }
        ]
      },
      sftpServerBucket: {
        name: 'foodsmart-development-sftp-server-us-west-2',
      },
    },
    sns: {
      alertsFlowsArn: 'arn:aws:sns:us-west-2:914374131125:ops-alerts-flows',
      alertsLogsArn: 'arn:aws:sns:us-west-2:914374131125:ops-alerts-telenutrition-logs',
      eligibilityArn: 'arn:aws:sns:us-west-2:914374131125:ops-eligibility',
    },
    vpcs: {
      default: {
        id: 'vpc-02772a18b4cf3bfbc',
        cidrBlock: '10.7.0.0/16',
        subnets: {
          public: [
            {subnetId: 'subnet-0be6218e893a663fb', availabilityZone: 'usw2-az2', routeTableId: 'rtb-095a701bccc980be3'},
            {subnetId: 'subnet-07e06b2c4b1db573b', availabilityZone: 'usw2-az1', routeTableId: 'rtb-0968a0c5cb391b804'},
          ]
        }
      }
    },
  },
  zpipe_cdk: {
    secretsmanagerArn: "arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/zpipe-c5jOYs",
    outputS3Bucket: "zipongo-analytics-dev",
  },
  okta: {
    host: "foodsmart.okta.com",
    redirectUri: "https://foodsmart-dev.com/schedule/login/provider",
    clientId: "0oa3cf04mzzUHSLPR697",
    clientSecret: "sm::telenutrition.auth.okta_client_secret",
    serviceClientId: "0oaocx69tiltcYrhf697",
    appIds: {
      zoom: "0oao7muu1rGJmT0Ya697",
    }
  },
  twilio: {
    accountId: 'sm::common.twilio.account_id',
    authToken: 'sm::common.twilio.auth_token',
    sid: 'sm::common.twilio.sid',
    secret: 'sm::common.twilio.secret',
    senderNumber: 'sm::common.twilio.sender_phone',
  },
  security_cdk: {}
}

async function fetch(): Promise<Result<IConfig, ErrCode>> {
  const result = await Secrets.resolveSecrets(config)

  if (result.isErr()) {
    return err(ErrCode.SERVICE)
  }

  return ok(result.value)
}

export default {
  fetch,
}
