/**
 * Resources in order to receive client data from external soures, ie: their SFTP servers.
 */
import { CfnOutput, Fn, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'

import { IConfig } from '@mono/common/lib/config'

export class OpsDataStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)    

    const externalDataS3BucketKey = new kms.Key(this, 'ExternalDataS3BucketKey', {
      enabled: true,
      alias: 'ops-data/external-data',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
    })
    externalDataS3BucketKey.grantEncryptDecrypt(new iam.AccountRootPrincipal)
    
    new CfnOutput(this, 'ExternalDataS3KmsKeyOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'ExternalDataS3KmsKeyArn']),
      value: externalDataS3BucketKey.keyArn,
      description: 'External data S3 KMS key arn',
    })
    
    const externalDataS3Bucket = new s3.Bucket(this, 'ExternalDataS3Bucket', {
      bucketName: `foodsmart-${config.env}-external-data-${config.aws.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: externalDataS3BucketKey,
      eventBridgeEnabled: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true,
    })

    const eligibilityReadyKmsKeyArn = config.ops_cdk.data.destBuckets.eligibilityReady.kmsKeyArn
    const eligibilityReadyBucketName = config.ops_cdk.data.destBuckets.eligibilityReady.name
    const eligibilityReadyBucket = s3.Bucket.fromBucketName(this, 'EligibilityReadyBucket', eligibilityReadyBucketName)

    const opsDataUnloadManagedPolicy = new iam.ManagedPolicy(this, 'OpsDataS3UnLoadPolicy', {
      description: 'Grant permissions to load data into S3. IE: In order to do a copy to s3 from Redshift.',
      managedPolicyName: 'FoodsmartOpsDataUnloadPolicy',
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
              externalDataS3BucketKey.keyArn,
              eligibilityReadyKmsKeyArn,
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:ListBucket',
              's3:GetBucketLocation'
            ],
            resources: [
              externalDataS3Bucket.bucketArn,
              eligibilityReadyBucket.bucketArn,
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:PutObject',
              's3:AbortMultipartUpload',
              's3:ListMultipartUploadParts'
            ],
            resources: [
              `${externalDataS3Bucket.bucketArn}/*`,
              `${eligibilityReadyBucket.bucketArn}/*`
            ]
          })
        ]
      })
    })

    const opsDataLoadManagedPolicy = new iam.ManagedPolicy(this, 'OpsDataS3LoadPolicy', {
      description: 'Grant permissions S.T. Readshift can perform an S3 copy.',
      managedPolicyName: 'FoodsmartOpsDataLoadPolicy',
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
              externalDataS3BucketKey.keyArn
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:ListBucket',
              's3:GetBucketLocation'
            ],
            resources: [
              externalDataS3Bucket.bucketArn  
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:GetObject'
            ],
            resources: [
              `${externalDataS3Bucket.bucketArn}/*`
            ]
          })
        ]
      })
    })

    const opsDataRedshiftS3CopyRole = new iam.Role(this, 'OpsDataRedshiftS3CopyRole', {
      assumedBy: new iam.ServicePrincipal('redshift.amazonaws.com'),
      description: 'Role assumed by Redshift in order to do a COPY from s3',
      managedPolicies: [
        opsDataLoadManagedPolicy
      ],
      roleName: 'FoodsmartOpsDataRedshiftS3CopyRole'
    })
    const opsDataRedshiftS3UnloadRole = new iam.Role(this, 'OpsDataRedshiftS3UnloadRole', {
      assumedBy: new iam.ServicePrincipal('redshift.amazonaws.com'),
      description: 'Role assumed by Redshift in order to do a COPY from s3',
      managedPolicies: [
        opsDataUnloadManagedPolicy
      ],
      roleName: 'FoodsmartOpsDataRedshiftS3UnloadRole'
    })

    new CfnOutput(this, 'ExternalDataS3BucketArnOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'ExternalDataS3BucketArn']),
      value: externalDataS3Bucket.bucketArn,
      description: 'External data S3 bucket arn',
    })

    new CfnOutput(this, 'OpsDataRedshiftS3CopyRoleArnOuptut', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'OpsDataRedshiftS3CopyRoleArn']),
      value: opsDataRedshiftS3CopyRole.roleArn,
      description: 'Ops Data Redshift S3 copy role arn'
    })

    new CfnOutput(this, 'OpsDataRedshiftS3UnloadRoleArnOuptut', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'OpsDataRedshiftS3UnloadRoleArn']),
      value: opsDataRedshiftS3UnloadRole.roleArn,
      description: 'Ops Data Redshift S3 unload role arn'
    })
  }
}
