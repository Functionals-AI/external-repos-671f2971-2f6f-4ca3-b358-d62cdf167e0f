import { CfnParameter, Stack, StackProps, RemovalPolicy, Fn } from 'aws-cdk-lib'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import { EventBus } from 'aws-cdk-lib/aws-events'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as kinesis from 'aws-cdk-lib/aws-kinesis'
import { Construct } from 'constructs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as kms from 'aws-cdk-lib/aws-kms'

import Config from '@mono/common-cdk/lib/config'
import {createVpc} from '@mono/common-cdk/lib/vpc'
import Secrets from '@mono/common-cdk/lib/secrets'

import {createFlowsBuild} from './build'

import * as _ from 'lodash'

import { createStatemachine, WorkflowContext } from '@mono/common-cdk/lib/flows'
import { createFlowsDashboard } from '@mono/common-cdk/lib/ops/dashboards'
import flows from '@mono/telenutrition-flows'
import { IConfig } from '@mono/common/lib/config'

export class TelenutritionFlowsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const cdkConfig = Config.getConfig()
    const domain = 'Telenutrition'

    const flowsImageTagParameter = new CfnParameter(this, 'TelenutritionFlowsImageBuildTag', {
      description: "Telenutrition Flows image tag",
      type: "String"
    })

    const {vpc, subnets} = createVpc(this, cdkConfig)
    const cluster = new ecs.Cluster(this, `TelenutritionFlowsCluster`, {
      clusterName: `TelenutritionFlows`,
      containerInsights: true,
      vpc,
    })

    const ecsTaskSecurityGroup = new ec2.SecurityGroup(this, 'TelenutritionFlowsClusterSecurityGroup', {
      securityGroupName: `telenutrition-flows-cluster-sg`,
      vpc,
      allowAllOutbound: true,
    })
    
    const codebuildSecurityGroup = new ec2.SecurityGroup(this, 'TelenutritionFlowsCodeBuildSecurityGroup', {
      securityGroupName: `telenutrition-flows-codebuild-sg`,
      vpc,
      allowAllOutbound: true,
    })

    const {repository: flowsRepository} = createFlowsBuild(this, {vpc, subnets, config: cdkConfig, securityGroup: codebuildSecurityGroup})
    const flowsImage = ecs.ContainerImage.fromEcrRepository(flowsRepository, flowsImageTagParameter.valueAsString)
    const flowsTaskDefinition = new ecs.TaskDefinition(this, 'TelenutritionFlowsTaskDefinition', {
      memoryMiB: '8192',
      cpu: '2048',
      compatibility: ecs.Compatibility.FARGATE,
    })

    if (config.common_cdk.common_cache.shortlink_table_arn) {
      const shortlinkTable = dynamodb.Table.fromTableArn(this, 'ShortlinkTable', config.common_cdk.common_cache.shortlink_table_arn)
      shortlinkTable.grantWriteData(flowsTaskDefinition.taskRole)
    }

    const secrets = Secrets.getSecrets(this)
    secrets.grantRead(flowsTaskDefinition.taskRole)

    const kinesisStream = kinesis.Stream.fromStreamArn(this, 'AnalyticsEventsStream', config.analytics_cdk.events.kinesisArn)

    kinesisStream.grantWrite(flowsTaskDefinition.taskRole)

    const eventBus = EventBus.fromEventBusArn(this, 'DefaultEventBus', `arn:aws:events:us-west-2:${config.aws.accountId}:event-bus/default`)

    eventBus.grantPutEventsTo(flowsTaskDefinition.taskRole)
     
    const logGroup = new LogGroup(this, `TelenutritionFlowsLogGroup`, {
      logGroupName: `/foodsmart/telenutrition-flows/tasks`,
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    })
     
     const flowsContainerDefinition = flowsTaskDefinition.addContainer('TelenutritionFlowsContainer', {
       image: flowsImage,
       environment: {
         NODE_ENV: cdkConfig.env,
         APP_VERSION: flowsImageTagParameter.valueAsString,
        },
       logging: ecs.LogDrivers.awsLogs({
         streamPrefix: 'flows-tasks',
         logGroup,
       }),
     })

     //
     // Create a shared log group for all state machines to avoid Cloudwatch Logs resource policy
     // body size limites. See issue referenced below.
     //
     const stateMachinesLogGroup = new LogGroup(this, `TelenutritionFlowStateMachinesLogs`, {
      //
      // Per: https://github.com/aws/aws-cdk/issues/19353
      //
      // Seems like there is a default policy document that starts to exceed the policy character size limit.
      // Unfortunately, creating individual policies won't help either as there is a limit of 10 per account / region.
      //
      logGroupName: `/foodsmart/${domain.toLowerCase()}-flows/state-machines`,
     })
 
     const workflowContext: WorkflowContext = {
       stack: this,
       config,
       domain: 'Telenutrition',
       ecsTask: {
         cluster,
         subnets,
         securityGroups: [ecsTaskSecurityGroup],
         taskDefinition: flowsTaskDefinition,
         containerDefinition: flowsContainerDefinition,
       },
       logGroup: stateMachinesLogGroup,
     }

     //
     // Keep track of alarms by type in order to create a dashboard.
     //

     const alarms: Record<'executionTimeAlarms' | 'executionsFailedAlarms' | 'executionsTimedOutAlarms', cloudwatch.Alarm[]> = {
       executionTimeAlarms: [],
       executionsFailedAlarms: [],
       executionsTimedOutAlarms: [],
     }
 
     for (let [id, factory] of Object.entries(flows)) {
      const builder = factory(config)

      if (builder === undefined) {
        continue
      }

      const { stateMachine, alarms: { executionTimeAlarm, executionsFailedAlarm, executionsTimedOutAlarm } } = createStatemachine(workflowContext, id, builder)

      alarms.executionTimeAlarms.push(executionTimeAlarm)
      alarms.executionsFailedAlarms.push(executionsFailedAlarm)
      alarms.executionsTimedOutAlarms.push(executionsTimedOutAlarm)
  
      stateMachine.grantTaskResponse(flowsTaskDefinition.taskRole)
     }

     const rdsSecurityGroup = ec2.SecurityGroup.fromLookupById(this, 'RdsSecurityGroup', config.common_cdk.vpcs.default.securityGroups.rds.id)
     rdsSecurityGroup.addIngressRule(ecsTaskSecurityGroup, ec2.Port.tcp(3306), 'Telenutrition flows access to RDS MySQL')

     const commonStoreSecurityGroup = ec2.SecurityGroup.fromLookupById(this, 'CommonStoreSecurityGroup', config.common_cdk.vpcs.default.securityGroups.rds_common_store.id)
     commonStoreSecurityGroup.addIngressRule(ecsTaskSecurityGroup, ec2.Port.tcp(5432), `Telenutrition API access to RDS common store cluster.`)


     const scratchBucketArn = Fn.importValue('CommonFlows-ScratchBucketArn')
     const scratchBucket = s3.Bucket.fromBucketArn(this, 'CommonFlowsScratchBucket', scratchBucketArn)
     scratchBucket.grantReadWrite(flowsTaskDefinition.taskRole)

     createFlowsDashboard(this, { domain, alarms }, config)

     // The public key for this should be converted to jwk format (using the AWS KeyId) and added to Okta.
     const oktaAuthKey = new kms.Key(this, 'OktaAuthKey', {
       enabled: true,
       alias: 'okta-auth',
       keySpec: kms.KeySpec.RSA_2048,
       keyUsage: kms.KeyUsage.SIGN_VERIFY
     })
     oktaAuthKey.grant(flowsTaskDefinition.taskRole, 'kms:Sign', 'kms:DescribeKey')

     const oktaDpopKey = new kms.Key(this, 'OktaDpopKey', {
      enabled: true,
      alias: 'okta-dpop',
      keySpec: kms.KeySpec.RSA_2048,
      keyUsage: kms.KeyUsage.SIGN_VERIFY
     })
     oktaDpopKey.grant(flowsTaskDefinition.taskRole, 'kms:Sign', 'kms:GetPublicKey')
  }
}


