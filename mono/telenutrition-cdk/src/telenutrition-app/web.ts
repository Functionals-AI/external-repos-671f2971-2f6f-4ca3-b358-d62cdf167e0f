import * as _ from 'lodash'

import { Construct } from 'constructs'
import { CfnParameter, Fn, RemovalPolicy } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { ICluster } from 'aws-cdk-lib/aws-ecs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

import { IConfig } from '@mono/common/lib/config'
import { createBuildProject } from './build'
import { Bucket } from 'aws-cdk-lib/aws-s3'

export interface CreateWebServiceOptions {
  stackName: string,
  vpc: ec2.IVpc,
  subnets: ec2.SelectedSubnets,
  cluster: ICluster,
  config: IConfig,
  secrets: secretsmanager.ISecret,
  albSecurityGroup: ec2.ISecurityGroup,
}

export interface CreateWebServiceResult {
}

export function createWebService(stack: Construct, options: CreateWebServiceOptions): CreateWebServiceResult {
  const { stackName, vpc, subnets, config, cluster, secrets, albSecurityGroup } = options

  const name = 'telenutrition-web'
  const nameUpper = name.split(/[^a-z]+/i).map(_.upperFirst).join('')

  name.split(/[^a-z]/i)

  const imageTagParameter = new CfnParameter(stack, 'WebImageBuildTag', {
    description: 'Telenutrition web image tag.',
    type: 'String'
  })

  const { repository, codeBuildRole } = createBuildProject(stack, {
    name,
    vpc,
    subnets,
    config,
    buildContext: '.',
    env: {
      NEXT_PUBLIC_INTERCOM_APP_ID: { value: config.telenutrition.intercom.app_id },
      NEXT_PUBLIC_API_BASE_URL: {value: `https://${config.common_cdk.route53.foodsmartcom.public.domain}${config.telenutrition_api.albListenerRulePrefix}`},
      NODE_ENV: { value: 'production' },
      NEXT_PUBLIC_GA_MEASUREMENT_ID: { value: config.telenutrition_web.google_analytics.measurement_id },
      RETOOL_APP_BASE_URL: { value: config.telenutrition_web.retool.app_base_url },
      PLASMIC_PROJECT_ID: { value: config.telenutrition_web.plasmic.project_id},
      PLASMIC_TOKEN: { value: config.telenutrition_web.plasmic.token },
      NEXT_PUBLIC_ASSETS_CDN_URL: { value: config.telenutrition_web.cdn.cdnBaseUrl },
    }
  })

  const staticCdnBucket = Bucket.fromBucketName(stack, `${nameUpper}StaticAssetsCdnBucket`, config.telenutrition_web.cdn.bucketName);
  staticCdnBucket.grantReadWrite(codeBuildRole)

  // the role assumed by the task and its containers
  const taskRole = new iam.Role(stack, `${nameUpper}TaskRole`, {
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    roleName: `${nameUpper}TaskRole`,
    description: "Role that the web task definitions use to run the web tier",
  })

  const taskDefinition = new ecs.TaskDefinition(stack, `${nameUpper}TaskDefinition`, {
    taskRole: taskRole,
    compatibility: ecs.Compatibility.FARGATE,
    networkMode: ecs.NetworkMode.AWS_VPC,
    family: `${stackName}-web-task`,
    cpu: '2048',
    memoryMiB: '4096',
  })

  secrets.grantRead(taskDefinition.taskRole)

  const logGroup = new LogGroup(stack, 'TelenutritionWebTaskDefinitionLogGroup', {
    logGroupName: `/foodsmart/telenutrition-web`,
    retention: RetentionDays.ONE_MONTH,
    removalPolicy: RemovalPolicy.DESTROY,
  })

  const container = taskDefinition.addContainer(`${nameUpper}Container`, {
    image: ecs.RepositoryImage.fromEcrRepository(repository, imageTagParameter.valueAsString),
    command: ['npm', 'run', 'start', '--', '-p', String(config.telenutrition_web.server.port)],
    environment: {
      NODE_ENV: 'production',
      NEXT_PUBLIC_API_BASE_URL: `https://${config.common_cdk.route53.foodsmartcom.public.domain}/telenutrition/api/v1`,
      NEXT_PUBLIC_VERSION: imageTagParameter.valueAsString,
      NEXT_PUBLIC_ASSETS_CDN_URL: config.telenutrition_web.cdn.cdnBaseUrl,
    },
    // store the logs in cloudwatch
    logging: ecs.LogDriver.awsLogs({
      logGroup: logGroup,
      streamPrefix: 'web-task'
    }),
  })

  // the docker container port mappings within the container
  container.addPortMappings({ containerPort: config.telenutrition_web.server.port });

  // Security groups to allow connections from the application load balancer to the fargate containers
  const taskSecurityGroup = new ec2.SecurityGroup(stack, `${nameUpper}TaskSecurityGroup`, {
    vpc,
    allowAllOutbound: true,
  })

  taskSecurityGroup.connections.allowFrom(
    albSecurityGroup,
    ec2.Port.allTcp(),
    "Application load balancer"
  );

  // The ECS Service used for deploying tasks
  const service = new ecs.FargateService(stack, `${_(name)}FargateService`, {
    serviceName: nameUpper,
    cluster,
    desiredCount: config.telenutrition_web.server.count,
    taskDefinition,
    securityGroups: [taskSecurityGroup],
    vpcSubnets: subnets,
  })

  // add to a target group so make containers discoverable by the application load balancer
  const albTargetGroup = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(stack, 'FoodsmartcomTelenutritionWebTargetGroup', {
    targetGroupArn: Fn.importValue('CommonNetwork-FoodsmartcomTelenutritionWebTargetGroupArn')
  })

  service.attachToApplicationTargetGroup(albTargetGroup)

  return {}
}

export default {
  createWebService,
}