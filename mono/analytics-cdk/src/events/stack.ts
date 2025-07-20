import { Construct } from "constructs"
import { Stack, StackProps, RemovalPolicy, Duration, Size } from 'aws-cdk-lib'
import * as firehose from '@aws-cdk/aws-kinesisfirehose-alpha'
import * as destinations from '@aws-cdk/aws-kinesisfirehose-destinations-alpha'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as iam from 'aws-cdk-lib/aws-iam'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import Naming from'@mono/common-cdk/lib/naming'

import { IConfig } from '@mono/common/lib/config'

import {createS3BucketName, createLogGroupName, createDeliveryStreamName} from '@mono/common-cdk/lib/naming'

export class AnalyticsEventsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const domain = 'analytics-events'

    const eventsEncryptionKey = new kms.Key(this, 'EventsS3EncryptionKey', {
      enabled: true,
      alias: 'analytics-events/s3-bucket',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
    })
    
    const bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: createS3BucketName(config, domain, 'app'),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: eventsEncryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      eventBridgeEnabled: true,
      versioned: true,
    })

    const logGroup = new logs.LogGroup(this, 'AnalyticsEventsLogGroup', {
      logGroupName: createLogGroupName(config, domain, 'firehose-to-s3'),
      retention: RetentionDays.ONE_MONTH,
    })

    const interval = (config.isDevelopment || config.isStaging) ? Duration.minutes(1) : Duration.minutes(15)

    const destination = new destinations.S3Bucket(bucket, {
      bufferingInterval: interval,
      bufferingSize: Size.mebibytes(16),
      encryptionKey: eventsEncryptionKey,
      logGroup,
    })

    const stream = new firehose.DeliveryStream(this, 'AnalyticsEventsStream', {
      deliveryStreamName: createDeliveryStreamName(config, domain, 'app'),
      encryption: firehose.StreamEncryption.AWS_OWNED,
      destinations: [destination],
    })

    const redshiftCopyRole = new iam.Role(this, 'Role', {
      roleName: Naming.createIAMRoleName(config, domain, 'redshift'),
      assumedBy: new iam.ServicePrincipal('redshift.amazonaws.com'),
      description: 'Used to copy analytics events from S3 into Redsfhit',
    })

    bucket.grantRead(redshiftCopyRole.grantPrincipal)
    
  }
}
