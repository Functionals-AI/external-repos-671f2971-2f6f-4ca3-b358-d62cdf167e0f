import { CfnOutput, Fn, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'

import { IConfig } from '@mono/common/lib/config'
import { createIAMManagedPolicyName, createIAMRoleName, createS3BucketName } from '../naming'

const _DOMAIN = 'common'

export class CommonDataStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)    

//    const commonDataS3BucketKey = kms.Key.fromKeyArn(this, 'CommonDataS3BucketKey', 'arn:aws:kms:us-west-2:914374131125:key/1154eb33-5a5a-45e3-8f49-75ecd63e85ba')
  
    const commonDataS3BucketKey = new kms.Key(this, 'CommonDataS3BucketKey', {
      enabled: true,
      alias: 'common-data/common-data',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
    })

    commonDataS3BucketKey.grantEncryptDecrypt(new iam.AccountRootPrincipal)
      
    new CfnOutput(this, 'CommonDataS3KmsKeyOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'ExternalDataS3KmsKeyArn']),
      value: commonDataS3BucketKey.keyArn,
      description: 'External data S3 KMS key arn',
    })

    const commonDataBucketName = createS3BucketName(config, _DOMAIN, 'data')
      
    const commonDataS3Bucket = new s3.Bucket(this, 'CommonlDataS3Bucket', {
      bucketName: commonDataBucketName,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: commonDataS3BucketKey,
      eventBridgeEnabled: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true,
    })

    const commonDataUnloadPolicyName = createIAMManagedPolicyName(config, _DOMAIN, 'DataUnload')

    const commonDataUnloadManagedPolicy = new iam.ManagedPolicy(this, 'CommonDataS3UnLoadPolicy', {
    description: 'Grant permissions to load data into S3. IE: In order to do a copy to s3 from Redshift.',
    managedPolicyName: commonDataUnloadPolicyName,
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey'
            ],
            resources: [
              commonDataS3BucketKey.keyArn,
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:ListBucket',
              's3:GetBucketLocation'
            ],
            resources: [
              commonDataS3Bucket.bucketArn,
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:PutObject',
              's3:AbortMultipartUpload',
              's3:ListMultipartUploadParts'
            ],
            resources: [
              `${commonDataS3Bucket.bucketArn}/*`,
            ]
          })
        ]
      })
    })

    const commonDataLoadPolicyName = createIAMManagedPolicyName(config, _DOMAIN, 'DataLoad')

    const commonDataLoadManagedPolicy = new iam.ManagedPolicy(this, 'CommonDataS3LoadPolicy', {
      description: 'Grant permissions S.T. Readshift can perform an S3 copy.',
      managedPolicyName: commonDataLoadPolicyName,
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey'
            ],
            resources: [
              commonDataS3BucketKey.keyArn
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:ListBucket',
              's3:GetBucketLocation'
            ],
            resources: [
              commonDataS3Bucket.bucketArn  
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:GetObject'
            ],
            resources: [
              `${commonDataS3Bucket.bucketArn}/*`
            ]
          })
        ]
      })
    })

    const commonDataLoadRoleName = createIAMRoleName(config, _DOMAIN, 'DataRedshiftS3Copy')

    const commonDataRedshiftS3CopyRole = new iam.Role(this, 'CommonDataRedshiftS3CopyRole', {
      assumedBy: new iam.ServicePrincipal('redshift.amazonaws.com'),
      description: 'Role assumed by Redshift in order to do a COPY from s3',
      managedPolicies: [
        commonDataLoadManagedPolicy
      ],
      roleName: commonDataLoadRoleName,
    })

    if (config.ops.retool?.host) {
      commonDataS3Bucket.addCorsRule({
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT, s3.HttpMethods.DELETE],
        allowedOrigins: [config.ops.retool.host],
        allowedHeaders: ['*'],
      })
    }

    new CfnOutput(this, 'CommonDataS3BucketArnOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'CommonDataS3BucketArn']),
      value: commonDataS3Bucket.bucketArn,
      description: 'Common data S3 bucket arn',
    })

    new CfnOutput(this, 'CommonDataRedshiftS3CopyRoleArnOuptut', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'CommonDataRedshiftS3CopyRoleArn']),
      value: commonDataRedshiftS3CopyRole.roleArn,
      description: 'Common data Redshift S3 copy role arn'
    })
  }
}