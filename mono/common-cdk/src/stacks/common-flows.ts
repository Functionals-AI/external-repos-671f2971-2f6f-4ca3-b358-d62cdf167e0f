import { CfnOutput, Fn, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IConfig } from '@mono/common/lib/config'
import * as s3 from 'aws-cdk-lib/aws-s3'


export class CommonFlowsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const scratchBucket = new s3.Bucket(this, 'CommonFlowsScratchBucket', {
      bucketName: `foodsmart-${config.env}-common-flows-scratch-${config.aws.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
    })

    new CfnOutput(this, 'ScratchBucketOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'ScratchBucketArn']),
      value: scratchBucket.bucketArn,
      description: 'Common flows scratch bucket arns',
    })
  }
}