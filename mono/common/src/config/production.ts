import { err, ok, Result } from 'neverthrow'
import _ = require("lodash")
import { IConfig } from '.'
import { ErrCode } from '../error'
import Secrets from './secrets'
import * as s3 from 'aws-cdk-lib/aws-s3'

const config: IConfig = {
  get isProduction() { return true },
  get isStaging() { return false },
  get isDevelopment() { return false },
  get isDevenv() { return false },
  env: 'production',
  server: {
    port: 3000,
  },
  aws: {
    region: 'us-west-2',
    accountId: '495477141215',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/common-Xe7iFU',
  },
  common: {
    store: {
      writer: {
        user: 'svc_common',
        password: 'sm::common.store.svc_common.password',
        host: 'foodsmart.cluster-cx6fl2miqtlg.us-west-2.rds.amazonaws.com',
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
        host: 'foodsmart.cluster-ro-cx6fl2miqtlg.us-west-2.rds.amazonaws.com',
        database: 'foodsmart',
        port: 5432,
        ssl: {
          rejectUnauthorized: false,
          ca: 'sm::base64::redshift.awsCert'
        },
        max: 20,
        maxUses: 7500,
      }
    },
    gpg: {
      'aah-healthy-living': {
        encrypt: {
          publicKey: 'sm::base64::common.gpg.aah-healthy-living.encrypt.publicKey',
        }
      },
      'performance-kitchen': {
        encrypt: {
          publicKey: 'sm::base64::eligibility.performancekitchen.publicKey',
          pgpConfig: {
            minRSABits: 1024
          },
        }
      },
      'umoja': {
        encrypt: {
          publicKey: 'sm::base64::eligibility.umoja.publicKey',
        }
      },
      'quartz': {
        encrypt: {
          publicKey: 'sm::base64::eligibility.quartz.publicKey',
        }
      }
    },
    referrals: [
      {
        source: 'cal-optima',
        cal_optima_connect: {
          host: 'https://www.caloptimaconnect.com',
          username: 'marek.ryniejski@foodsmart.com',
          password: 'sm::ops.referrals.cal-optima.password',
          food_vendors: {
            'bento': {
              option: '13664658',
            },
            'ga_foods': {
              option: '12824447',
            },
            'lifespring': {
              option: '12841192',
            },
            'meals_on_wheels': {
              option: '12596088',
            },
            'sunterra': {
              option: '12790763',
            },
            'tangelo': {
              option: '12873520',
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
      url: 'https://foodsmart.com/webhooks/twilio/sms/events',
    },
    shortlink: {
      salt: 'sm::common.shortlink.salt',
    },
    zoom: {
      accountOwner: 'admin@zipongo.com',
      accountId: 'sm::common.zoom.account_id',
      clientId: 'sm::common.zoom.client_id',
      clientSecret: 'sm::common.zoom.client_secret',
      webhookSecret: 'sm::common.zoom.webhook_secret',
    },
    rippling: {
      fnn: {
        host: 'https://api.rippling.com',
        token: 'sm::common.rippling.fnn_api_key',
      },
      fnnV2: {
        host: 'https://rest.ripplingapis.com',
        token: 'sm::common.rippling.fnn_v2_api_key',
      },
    },
    workramp: {
      apiKey: 'sm::common.workramp.token',
      academyId: '366f20aa-bada-11ee-9ef5-06fee787c73d',
    },
  },
  common_cdk: {
    certificates: {
      foodsmartcom: 'arn:aws:acm:us-west-2:495477141215:certificate/b3ad9136-0e79-419a-ab53-bbca35ff9f55',
    },
    route53: {
      foodsmartcom: {
        public: {
          zoneId: 'Z087120318UMA5O0JWCWD',
          domain: 'foodsmart.com',
        }
      },
      foodsmartco: {
        public: {
          zoneId: 'Z087011223VA2ICLPXPEX',
          domain: 'foodsmart.co',
        }
      }
    },
    dockerhub: {
      password: 'sm::common_cdk.dockerhub.password',
    },
    flows: {
      scratchBucket: {
        name: 'foodsmart-production-common-flows-scratch-us-west-2'
      },
    },
    vpcs: {
      default: {
        id: 'vpc-48cdd92d',
        cidrBlock: '10.2.0.0/16',
        subnets: {
          internal: [
            {subnetId: 'subnet-6530d401', availabilityZone: 'usw2-az1', routeTableId: 'rtb-1210fc76'},
            {subnetId: 'subnet-d495aca3', availabilityZone: 'usw2-az2', routeTableId: 'rtb-e110fc85'},
            {subnetId: 'subnet-8f7620d6', availabilityZone: 'usw2-az3', routeTableId: 'rtb-f010fc94'},
          ],
          public: [
            {subnetId: 'subnet-80f6ede5', availabilityZone: 'usw2-az1', routeTableId: 'rtb-04fa1760'},
            {subnetId: 'subnet-0c7f407b', availabilityZone: 'usw2-az2', routeTableId: 'rtb-04fa1760'},
            {subnetId: 'subnet-2eb5e077', availabilityZone: 'usw2-az3', routeTableId: 'rtb-04fa1760'},
          ],
          rds: [
            {subnetId: 'subnet-989d86fd', availabilityZone: 'usw2-az1', routeTableId: 'rtb-00e00d64'},
            {subnetId: 'subnet-a96758de', availabilityZone: 'usw2-az2', routeTableId: 'rtb-00e00d64'},
          ],
          analytics: [
            {subnetId: 'subnet-b037d3d4', availabilityZone: 'usw2-az1', routeTableId: 'rtb-1210fc76'},
            {subnetId: 'subnet-1795ac60', availabilityZone: 'usw2-az1', routeTableId: 'rtb-e110fc85'},
            {subnetId: 'subnet-907341c9', availabilityZone: 'usw2-az1', routeTableId: 'rtb-f010fc94'},
          ],
          data: [
            {subnetId: 'subnet-0848407bb473ce897', availabilityZone: 'usw2-az1', routeTableId: 'rtb-1210fc76'},
            {subnetId: 'subnet-0881c899d3398e612', availabilityZone: 'usw2-az2', routeTableId: 'rtb-e110fc85'},
          ],
        },
        securityGroups: {
          admin_api: {
            id: 'sg-2c40114b',
          },
          rds: {
            id: 'sg-82956be5',
          },
          rds_common_store: {
            id: 'sg-08db785ccf2bd4e4e',
          },
          redshift: {
            id: 'sg-4f861328',
          },
          vpn: {
            id: 'sg-0fbb2ef6979e192a9'
          },
          island: {
            id:'sg-0cb2aeb8359216367'
          },
          ops_store: {
            id: 'sg-097ad5b01f1f12488'
          }
        }
      },
      management: {
        id: 'vpc-dac214be',
        cidrBlock: '10.6.0.0/16',
        subnets: {
          public: [
            {subnetId: 'subnet-5c11cf38', availabilityZone: 'usw2-az1', routeTableId: 'rtb-1cdb6978', ipv4CidrBlock: '10.6.0.0/24'}
          ],
        }
      }
    },
    common_cache: {
      shortlink_table_arn: 'arn:aws:dynamodb:us-west-2:495477141215:table/common_shortlink',
      ratelimit_table_arn: 'arn:aws:dynamodb:us-west-2:495477141215:table/common_ratelimit',
    },
    common_network: {
      alb: {
        protocol: 'https',
        domain: 'foodsmart.com',
      }
    },
    common_warehouse: {
      security_group: 'sg-4f861328'
    }
  },
  mysql: {
    reader: {
      host: 'prod-rds-aurora-cluster.cluster-ro-cx6fl2miqtlg.us-west-2.rds.amazonaws.com',
      user: 'svc_common',
      password: 'sm::mysql.svc_common.password',
      database: 'telenutrition',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      multipleStatements: true
    },
    writer: {
      host: 'prod-rds-aurora-cluster.cluster-cx6fl2miqtlg.us-west-2.rds.amazonaws.com',
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
    endpoint: 'us-zipcode.api.smartystreets.com',
    id: '0e23cf55-2c32-1403-bd0e-596750a2684f',
    token: 'sm::smartystreets.token',
  },
  athena: {
    snowflake: {
      warehouse: 'AH_WAREHOUSE',
      account: 'dv25045',
      username: 'OPS_SERVICE',
      password: 'sm::athena.ops_service.password',
      role: 'DATAINTEGRATIONADMIN',
    },
    s3StorageIntegration: {
      awsUserArn: 'arn:aws:iam::183053193097:user/fwsd-s-p1ss1928',
      awsExternalId: 'DV25045_SFCRole=9_+zW/jYzE8H6ay92kZFz14yiyZYs=',
    }
  },
  redshift: {
    connection: {
      user: 'svc_common',
      password: 'sm::redshift.svc_common.password',
      host: 'prod-analytics.cg5t3umqkos2.us-west-2.redshift.amazonaws.com',
      database: 'production',
      port: 5439,
      ssl: {
        ca: 'sm::base64::redshift.awsCert'
      },
      statement_timeout: 60 * 60 * 1000,
    },
    credentials: {
      migrations: {
        user: 'svc_migration',
        password: 'sm::common.redshift.svc_migration.password',
      }
    },
    commonStore: {
      fqRoleArn: 'arn:aws:iam::495477141215:role/FoodsmartCommonRedshiftFederatedQueryRole',
      fqSecretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/common/warehouse/redshift_fq-60Emkj',
    },
    foodappStore: {
      fqRoleArn: 'arn:aws:iam::495477141215:role/FoodsmartFoodappRedshiftFederatedQueryRole',
      fqSecretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/foodapp/warehouse/redshift_fq-jrE4OM',
    },
  },
  foodcards: {
    incomm: {
      sftp: {
        host: '74.122.144.61',
        port: '20024',
        username: 'HU5',
        password: 'sm::foodcards.incomm.sftp.password',
      },
      publicKey: 'sm::base64::foodcards.incomm.publicKey',
      decryption: {
        privateKey: '',
        passphrase: '',
      },
      sftpWaitBetweenUploads: 3600 * 2 + 900,
      googleDrive: {
        sharedDriveFolderId: '0AG59dUPIqpH3Uk9PVA',
        folderId: '1JDRtKYarmBC58Q8MmhbSYGiz7klWK6_3',
      },
    },
    s3BucketName: `foodsmart-production-foodcards-us-west-2`
  },
  foodapp: {
    eligibility: {
      waitBeforeCommit: 3600 * 2,
      googleDrive: {
        sharedDriveFolderId: '0ACLCHqDZ8aW-Uk9PVA',
        folderId: '10O42IH9qIUcxA3TbziVO1bkUT1TypC0S',
        performanceKitchenOutFolderId: '15_BkvU73xBRryQbEnFcI1KDksl6JOFzp',
        performanceKitchenOutArchivedFolderId: '1rc4RtsRdjD_ONo7kUBNd2XyOKxA3iHLw',
        umojaOutFolderId: '1WWYUjvxiKpPsLN-oyzttmr3XDL5qxboY',
        umojaOutArchivedFolderId: '1LmLKqEH0IIEX9BuNDWHUHo-ZDPomMRep',
        quartzOutFolderId: '1wYxIMTdc-7OM7p0t9KxPSyO6NhH0Ej9O',
        quartzOutArchivedFolderId: '1nXDnyLuLF5vltRe_hpMmw9fV3hQ3FNin',
      },
      s3BucketName: 'foodsmart-production-foodapp-eligibility-us-west-2',
      appStackId: 'arn:aws:cloudformation:us-west-2:495477141215:stack/app/7332e210-efbe-11e9-a22d-06c2ee48308c',
    },
    foodVendor: {
      umoja: {
        sftp: {
          host: 'ftp.umojacloud.io',
          port: '22',
          username: 'mahesh.pasupuleti@foodsmart.com',
          password: 'sm::foodapp.foodVendor.umoja.sftp.password',
        },
        s3BucketName: 'foodsmart-production-foodapp-eligibility-us-west-2',
        googleDrive: {
          sharedDriveFolderId: '0AG59dUPIqpH3Uk9PVA',
          folderId: '1JDRtKYarmBC58Q8MmhbSYGiz7klWK6_3',
        },
      },
      quartz: {
        sftp: {
          host: 'ftp.quartzbenefits.com',
          username: 'diegotrevino',
          password: 'sm::foodapp.foodVendor.quartz.sftp.password',
        },
      }
    }
  },
  analytics_cdk: {
    events: {
      redshiftRole: 'arn:aws:iam::495477141215:role/FoodsmartAnalyticsEventsRedshiftRole',
      bucketKeyArn: 'arn:aws:kms:us-west-2:495477141215:key/799b1692-b211-4ca5-bead-32d5223b3470',
      bucketName: 'foodsmart-production-analytics-events-app-us-west-2',
      firehoseArn: 'arn:aws:firehose:us-west-2:495477141215:deliverystream/analytics-events-app',
      kinesisArn: 'arn:aws:kinesis:us-west-2:495477141215:stream/app-events',
    }
  },
  telenutrition: {
    athena: {
      disabled: true,
      practice: '20786',
      api: {
        host: 'api.platform.athenahealth.com',
        key: 'sm::telenutrition.athena.api.key',
        secret: 'sm::telenutrition.athena.api.secret',
      },
    },
    candidhealth: {
      host: 'https://api.joincandidhealth.com',
      clientId: 'sm::telenutrition.candidhealth.api_key',
      clientSecret: 'sm::telenutrition.candidhealth.api_secret',
    },
    medallion: {
      host: 'https://app.medallion.co',
      token: 'sm::telenutrition.medallion.token',
    },
    scheduling: {
      departments: {
        exclude: [2, 3, 4],
      },
      providers: {
        exclude: [1],
      },
      auth: {
        foodapp_token_secret: 'sm::telenutrition.auth.foodapp_token_secret',
        call_center_token_secret: 'sm::telenutrition.auth.call_center_token_secret',
        jwt_secret: 'sm::telenutrition.auth.jwt_secret',
      },
      zipongo_app_api_base: 'https://api.zipongo.com/api/v2',
      zipongo_app_web_base: 'https://zipongo.com',
    },
    googleapis: {
      credentials: 'sm::base64::telenutrition.googleapis.credentials'
    },
    enrollment: {
      default_url: `https://foodsmart.com/schedule/auth/register`,
      secret: 'sm::telenutrition.enrollment.secret',
    },
    intercom: {
      app_id: 'h3qbbull',
      hmac_secret_key: 'sm::telenutrition.intercom.secret_key'
    },
  },
  telenutrition_api: {
    server: {
      port: 8080,
      count: 2,
    },
    cluster: {
      size: 2,
    },
    albListenerRulePrefix: '/telenutrition/api/v1',
    retool: {
      baseUrl: 'https://foodsmart.com/retool-api',
      secret: 'sm::telenutrition.retool.secret',
    }
  },
  telenutrition_web: {
    server: {
      port: 8081,
      count: 2,
    },
    google_analytics: {
      measurement_id: 'G-56GTWX58YX',
    },
    plasmic: {
      project_id: 'sm::telenutrition_web.plasmic.project_id',
      token: 'sm::telenutrition_web.plasmic.token',
    },
    baseUrl: 'https://foodsmart.com/schedule',
    retool: {
      app_base_url: 'https://admin.foodsmart.com/app/'
    },
    cdn: {
      bucketName: 'static.zipongo.com',
      bucketSubPath: 'telenutrition-web',
      nextjsPublicPath: 'telenutrition-web/public',
      cdnBaseUrl: 'https://static.zipongo.com',
    },
  },
  telenutrition_cdk: {
    athena: {
      unloadS3Bucket: 'foodsmart-production-telenutrition-athena-unload-us-west-2',
      storageIntegration: 'foodsmart-telenutrition-athena-s3-unload',
      redshiftS3CopyRoleArn: 'arn:aws:iam::495477141215:role/FoodsmartTelenutritionAthenaRedshiftS3CopyRole',
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
      cluster_name: 'arn:aws:ecs:us-west-2:495477141215:cluster/MarketingWeb',
      service_name: 'arn:aws:ecs:us-west-2:495477141215:service/MarketingWeb/MarketingWeb'
    },
    customerio: {
      s3BucketName: 'foodsmart-production-marketing-cio-us-west-2',
    },
  },
  marketing_web: {
    server: {
      port: 8081,
      count: 2,
    },
    google_analytics: {
      measurement_id: 'G-56GTWX58YX',
    },
    plasmic: {
      project_id: 'sm::marketing_web.plasmic.project_id',
      token: 'sm::marketing_web.plasmic.token',
      cms_id: 'fLQrLYThSLaDWux4kMFSeJ',
      cms_public_key: 'sm::marketing_web.plasmic.cms_public_key',
      cms_secret_key: 'sm::marketing_web.plasmic.cms_secret_key',
    },
    base_url: 'https://foodsmart.com',
  },
  ops: {
    eligibility: {
      appStackId: 'arn:aws:cloudformation:us-west-2:495477141215:stack/app/7332e210-efbe-11e9-a22d-06c2ee48308c',
      imports: [
        {
          //
          // aahhealthyliving/Foodsmart_Eligibility_File_01.3z_oBxXl.22.2024.csv
          //
          active: true,
          s3Prefix: 'aahhealthyliving/Foodsmart_Eligibility_File_',
          spec: 'aahhealthyliving',
          orgId: 182,
          accountId: 39,
          nameRegex: /^Foodsmart_Eligibility_File_(\d\d)\..*(\d\d)\.(\d\d\d\d)\.csv$/,
          nameMonthMatch: 1,
          nameDayMatch: 2,
          nameYearMatch: 3,
        },
        {
          //
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
          // aetna-medicare/Zipongo.Ck6TCCfr.ELIG.NXGN.12262023034501.csv
          //
          active: true,
          s3Prefix: 'aetna-medicare/',
          spec: 'aetnamedicare',
          orgId: 170,
          accountId: 27,
          nameRegex: /Zipongo\..*\.(\d\d)(\d\d)(\d{4})\d{6}\.csv/,
          nameMonthMatch: 1,
          nameDayMatch: 2,
          nameYearMatch: 3,
        },
        {
          active: true,
          s3Prefix: 'aetna-mtbank/',
          spec: 'aetna-mtbank',
          orgId: 146,
          accountId: 50,
          nameRegex: /^MTBank.*-(\d{4})-(\d{2})-(\d{2}).*/,
          nameMonthMatch: 2,
          nameDayMatch: 3,
          nameYearMatch: 1,
        },
        {
          active: true,
          s3Prefix: 'amazon-cigna/',
          spec: 'amazon-cigna',
          orgId: 207,
          accountId: 72,
          nameRegex: /^Amazon_Foodsmart_EM_DataScrub_(\d{2})(\d{2})(\d{2}).*/,
          nameMonthMatch: 1,
          nameDayMatch: 2,
          nameYearMatch: 3,
        },
        //
        // advancedhealth/AdvancedHealth_Eligibility_20240102.csv
        //
        {
          active: true,
          s3Prefix: 'advancedhealth/FoodSmart_Eligibility_AdvancedHealth_',
          spec: 'advancedhealth', //TBD
          orgId: 215,
          accountId: 80,
          nameRegex: /^FoodSmart_Eligibility_AdvancedHealth_(\d{4})(\d{2})(\d{2}).*\.csv/, //TBD
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // bannerhealth/bannerhealth_eligibility_20240129.csv
          //
          active: true,
          s3Prefix: 'bannerhealth/bannerhealth_eligibility_',
          spec: 'bannerhealth',
          orgId: 200,
          accountId: 37,
          nameRegex: /^bannerhealth_eligibility_(\d{4})(\d{2})(\d{2}).*\.csv/,
          nameMonthMatch: 2,
          nameDayMatch: 3,
          nameYearMatch: 1,
        },
        {
          //
          // biomerieux/Event_Eligibility-2024-11-27-118581.csv
          //
          active: true,
          s3Prefix: 'biomerieux/Event_Eligibility-',
          spec: 'vitality',
          orgId: 85,
          subOrgId: 'biomerieux',
          accountId: 43,
          nameRegex: /^Event_Eligibility-(\d{4})-(\d{2})-(\d{2})-.*\.csv/,
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
          nameRegex: /^FoodSmart_Eligibility_BRMC_(\d{4})(\d{2})(\d{2}).*\.csv/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          // ********* FILE NAMING CONVENTION WILL BE:  caloptima/YYYYMMDD_CALAIM_mntExtract.csv
          //
          active: false,
          s3Prefix: "caloptima",
          spec: "caloptima",
          orgId: 204,
          accountId: 61,
          nameRegex: /^(\d{4})(\d{2})(\d{2})_CALAIM_mntExtract.*\.csv$/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
          eligibilityAPI: {
            apiKey: 'sm::ops.data.caloptima.safetynetconnect.api_key',
            apiUrl: 'https://caloptimaconnect.com:8443/api/hdsp/v1/patients',
          },
        },
        {
          //
          // careoregon/CareOregon_FoodSmart_20240315.csv
          //
          active: true,
          s3Prefix: "careoregon",
          spec: "careoregon",
          orgId: 191,
          accountId: 62,
          nameRegex: /^CareOregon_FoodSmart_(\d{4})(\d{2})(\d{2}).*\.csv$/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // cchp/CCHP_Foodsmart_Eligibility_20240102.csv
          //
          active: true,
          s3Prefix: "cchp",
          spec: 'cchp',
          orgId: 174,
          accountId: 9,
          nameRegex: /^CCHP_Foodsmart_Eligibility_(\d{4})(\d{2})(\d{2})\.csv/,
          nameMonthMatch: 2,
          nameDayMatch: 3,
          nameYearMatch: 1,
        },
        {
          //
          // tog/TOG_Foodsmart_Eligibility_20240102.csv
          //
          active: true,
          s3Prefix: 'tog/TOG_Foodsmart_Eligibility_',
          spec: 'cchp',
          orgId: 175,
          accountId: 10,
          nameRegex: /^TOG_Foodsmart_Eligibility_(\d{4})(\d{2})(\d{2})\.csv/,
          nameMonthMatch: 2,
          nameDayMatch: 3,
          nameYearMatch: 1,
        },
        {
          //
          // choc/CHOC_Zipongo_Eligiblity_20240105.nTWSRf3j.csv
          //
          active: true,
          s3Prefix: "choc/CHOC_Zipongo_Elig",
          spec: 'choc',
          orgId: 144,
          nameRegex: /^CHOC_Zipongo_Elig[^_]*_(\d{4})(\d{2})(\d{2}).*\.csv/,
          nameMonthMatch: 2,
          nameDayMatch: 3,
          nameYearMatch: 1,
        },
        {
          //
          // cigna/Cigna_Zipongo_eligibility_20240117.kTb8N5SB.124158.csv
          //
          active: true,
          s3Prefix: "cigna/Cigna_Zipongo_eligibility_",
          spec: 'cignahealth',
          orgId: 171,
          nameRegex: /Cigna_Zipongo_eligibility_(\d{4})(\d{2})(\d{2}).*\.csv/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // cookcounty/COUNTYCARE_ELIGIBILITY_20240115T02001612.txt
          //
          active: true,
          s3Prefix: "cookcounty/COUNTYCARE_ELIGIBILITY_",
          spec: "countycare",
          orgId: 197,
          accountId: 46,
          nameRegex: /^COUNTYCARE_ELIGIBILITY_(\d{4})(\d{2})(\d{2})T[\d]{8}\.txt$/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
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
          // Elevance House - Food Benefit
          //
          //   s3: elevance-house/food-benefit/
          //
          active: true,
          s3Prefix: "elevance-house/food-benefit/FoodSmart_Eligibility_",
          spec: "elevance-house",
          orgId: 210,
          accountId: 75,
          nameRegex: /^FoodSmart_Eligibility_.*(\d{4})(\d{2})(\d{2})\.csv/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // Elevance House - Nutrition Education
          //
          //   s3: elevance-house/nutrition-education/
          //
          active: true,
          s3Prefix: "elevance-house/nutrition-education/FoodSmart_Eligibility_",
          spec: "elevance-house",
          orgId: 211,
          accountId: 76,
          nameRegex: /^FoodSmart_Eligibility_.*(\d{4})(\d{2})(\d{2})\.csv/,
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
          //
          // fidelis/FidelisCare_Prod_Membership_FULL_FoodSmart_20210101_20240930.txt
          //
          active: true,
          s3Prefix: "fidelis/FidelisCare_Prod_Membership_",
          spec: "fidelis",
          orgId: 208,
          accountId: 73,
          nameRegex: /^FidelisCare_Prod_Membership_FULL_FoodSmart_(\d{4})(\d{2})(\d{2})_.*\.txt$/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // flblue/FB_ZIPONGO_ENRL_PROD_2023_12_26.6n9kEVCX.csv
          //
          active: true,
          s3Prefix: "flblue",
          spec: 'flblue',
          orgId: 169,
          accountId: 35,
          nameRegex: /^FB_ZIPONGO_ENRL_PROD_(\d{4})_(\d{2})_(\d{2}).*\.csv/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // ih/Mbr_Elig_ZIPONGO_01242024.csv
          //
          active: true,
          s3Prefix: "ih/Mbr_Elig_ZIPONGO_",
          spec: 'ih',
          orgId: 8,
          accountId: 6,
          nameRegex: /^Mbr_Elig_ZIPONGO_(\d{2})(\d{2})(\d{4})\.csv$/,
          nameMonthMatch: 1,
          nameDayMatch: 2,
          nameYearMatch: 3,
        },
        {
          //
          //  hscsn/HSCSN_FoodSmart_Eligibility_20230305.csv
          //
          active: true,
          s3Prefix: "hscsn/HSCSN_FoodSmart_Eligibility_",
          spec: 'hscsn',
          accountId: 30,
          orgId: 198,
          nameRegex: /^HSCSN_FoodSmart_Eligibility_(\d{4})(\d{2})(\d{2})\.csv$/,
          nameMonthMatch: 2,
          nameDayMatch: 3,
          nameYearMatch: 1,
        },
        {
          //
          // molina/FoodSmart_Eligibility_MolinaIL_yyyymmdd.csv
          //
          active: true,
          s3Prefix: 'molina/FoodSmart_Eligibility_MolinaIL_',
          spec: 'molinail',
          orgId: 214,
          accountId: 79,
          nameRegex: /FoodSmart_Eligibility_MolinaIL_(\d{4})(\d{2})(\d{2}).*\.csv/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // martinspoint/MartinsPoint_GenerationsAdvantage_Eligibility_20240123.lUBHetgI.csv
          //
          active: true,
          s3Prefix: 'martinspoint',
          spec: 'martinspointga',
          orgId: 177,
          accountId: 8,
          nameRegex: /MartinsPoint_GenerationsAdvantage_Eligibility_(\d{4})(\d{2})(\d{2}).*\.csv/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // mt-bank/aetna-MT-extract-2024-01-01.csv
          //
          active: true,
          s3Prefix: 'mt-bank',
          spec: 'mt',
          orgId: 146,
          accountId: 50,
          nameRegex: /^aetna-MT-extract-(\d{4})-(\d{2})-(\d{2})\.csv$/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // pacificsource/FoodSmartEligibility.pOjxd0Pp-2023-10-13.csv
          //
          active: true,
          s3Prefix: "pacificsource",
          spec: "pacificsource",
          orgId: 172,
          accountId: 55,
          nameRegex: /^FoodSmartEligibility.*-(\d{4})-(\d{2})-(\d{2})\.csv$/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // quartz/Quartz_Foodsmart_Eligibility_20240126.4fEQzSgY.txt
          //
          active: true,
          s3Prefix: "quartz/",
          spec: "quartz",
          orgId: 195,
          accountId: 56,
          nameRegex: /^Quartz_Foodsmart_Eligibility_(\d{4})(\d{2})(\d{2}).*\.txt$/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // samaritan/SHP_Foodsmart_Eligibility_20240403.txt
          //
          active: true,
          s3Prefix: "samaritan",
          spec: "samaritan",
          accountId: 64,
          orgId: 206,
          nameRegex: /^SHP_Foodsmart_Eligibility_(\d{4})(\d{2})(\d{2}).*\.txt$/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        },
        {
          //
          // umpqua/D%3ATempUhaFoodsmartAutomationUmpquaHealth_EnrollmentFile_20240121.Xd7JpWNl.csv
          //
          active: true,
          s3Prefix: "umpqua",
          spec: "umpqua",
          orgId: 184,
          accountId: 11,
          nameRegex: /^D%3ATempUhaFoodsmartAutomationUmpquaHealth_EnrollmentFile_(\d{4})(\d{2})(\d{2}).*\.csv$/,
          nameYearMatch: 1,
          nameMonthMatch: 2,
          nameDayMatch: 3,
        }
      ]
    },
    retool: {
      host: 'https://admin.foodsmart.com',
      user: 'svc_retool',
    }
  },
  ops_cdk: {
    data: {
      redshiftS3CopyRoleArn: 'arn:aws:iam::495477141215:role/FoodsmartOpsDataRedshiftS3CopyRole',
      destBuckets: {
        externalData: {
          name: 'foodsmart-production-external-data-us-west-2',
          kmsKeyArn: 'arn:aws:kms:us-west-2:495477141215:key/b3c108c0-6165-4437-848c-8b5246bb3c85',
        },
        commonData: {
          name: 'foodsmart-production-common-data-us-west-2',
          arn: 'arn:aws:s3:::foodsmart-production-common-data-us-west-2',
          kmsKeyArn: 'arn:aws:kms:us-west-2:495477141215:key/88a3eab4-3cde-4af7-877c-28fc2675cbe1',
        },
        eligibilityReady: {
          name: 'zipongo-prod-eligibility-ready-us-west-2',
          kmsKeyArn: 'arn:aws:kms:us-west-2:495477141215:key/24b2d6c6-e83c-47c9-bd01-10838291048d',
        }
      }
    },
    ecs: {
      taskBucketName: 'zipongo-prod-tasks-us-west-2'
    },
    vpn: {
      samlMetadata: 'sm::base64::ops_cdk.vpn.samlMetadata',
      cidr: '172.27.224.0/20',
    },
    sftp: {
      serverId: 's-0d9ee2308392426e9',
      ipAllocationId: 'eipalloc-753caa11',
      sftpArchiveBucket: {
        name: 'foodsmart-production-sftp-archive-us-west-2',
        lambdaEventSources: [
          {
            event: s3.EventType.OBJECT_CREATED,
            functionName: 'rewards-ss-transactions',
            functionArn: 'arn:aws:lambda:us-west-2:495477141215:function:rewards-ss-transactions',
            filter: { prefix: 'savingstar/' },
          },
        ]
      },
      sftpServerBucket: {
        name: 'foodsmart-production-sftp-server-us-west-2',
      }
    },
    sns: {
      alertsCalOptimaReferralsArn: 'arn:aws:sns:us-west-2:495477141215:ops-alerts-caloptima-referrals',
      alertsIncentivesInstacartArn: 'arn:aws:sns:us-west-2:495477141215:ops-alerts-incentives-instacart',
      alertsFlowsArn: 'arn:aws:sns:us-west-2:495477141215:ops-alerts-flows',
      alertsLogsArn: 'arn:aws:sns:us-west-2:495477141215:ops-alerts-logs',
      eligibilityArn: 'arn:aws:sns:us-west-2:495477141215:ops-eligibility'

    },
    vpcs: {
      default: {
        id: 'vpc-0f5459e57e277b11d',
        cidrBlock: '10.3.0.0/16',
        subnets: {
          vpn: [
            {subnetId: 'subnet-0c1f2d466a1094dac', availabilityZone: 'usw2-az1', routeTableId: 'rtb-006ce3d6b99ba2c10'},
            {subnetId: 'subnet-09eef4a918616a97f', availabilityZone: 'usw2-az2', routeTableId: 'rtb-09252642cbba9961e'},
          ],
          public: [
            {subnetId: 'subnet-0c9bdf95e6b999c03', availabilityZone: 'usw2-az1', routeTableId: 'rtb-0d4411366ce918a87'},
            {subnetId: 'subnet-0b3e8b2022438d4dc', availabilityZone: 'usw2-az1', routeTableId: 'rtb-05185f5ac71dab4df'},
          ]
        }
      },
    },
  },
  zpipe_cdk: {
    secretsmanagerArn: "arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/zpipe-3rYRwY",
    outputS3Bucket: "zipongo-analytics",
  },
  okta: {
    host: "foodsmart.okta.com",
    redirectUri: "https://foodsmart.com/schedule/login/provider",
    clientId: "0oa3hz37roOqwWWwJ697",
    clientSecret: "sm::telenutrition.auth.okta_client_secret",
    serviceClientId: "0oaocxfl4yZYd1ISl697",
    appIds: {
      zoom: "0oa1jxv6ng95svVa0697",
    }
  },
  twilio: {
    accountId: 'sm::common.twilio.account_id',
    authToken: 'sm::common.twilio.auth_token',
    sid: 'sm::common.twilio.sid',
    secret: 'sm::common.twilio.secret',
    senderNumber: 'sm::common.twilio.sender_phone',
  },
  security_cdk: {
    crowdstrike: {
      assumedBy: 'arn:aws:iam::292230061137:role/crowdstrike-3pi-us1-connectors',
      cloudwatch: {
        externalId: '9a701d44-ff5b-4f85-9428-2af50a78bb02',
        loggroups: [
          '/foodsmart/telenutrition-api',
          '/foodsmart/telenutrition-web',
        ],
      },
      cloudtrail: {
        externalId: '8990bc8b97d5406aa633c05ddd171a9f',
      }
    },
    sumologic: {
      assumedBy: 'arn:aws:iam::926226587429:root',
      cloudwatch: {
        externalId: 'us2:00000000004E0D70',
        snsurl: 'https://endpoint3.collection.us2.sumologic.com/receiver/v1/event/ZaVnC4dhaV3Gnc_a57IXiPBM0khwYz01-qE7j_RBKOC3D4e9jrwxt8P4_Rz-xRbCdLaWcsTeu-dhxxhOpKB0pTgufOS2bLBP_db5G6fIGlu6WHxy1C5fIA==',
        loggroups: [
          '/foodsmart/telenutrition-api',
          '/foodsmart/telenutrition-web',
        ],
      },
    }
  }
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
