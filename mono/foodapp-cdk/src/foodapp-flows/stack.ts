import { Fn, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { EventBus } from 'aws-cdk-lib/aws-events'

import { IConfig } from '@mono/common/lib/config'
import naming from '@mono/common-cdk/lib/naming'
import { createWorkflow } from '@mono/common-cdk/lib/flows'
import { flows, dependencies } from '@mono/foodapp-flows'

const domain = 'Foodapp'

export class FoodappFlowsStack extends Stack {
  constructor(scope: Construct, id: string, config: IConfig, props: StackProps) {
    super(scope, id, props)

    const foodappConfig = config.foodapp

    if (!foodappConfig) {
      console.log(`FoodappFlowsStack: Stack cannot be created, foodapp configuration is missing.`)
      return
    }

    const {taskDefinition} = createWorkflow({config, flows, domain, dependencies: dependencies(), stack: this})

    const sftpKmsKeyArn = Fn.importValue('OpsTransfer-SftpKmsKeyArn')
    const sftpKey = kms.Key.fromKeyArn(this, 'SftpKmsKey', sftpKmsKeyArn)

    const eligibilityReadyBucket = new s3.Bucket(this, 'EligibilityReadyBucket', {
      bucketName: naming.createS3BucketName(config, 'foodapp', 'eligibility'),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: sftpKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true,
    })
    eligibilityReadyBucket.grantReadWrite(taskDefinition.taskRole)

    sftpKey.grantEncryptDecrypt(taskDefinition.taskRole)

    const sftpArchiveBucket = s3.Bucket.fromBucketName(this, 'SftpArchiveBucket', `foodsmart-${config.env}-sftp-archive-${config.aws.region}`)
    sftpArchiveBucket.grantReadWrite(taskDefinition.taskRole)

    const sftpServerBucketArn = Fn.importValue('OpsTransfer-SftpServerBucketArn')
    const sftpServerBucket = s3.Bucket.fromBucketArn(this, 'SftpServerBucket', sftpServerBucketArn)
    sftpServerBucket.grantReadWrite(taskDefinition.taskRole)

    const {
      appStackId,
    } = foodappConfig.eligibility
    // give task definition permission to describe stack resource of stack App
    const foodappEligibilityECSInvokeManagedPolicy = new iam.ManagedPolicy(this, 'FoodappEligibilityFlowsECSInvokePolicy', {
      description: 'Policy assumed by Foodapp flows to invoke the ECSScripts task',
      managedPolicyName: 'FoodappEligibilityFlowsECSInvokePolicy',
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement(
            {
              actions: [
                'cloudformation:DescribeStackResource',
              ],
              resources: [
                appStackId
              ]
            }
          ),
          new iam.PolicyStatement(
            {
              actions: [
                'ecs:RunTask',
              ],
              resources: [
                `arn:aws:ecs:${config.aws.region}:${config.aws.accountId}:task-definition/app-ECSScriptsTask-*`
              ]
            }
          ),
          new iam.PolicyStatement(
            {
              actions: [
                'ecs:DescribeTasks',
              ],
              resources: [
                // need to put this in config or somewhere else
                `arn:aws:ecs:${config.aws.region}:${config.aws.accountId}:task/App/*`
              ]
            }
          ),
          new iam.PolicyStatement(
            {
              actions: [
                'iam:PassRole'
              ],
              resources: [
                `arn:aws:iam::${config.aws.accountId}:role/ZipongoAppTaskExecutionRole`,
                `arn:aws:iam::${config.aws.accountId}:role/ZipongoAppScriptsRole`
              ]
            }
          ),
        ]
      })
    })

    taskDefinition.taskRole.addManagedPolicy(foodappEligibilityECSInvokeManagedPolicy)

    const eventBus = EventBus.fromEventBusArn(this, 'DefaultEventBus', `arn:aws:events:us-west-2:${config.aws.accountId}:event-bus/default`)

    eventBus.grantPutEventsTo(taskDefinition.taskRole)

  }
}