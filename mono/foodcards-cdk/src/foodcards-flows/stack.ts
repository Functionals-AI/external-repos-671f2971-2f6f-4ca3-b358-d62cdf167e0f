import { Fn, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as s3 from 'aws-cdk-lib/aws-s3'

import { IConfig } from '@mono/common/lib/config'
import { createWorkflow } from '@mono/common-cdk/lib/flows'
import { flows, dependencies } from '@mono/foodcards-flows'

const domain = 'Foodcards'

export class FoodcardsFlowsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const {taskDefinition} = createWorkflow({config, flows, domain, dependencies: dependencies(), stack: this})

    const foodcardsS3KmsKeyArn = Fn.importValue('foodcards-FoodcardsS3KmsKeyArn')
    const foodcardsS3Key = kms.Key.fromKeyArn(this, 'FoodcardsS3KmsKey', foodcardsS3KmsKeyArn)
    foodcardsS3Key.grantEncryptDecrypt(taskDefinition.taskRole)

    const foodcardsS3BucketArn = Fn.importValue('foodcards-FoodcardsS3BucketArn')
    const foodcardsS3Bucket = s3.Bucket.fromBucketArn(this, 'SftpServerBucket', foodcardsS3BucketArn)
    foodcardsS3Bucket.grantReadWrite(taskDefinition.taskRole)

  }
}
