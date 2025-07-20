import { err, ok, Result } from 'neverthrow'
import { IConfig } from '.'
import { ErrCode } from '../error'
import Secrets from './secrets'
import * as s3 from 'aws-cdk-lib/aws-s3'

const config: IConfig = {
    get isProduction() { return false },
    get isStaging() { return true },
    get isDevelopment() { return false },
    get isDevenv() { return false },
    env: 'staging',
    server: {
      port: 3000,
    },
    aws: {
      accountId: '288831299874',
      region: 'us-west-2',
      secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:288831299874:secret:mono/common-6e0utY'
    },
    mysql: {
      reader: {
        host: 'staging-rds-aurora-cluster.cluster-ro-cuc0z3pfzbnv.us-west-2.rds.amazonaws.com',
        user: 'svc_common',
        password: 'sm::mysql.svc_common.password',
        database: 'telenutrition',
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        multipleStatements: true
      },
      writer: {
        host: 'staging-rds-aurora-cluster.cluster-cuc0z3pfzbnv.us-west-2.rds.amazonaws.com',
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
        host: 'staging-analytics.c4hc2xxmfko6.us-west-2.redshift.amazonaws.com',
        database: 'analytics',
        port: 5439,
        ssl: {
          ca: 'sm::base64::redshift.awsCert'
        },
        statement_timeout: 300 * 1000,
      },
      commonStore: {
        fqRoleArn: 'arn:aws:iam::288831299874:role/FoodsmartCommonRedshiftFederatedQueryRole',
        fqSecretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:288831299874:secret:mono/common/warehouse/redshift_fq-mnEFGc',
      },
      foodappStore: {
        fqRoleArn: 'arn:aws:iam::288831299874:role/FoodsmartFoodappRedshiftFederatedQueryRole',
        fqSecretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:288831299874:secret:mono/foodapp/warehouse/redshift_fq-mD4fPk',
      },
    },
    analytics_cdk: {
      events: {
        redshiftRole: 'arn:aws:iam::288831299874:role/FoodsmartAnalyticsEventsRedshiftRole',
        bucketKeyArn: 'arn:aws:kms:us-west-2:288831299874:key/c479c2d9-640e-434b-b2fe-335202115888',
        bucketName: 'foodsmart-staging-analytics-events-app-us-west-2',
        firehoseArn: 'arn:aws:firehose:us-west-2:288831299874:deliverystream/analytics-events-app',
        kinesisArn: 'arn:aws:kinesis:us-west-2:288831299874:stream/app-events-staging',
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
          exclude: [],
        },
        providers: {
          exclude: [],
        },
        auth: {
          foodapp_token_secret: 'sm::telenutrition.auth.foodapp_token_secret',
          call_center_token_secret: 'sm::telenutrition.auth.call_center_token_secret',
          jwt_secret: 'sm::telenutrition.auth.jwt_secret',
        },
        zipongo_app_api_base: 'https://api.zipongo-stg.com/api/v2',
        zipongo_app_web_base: 'https://zipongo-stg.com',
      },
      googleapis: {
        credentials: 'sm::base64::telenutrition.googleapis.credentials'
      },
      enrollment: {
        default_url: `https://foodsmart-stg.com/schedule/auth/register`,
        secret: 'sm::telenutrition.enrollment.secret',
      },
      intercom: {
        app_id: 'k16gpn9q',
        hmac_secret_key: 'sm::telenutrition.intercom.secret_key'
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
      s3BucketName: `foodsmart-staging-foodcards-us-west-2`,
    },
    foodapp: {
      eligibility: {
        waitBeforeCommit: 15,
        googleDrive: {
          sharedDriveFolderId: '0ANgH4abwCNDvUk9PVA',
          folderId: '1hAKGfiqvZOL-DmG_OAuT4S7DzlPUmpbT',
          performanceKitchenOutFolderId: '1Yk3onCnIySVJXRRpimuJXktxqQjUaQ7b',
          performanceKitchenOutArchivedFolderId: '1SG4khWsa0hBuQxdloNQydatqAQP6_8Fy',
          umojaOutFolderId: '1tsp8qx-YT3bip9SEchG-Wrt4unAf_IZW',
          umojaOutArchivedFolderId: '14X7MDk9pT7CVvO3tsekSDsssIc4QDltH',
          quartzOutFolderId: '',
        quartzOutArchivedFolderId: '',
        },
        s3BucketName: 'foodsmart-stg-foodapp-eligibility-us-west-2',
        appStackId: 'arn:aws:cloudformation:us-west-2:288831299874:stack/app/f97a6ff0-def7-11e9-b411-02bc0b348568',
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
          }
        }
      }
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
        baseUrl: 'https://foodsmart-stg.com/retool-api',
        secret: 'sm::telenutrition.retool.secret',
      }
    },
    telenutrition_web: {
      server: {
        port: 8081,
        count: 1,
      },
      google_analytics: {
        measurement_id: 'G-RGGZE5RTYV',
      },
      plasmic: {
        project_id: 'sm::telenutrition_web.plasmic.project_id',
        token: 'sm::telenutrition_web.plasmic.token',
      },
      baseUrl: 'https://foodsmart-stg.com/schedule',
      retool: {
        app_base_url: 'https://admin.foodsmart-stg.com/app/'
      },
      cdn: {
        bucketName: 'static.zipongo-stg.com',
        bucketSubPath: 'telenutrition-web',
        nextjsPublicPath: 'telenutrition-web/public',
        cdnBaseUrl: 'https://static.zipongo-stg.com',
      },
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
        cluster_name: 'arn:aws:ecs:us-west-2:288831299874:cluster/MarketingWeb',
        service_name: 'arn:aws:ecs:us-west-2:288831299874:service/MarketingWeb/MarketingWeb'
      },
      customerio: {
        s3BucketName: 'foodsmart-staging-marketing-cio-us-west-2',
      },
    },
    marketing_web: {
      server: {
        port: 8081,
        count: 2,
      },
      google_analytics: {
        measurement_id: 'G-RGGZE5RTYV',
      },
      plasmic: {
        project_id: 'sm::marketing_web.plasmic.project_id',
        token: 'sm::marketing_web.plasmic.token',
        cms_id: 'fLQrLYThSLaDWux4kMFSeJ',
        cms_public_key: 'sm::marketing_web.plasmic.cms_public_key',
        cms_secret_key: 'sm::marketing_web.plasmic.cms_secret_key',
      },
      base_url: 'https://foodsmart-stg.com',
    },
    common: {
      store: {
        writer: {
          user: 'svc_common',
          password: 'sm::common.store.svc_common.password',
          host: 'foodsmart.cluster-cuc0z3pfzbnv.us-west-2.rds.amazonaws.com',
          database: 'foodsmart',
          port: 5432,
          ssl: {
            rejectUnauthorized: false,
            ca: 'sm::base64::redshift.awsCert'
          },
          max: 20,
          maxUses: 7500,
        },
        reader: {
          user: 'svc_common',
          password: 'sm::common.store.svc_common.password',
          host: 'foodsmart.cluster-ro-cuc0z3pfzbnv.us-west-2.rds.amazonaws.com',
          database: 'foodsmart',
          port: 5432,
          ssl: {
            rejectUnauthorized: false,
            ca: 'sm::base64::redshift.awsCert'
          },
          max: 20,
          maxUses: 7500,
        },
      },
      gpg: {
        'performance-kitchen': {
          encrypt: {
            publicKey: 'sm::base64::eligibility.performancekitchen.publicKey',
          }
        },
        'umoja': {
          encrypt: {
            publicKey: 'sm::base64::eligibility.umoja.publicKey',
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
        url: 'https://foodsmart-stg.com/webhooks/twilio/sms/events',
      },
      shortlink: {
        salt: 'sm::common.shortlink.salt',
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
      certificates: {
        foodsmartcom: 'arn:aws:acm:us-west-2:288831299874:certificate/20cd8f67-b217-4432-afa0-78cc33e3f172',
      },
      route53: {
        foodsmartcom: {
          public: {
            zoneId: 'Z1012823348U6A1UHU7MY',
            domain: 'foodsmart-stg.com',
          }
        },
        foodsmartco: {
          public: {
            zoneId: 'Z0289320MY3WKXEUGHA4',
            domain: 'foodsmart-stg.co',
          }
        }
      },
      dockerhub: {
        password: 'sm::common_cdk.dockerhub.password',
      },
      flows: {
        scratchBucket: {
          name: 'foodsmart-staging-common-flows-scratch-us-west-2'
        },
      },
      vpcs: {
        default: {
          id: 'vpc-04393561',
          cidrBlock: '10.1.0.0/16',
          subnets: {
            internal: [
              {subnetId: 'subnet-cd5f6fba', availabilityZone: 'usw2-az2', routeTableId: 'rtb-296d854f'},
              {subnetId: 'subnet-afbaa6ca', availabilityZone: 'usw2-az1', routeTableId: 'rtb-366d8550'},
            ],
            public: [
              {subnetId: 'subnet-9cbda1f9', availabilityZone: 'usw2-az1', routeTableId: 'rtb-125a4077'},
              {subnetId: 'subnet-e05a6a97', availabilityZone: 'usw2-az2', routeTableId: 'rtb-125a4077'},
            ],
            analytics: [	              
              {subnetId: 'subnet-21586856', availabilityZone: 'usw2-az1', routeTableId: 'rtb-296d854f'},
              {subnetId: 'subnet-ff839f9a', availabilityZone: 'usw2-az2', routeTableId: 'rtb-296d854f'},
              {subnetId: 'subnet-0f90fc47afc47f604', availabilityZone: 'usw2-az3', routeTableId: 'rtb-296d854f'},
            ]
          },
          securityGroups: {
            admin_api: {
              id: 'sg-7539ed12'
            },
            rds: {
              id: 'sg-5be00a3c'
            },
            rds_common_store: {
              id: 'sg-05e48e3e77a59e5aa',
            },
            redshift: {
              id: 'sg-de39e9b9'
            },
            vpn: {
              id: 'sg-775c1410'
            },
            island: {
              id:'sg-047c3a126920c41c2'
            },
            ops_store: {
              id: 'sg-04f9d07003ee5e01a'
            }
          }
        }
      },
      common_cache: {
        shortlink_table_arn: 'arn:aws:dynamodb:us-west-2:288831299874:table/common_shortlink',
        ratelimit_table_arn: 'arn:aws:dynamodb:us-west-2:288831299874:table/common_ratelimit',
      },
      common_network: {
        alb: {
          protocol: 'https',
          domain: 'foodsmart-stg.com',
        }
      },
      common_warehouse: {
        security_group: 'sg-de39e9b9'
      }
    },
    ops: {
      retool: {
        host: 'https://admin.foodsmart-stg.com',
        user: 'svc_retool',
      }
    },
    ops_cdk: {
      data: {
        redshiftS3CopyRoleArn: 'arn:aws:iam::288831299874:role/FoodsmartOpsDataRedshiftS3CopyRole',
        destBuckets: {
          externalData: {
            name: 'foodsmart-staging-external-data-us-west-2',
            kmsKeyArn: 'arn:aws:kms:us-west-2:288831299874:key/de7ae8dd-cac0-4446-9204-1f7734d85d1a',
          },
          commonData: {
            name: 'foodsmart-staging-common-data-us-west-2',
            arn: 'arn:aws:s3:::foodsmart-staging-common-data-us-west-2',
            kmsKeyArn: 'arn:aws:kms:us-west-2:288831299874:key/e266a1fe-ae21-42c8-bd56-78a7a41a69c6'
          },
          eligibilityReady: {
            name: 'zipongo-staging-eligibility-ready-us-west-2',
            kmsKeyArn: 'arn:aws:kms:us-west-2:288831299874:key/cfc574f4-25ef-4d00-bf46-7210febba47b',
          }
        }
      },
      ecs: {
        taskBucketName: 'zipongo-staging-tasks-us-west-2'
      },
      sftp: {
        ipAllocationId: 'eipalloc-0f3b4c5fc63efdcd3',
        sftpArchiveBucket: {
          name: 'foodsmart-staging-sftp-archive-us-west-2',
          lambdaEventSources: [
            {
              event: s3.EventType.OBJECT_CREATED,
              functionName: 'rewards-ss-transactions',
              functionArn: 'arn:aws:lambda:us-west-2:288831299874:function:rewards-ss-transactions',
              filter: {
                prefix: 'savingstar/'
              },
            },
            {
              event: s3.EventType.OBJECT_CREATED,
              functionName: 'eligibility-decrypt-inbound',
              functionArn: 'arn:aws:lambda:us-west-2:288831299874:function:eligibility-decrypt-inbound',
              filter: {
                prefix: 'toysrus/',
              },
            },
          ]
        },
        sftpServerBucket: {
          name: 'foodsmart-staging-sftp-server-us-west-2',
        }
      },
      vpcs: {
        default: {
          id: 'vpc-0dd6f1f4f9e1a71a8',
          cidrBlock: '10.15.0.0/16',
          subnets: {
            public: [
              {subnetId: 'subnet-0545807f4dd9ac71b', availabilityZone: 'usw2-az1', routeTableId: 'rtb-0049a8c7aa28777bb'},
              {subnetId: 'subnet-0238ba473a0961e0f', availabilityZone: 'usw2-az2', routeTableId: 'rtb-09d14209680bfaea4'},
            ]
          }
        },
      },
      sns: {
        alertsCalOptimaReferralsArn: 'arn:aws:sns:us-west-2:288831299874:ops-alerts-caloptima-referrals',
        alertsIncentivesInstacartArn: 'arn:aws:sns:us-west-2:288831299874:ops-alerts-incentives-instacart',
        eligibilityArn: 'arn:aws:sns:us-west-2:288831299874:ops-eligibility',
        alertsFlowsArn: 'arn:aws:sns:us-west-2:288831299874:ops-alerts-flows',
        alertsLogsArn: 'arn:aws:sns:us-west-2:288831299874:ops-alerts-logs',
      }
    },
    zpipe_cdk: {
      secretsmanagerArn: "arn:aws:secretsmanager:us-west-2:288831299874:secret:mono/zpipe-YSm6Kq",
      outputS3Bucket: "zipongo-analytics-staging",
    },
    okta: {
      host: "foodsmart.okta.com",
      redirectUri: "https://foodsmart-stg.com/schedule/login/provider",
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

