import { CfnOutput, Fn, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'

import { IConfig } from '@mono/common/lib/config'
import naming from '@mono/common-cdk/lib/naming'
import {createWorkflow} from '@mono/common-cdk/lib/flows'
import {flows, dependencies} from '@mono/marketing-flows'
import { EventBus } from 'aws-cdk-lib/aws-events'

const domain = 'Marketing'

export class MarketingFlowsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const cioS3BucketKey = new kms.Key(this, 'CioS3BucketKey', {
      enabled: true,
      alias: 'marketing-cio',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
    })

    cioS3BucketKey.grantEncryptDecrypt(new iam.AccountRootPrincipal())

    const cioS3Bucket = new s3.Bucket(this, 'MarketingCioS3Bucket', {
      bucketName: naming.createS3BucketName(config, 'marketing', 'cio'),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: cioS3BucketKey,
      eventBridgeEnabled: true,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: false,
    })

    const {taskDefinition} = createWorkflow({config, flows, domain, dependencies: dependencies(), stack: this})

    cioS3BucketKey.grantEncryptDecrypt(taskDefinition.taskRole)

    cioS3Bucket.grantReadWrite(taskDefinition.taskRole)

    if (config.isProduction) {
      const qualtricsEventBusArn = Fn.importValue('MarketingApi-QualtricsEventBusArn')
      const qualtricsEventBus = EventBus.fromEventBusArn(this, 'MarketingQualtricsEventBusArn', qualtricsEventBusArn)

      qualtricsEventBus.grantPutEventsTo(taskDefinition.taskRole)
    }

    //
    // Stack outputs:
    //  * S3 Bucket KMS key,
    //  * S3 Bucket ARN.
    //
    new CfnOutput(this, 'CioS3BucketKeyOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'CioS3KmsKeyArn']),
      value: cioS3BucketKey.keyArn,
      description: 'Marketing Customer.io S3 KMS key arn',
    })
  
    new CfnOutput(this, 'CioS3BucketArnOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'CioS3BucketArn']),
      value: cioS3Bucket.bucketArn,
      description: 'Marketing Customer.io S3 bucket arn',
    })

    new CfnOutput(this, 'CioS3BucketNameOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'CioS3BucketName']),
      value: cioS3Bucket.bucketName,
      description: 'Marketing Customer.io S3 bucket name.',
    })
  }
}