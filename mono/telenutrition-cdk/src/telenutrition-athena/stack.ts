import * as kms from 'aws-cdk-lib/aws-kms'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { RemovalPolicy } from 'aws-cdk-lib'

import { IConfig } from '@mono/common/lib/config'

export class TelenutritionAthenaStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const athenaUnloadS3BucketKey = new kms.Key(this, 'TelenutritionAthenaUnloadS3BucketKey', {
      enabled: true,
      alias: 'telenutrition-athena/unload',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
    })

    athenaUnloadS3BucketKey.grantEncryptDecrypt(new iam.AccountRootPrincipal)

    const athenaUnloadS3Bucket = new s3.Bucket(this, 'TelenutritionAthenaUloadS3Bucket', {
      bucketName: `foodsmart-${config.env}-telenutrition-athena-unload-${config.aws.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: athenaUnloadS3BucketKey,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: false,
    })

    const athenaUnloadManagedPolicy = new iam.ManagedPolicy(this, 'TelenutritionAthenaUnloadPolicy', {
      description: 'Grant permissions for Athena to unlaod views to the Athena unload S3 bucket.',
      managedPolicyName: 'FoodsmartTelenutritionAthenaUnloadPolicy',
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
              athenaUnloadS3BucketKey.keyArn
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:ListBucket',
              's3:GetBucketLocation'
            ],
            resources: [
              athenaUnloadS3Bucket.bucketArn  
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:PutObject',
              's3:AbortMultipartUpload',
              's3:ListMultipartUploadParts'
            ],
            resources: [
              `${athenaUnloadS3Bucket.bucketArn}/*`
            ]
          })
        ]
      })
    })

    const athenaStorageIntegrationUser = iam.User.fromUserArn(this, 'TelenutritionAthenaUnloadUser', config.athena.s3StorageIntegration.awsUserArn)
    const athenaUnloadRole = new iam.Role(this, 'TelenutritionAthenaUnloadRole', {
      assumedBy: new iam.PrincipalWithConditions(
        athenaStorageIntegrationUser.grantPrincipal,
        {
          'StringEquals': {
            'sts:ExternalId': config.athena.s3StorageIntegration.awsExternalId
          }
        }
      ),
      description: 'Role assumed by Athena user in order to upload Athena Data View views to s3.',
      managedPolicies: [
        athenaUnloadManagedPolicy
      ],
      roleName: 'FoodsmartTelenutritionAthenaUnloadRole'
    })

    const athenaLoadManagedPolicy = new iam.ManagedPolicy(this, 'TelenutritionAthenaLoadPolicy', {
      description: 'Grant permissions S.T. Readshift can perform an S3 copy.',
      managedPolicyName: 'FoodsmartTelenutritionAthenaLoadPolicy',
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
              athenaUnloadS3BucketKey.keyArn
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:ListBucket',
              's3:GetBucketLocation'
            ],
            resources: [
              athenaUnloadS3Bucket.bucketArn  
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:GetObject',
              's3:AbortMultipartUpload',
              's3:ListMultipartUploadParts'
            ],
            resources: [
              `${athenaUnloadS3Bucket.bucketArn}/*`
            ]
          })
        ]
      })
    })

    const athenaRedshiftS3CopyRole = new iam.Role(this, 'TelenutritionAthenaRedshiftS3CopyRole', {
      assumedBy: new iam.ServicePrincipal('redshift.amazonaws.com'),
      description: 'Role assumed Redshift in order to a COPY from s3',
      managedPolicies: [
        athenaLoadManagedPolicy
      ],
      roleName: 'FoodsmartTelenutritionAthenaRedshiftS3CopyRole'
    })
  }
}