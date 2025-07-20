import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { CfnParameter, Fn, RemovalPolicy } from 'aws-cdk-lib'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as firehose from '@aws-cdk/aws-kinesisfirehose-alpha'


import { ICluster } from 'aws-cdk-lib/aws-ecs'
import { IConfig } from '@mono/common/lib/config'
import { createECSServiceAlarms } from '@mono/common-cdk/lib/ops/alarms'
import { createECSServiceDashboard } from '@mono/common-cdk/lib/ops/dashboards'
import { createBuildProject } from './build'
import * as _ from 'lodash'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

const _DOMAIN = 'telenutrition'

export interface CreateApiServiceOptions {
  stackName: string,
  vpc: ec2.IVpc,
  subnets: ec2.SelectedSubnets,
  cluster: ICluster,
  config: IConfig,
  secrets: secretsmanager.ISecret,
  albSecurityGroup: ec2.ISecurityGroup,
}

export interface CreateApiServiceResult {

}

export function createApiService(stack: Construct, options: CreateApiServiceOptions): CreateApiServiceResult {
  const { stackName, vpc, subnets, config, cluster, secrets, albSecurityGroup } = options

  const name = 'telenutrition-api'
  const nameUpper = name.split(/[^a-z]+/i).map(_.upperFirst).join('')

  name.split(/[^a-z]/i)

  const { repository } = createBuildProject(stack, {
    name,
    vpc,
    subnets,
    config,
    buildContext: '.'
  })

  // the role assumed by the task and its containers
  const taskRole = new iam.Role(stack, `${nameUpper}TaskRole`, {
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    roleName: `${nameUpper}TaskRole`,
    description: "Role that the api task definitions use to run the api code",
  })

  const imageTagParameter = new CfnParameter(stack, 'ApiImageBuildTag', {
    description: 'Telenutrition api image tag.',
    type: 'String'
  })


  // A really basic task definition
  const taskDefinition = new ecs.TaskDefinition(stack, `${nameUpper}TaskDefinition`, {
    taskRole: taskRole,
    compatibility: ecs.Compatibility.FARGATE,
    networkMode: ecs.NetworkMode.AWS_VPC,
    family: `${stackName}-api-task`,
    cpu: '2048',
    memoryMiB: '4096',
  })

  secrets.grantRead(taskDefinition.taskRole)

  const logGroup = new LogGroup(stack, 'TelenutritionApiTaskDefinitionLogGroup', {
    logGroupName: `/foodsmart/telenutrition-api`,
    retention: RetentionDays.ONE_MONTH,
    removalPolicy: RemovalPolicy.DESTROY,
  })

  // The docker container including the image to use
  const container = taskDefinition.addContainer(`${nameUpper}Container`, {
    image: ecs.RepositoryImage.fromEcrRepository(repository, imageTagParameter.valueAsString),
    command: ['npm', 'run', 'start'],
    environment: {
      NODE_ENV: config.env,
      APP_VERSION: imageTagParameter.valueAsString,
    },
    // store the logs in cloudwatch 
    logging: ecs.LogDriver.awsLogs({
      logGroup: logGroup,
      streamPrefix: 'api-task'
    }),
  })

  // the docker container port mappings within the container
  container.addPortMappings({ containerPort: config.telenutrition_api.server.port });

  // Security groups to allow connections from the application load balancer to the fargate containers
  const taskSecurityGroup = new ec2.SecurityGroup(stack, `${nameUpper}TaskSecurityGroup`, {
    vpc,
    allowAllOutbound: true,
  })

  taskSecurityGroup.connections.allowFrom(
    albSecurityGroup,
    ec2.Port.allTcp(),
    "Application load balancer"
  )

  if (config.common_cdk.common_cache.shortlink_table_arn) {
    const shortlinkTable = dynamodb.Table.fromTableArn(stack, 'ShortlinkTable', config.common_cdk.common_cache.shortlink_table_arn)
    shortlinkTable.grantReadWriteData(taskDefinition.taskRole)  
  }

  if (config.common_cdk.common_cache.ratelimit_table_arn) {
    const ratelimitTable = dynamodb.Table.fromTableArn(stack, 'RatelimitTable', config.common_cdk.common_cache.ratelimit_table_arn)
    ratelimitTable.grantReadWriteData(taskDefinition.taskRole)  
  }

  const rdsSecurityGroup = ec2.SecurityGroup.fromLookupById(stack, 'RdsSecurityGroup', config.common_cdk.vpcs.default.securityGroups.rds.id)
  rdsSecurityGroup.addIngressRule(taskSecurityGroup, ec2.Port.tcp(3306), 'Telenutrition API access to RDS MySQL')

  const commonStoreSecurityGroup = ec2.SecurityGroup.fromLookupById(stack, 'CommonStoreSecurityGroup', config.common_cdk.vpcs.default.securityGroups.rds_common_store.id)
  commonStoreSecurityGroup.addIngressRule(taskSecurityGroup, ec2.Port.tcp(5432), `Telenutrition API access to RDS common store cluster.`)

  const redshiftSecurityGroup = ec2.SecurityGroup.fromLookupById(stack, 'RedshiftSecurityGroup', config.common_cdk.vpcs.default.securityGroups.redshift.id)
  redshiftSecurityGroup.addIngressRule(taskSecurityGroup, ec2.Port.tcp(5439), 'Teleapp API access to Redshift')

  // The ECS Service used for deploying tasks 
  const service = new ecs.FargateService(stack, `${_(name)}FargateService`, {
    serviceName: nameUpper,
    cluster,
    desiredCount: config.telenutrition_api.server.count,
    taskDefinition,
    securityGroups: [taskSecurityGroup],
    vpcSubnets: subnets,
  })

  const alarms = createECSServiceAlarms(stack, { domain: _DOMAIN, serviceName: name, service, }, config)

  createECSServiceDashboard(stack, { domain: _DOMAIN, alarms, }, config)

  // add to a target group so make containers discoverable by the application load balancer
  const albTargetGroup = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(stack, 'FoodsmartcomTelenutritionApiTargetGroup', {
    targetGroupArn: Fn.importValue('CommonNetwork-FoodsmartcomTelenutritionApiTargetGroupArn')
  })

  service.attachToApplicationTargetGroup(albTargetGroup)

  // Api given permissions to putrecords to analytics events firehose stream
  const firehoseDeliveryStream = firehose.DeliveryStream.fromDeliveryStreamArn(stack, 'FirehoseDeliveryStream', config.analytics_cdk.events.firehoseArn)
  firehoseDeliveryStream.grantPutRecords(taskDefinition.taskRole)

  return {}
}

export default {
  createApiService,
}