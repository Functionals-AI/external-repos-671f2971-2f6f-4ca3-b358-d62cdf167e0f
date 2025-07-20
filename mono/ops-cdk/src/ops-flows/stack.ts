import { Fn, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { EventBus } from 'aws-cdk-lib/aws-events'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'

import { IConfig } from '@mono/common/lib/config'
import { IConfig as IDomainConfig } from '@mono/ops/lib/config'
import {createWorkflow} from '@mono/common-cdk/lib/flows'
import {flows, dependencies} from '@mono/ops-flows'

const domain = 'Ops'

export class OpsFlowsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig, domainConfig: IDomainConfig) {
    super(scope, id, props)

    const {taskDefinition} = createWorkflow({config, flows, domain, dependencies: dependencies(), stack: this})

    const commonDataKmsKeyArn = config.ops_cdk.data.destBuckets.commonData.kmsKeyArn
    const commonDataKey = kms.Key.fromKeyArn(this, 'CommonDataKmsKey', commonDataKmsKeyArn)
    commonDataKey.grantEncryptDecrypt(taskDefinition.taskRole)

    const commonDataBucketName = config.ops_cdk.data.destBuckets.commonData.name
    const commonDataBucket = s3.Bucket.fromBucketName(this, 'CommonDataBucket', commonDataBucketName)
    commonDataBucket.grantReadWrite(taskDefinition.taskRole)

    const sftpKmsKeyArn = Fn.importValue('OpsTransfer-SftpKmsKeyArn')
    const sftpKey = kms.Key.fromKeyArn(this, 'SftpKmsKey', sftpKmsKeyArn)
    sftpKey.grantEncryptDecrypt(taskDefinition.taskRole)
  
    const sftpServerBucketArn = Fn.importValue('OpsTransfer-SftpServerBucketArn')
    const sftpServerBucket = s3.Bucket.fromBucketArn(this, 'SftpServerBucket', sftpServerBucketArn)
    sftpServerBucket.grantReadWrite(taskDefinition.taskRole)

    const sftpArchiveBucketName = config.ops_cdk.sftp.sftpArchiveBucket.name
    const sftpArchiveBucket = s3.Bucket.fromBucketName(this, 'SftpArchiveBucket', sftpArchiveBucketName)
    sftpArchiveBucket.grantReadWrite(taskDefinition.taskRole)

    const externalDataKmsKeyArn = config.ops_cdk.data.destBuckets.externalData.kmsKeyArn
    const externalDataKey = kms.Key.fromKeyArn(this, 'ExternalDataKmsKey', externalDataKmsKeyArn)
    externalDataKey.grantEncryptDecrypt(taskDefinition.taskRole)

    const externalDataBucketName = config.ops_cdk.data.destBuckets.externalData.name
    const externalDataBucket = s3.Bucket.fromBucketName(this, 'ExternalDataBucket', externalDataBucketName)
    externalDataBucket.grantReadWrite(taskDefinition.taskRole)

    const eligibilityReadyKmsKeyArn = config.ops_cdk.data.destBuckets.eligibilityReady.kmsKeyArn
    const eligibilityReadyKey = kms.Key.fromKeyArn(this, 'EligibilityReadyKmsKey', eligibilityReadyKmsKeyArn)
    eligibilityReadyKey.grantEncryptDecrypt(taskDefinition.taskRole)

    const eligibilityReadyBucketName = config.ops_cdk.data.destBuckets.eligibilityReady.name
    const eligibilityReadyBucket = s3.Bucket.fromBucketName(this, 'EligibilityReadyBucket', eligibilityReadyBucketName)
    eligibilityReadyBucket.grantReadWrite(taskDefinition.taskRole)

    const opsSecrets = secretsmanager.Secret.fromSecretCompleteArn(this, 'OpsSecrets', domainConfig.aws.secretsmanagerArn)
    opsSecrets.grantRead(taskDefinition.taskRole)

    const opsEligibilityTopic = sns.Topic.fromTopicArn(this,'OpsEligibilityAlertsTopic', config.ops_cdk.sns.eligibilityArn)
    opsEligibilityTopic.grantPublish(taskDefinition.taskRole)


    for (const [client, opsDataConfig] of Object.entries(domainConfig.ops.data)) {
      if (opsDataConfig.aws?.secretsmanagerArn) {
        const opsDataSecrets = secretsmanager.Secret.fromSecretCompleteArn(this, `OpsData${client}Secrets`, opsDataConfig.aws.secretsmanagerArn)

        opsDataSecrets.grantRead(taskDefinition.taskRole)
      }
    }
    
    if (config.ops?.eligibility?.appStackId) {
      const opsflowEligibilityECSInvokeManagedPolicy = new iam.ManagedPolicy(this, 'OpsflowEligibilityECSInvokePolicy', {
        description: 'Policy assumed by ops flows to invoke the ECSScripts task',
        managedPolicyName: 'OpsflowEligibilityECSInvokePolicy',
        document: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement(
              {
                actions: [
                  'cloudformation:DescribeStackResource',
                ],
                resources: [
                  config.ops.eligibility.appStackId
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

      taskDefinition.taskRole.addManagedPolicy(opsflowEligibilityECSInvokeManagedPolicy)
    }
    
    for (const [topicKey, alertTopicArn] of Object.entries(config.ops_cdk.sns)) {
      if ([
        'alertsCalOptimaReferralsArn',
        'alertsIncentivesInstacartArn',
        'alertsLogsArn',
      ].includes(topicKey)) {
        const constructName = `Ops${topicKey[0].toUpperCase()}${topicKey.substring(1)}`
        const alertTopic = sns.Topic.fromTopicArn(this, constructName, alertTopicArn)

        alertTopic.grantPublish(taskDefinition.taskRole)
      }
    }

    taskDefinition.addToTaskRolePolicy(new iam.PolicyStatement({
      resources: [`arn:aws:logs:${config.aws.region}:${config.aws.accountId}:log-group:*`],
      actions: ['logs:StartQuery', 'logs:GetQueryResults'],
      effect: iam.Effect.ALLOW,
    }))

    // 
    // This fails in production upon CDK deploy.
    //
    // taskDefinition.addToTaskRolePolicy(new iam.PolicyStatement({
    //  resources: [`arn:aws:ecs:${config.aws.region}:${config.aws.accountId}:${config.marketing_cdk.marketing_web_ecs.service_name}`],
    //  actions: ['ecs:update_service'],
    //  effect: iam.Effect.ALLOW,
    // }))
    //

    const eventBus = EventBus.fromEventBusArn(this, 'DefaultEventBus', `arn:aws:events:us-west-2:${config.aws.accountId}:event-bus/default`)

    eventBus.grantPutEventsTo(taskDefinition.taskRole)
  }
}