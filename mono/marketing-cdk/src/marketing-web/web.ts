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
import Secrets from '@mono/common-cdk/lib/secrets'
import { createBuildProject } from './build'

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

  const name = 'marketing-web'
  const nameUpper = name.split(/[^a-z]+/i).map(_.upperFirst).join('')

  name.split(/[^a-z]/i)

  const imageTagParameter = new CfnParameter(stack, 'WebImageBuildTag', {
    description: 'Marketing web image tag.',
    type: 'String'
  })

  const { repository } = createBuildProject(stack, {
    name,
    vpc,
    subnets,
    config,
    buildContext: '.',
    env: {
      NEXT_PUBLIC_VERSION: {value: imageTagParameter.valueAsString},
      NODE_ENV: { value: config.env === 'staging' ? 'production' : config.env },
      NEXT_PUBLIC_GA_MEASUREMENT_ID: { value: config.marketing_web.google_analytics.measurement_id },
      PLASMIC_PROJECT_ID: { value: config.marketing_web.plasmic.project_id},
      PLASMIC_TOKEN: { value: config.marketing_web.plasmic.token },
      PLASMIC_CMS_ID: { value: config.marketing_web.plasmic.cms_id },
      PLASMIC_CMS_PUBLIC_KEY: { value: config.marketing_web.plasmic.cms_public_key },
      PLASMIC_CMS_SECRET_KEY: { value: config.marketing_web.plasmic.cms_secret_key },
      TELENUTRITION_API_BASEURL: {
        value: ['staging', 'production'].includes(config.env)
          ? config.marketing_web.base_url.concat(config.telenutrition_api.albListenerRulePrefix)
          : 'http://localhost:' + config.telenutrition_api.server.port
      },
    }
  })

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

  const logGroup = new LogGroup(stack, 'MarketingWebTaskDefinitionLogGroup', {
    logGroupName: `/foodsmart/marketing-web`,
    retention: RetentionDays.ONE_MONTH,
    removalPolicy: RemovalPolicy.DESTROY,
  })

  const container = taskDefinition.addContainer(`${nameUpper}Container`, {
    image: ecs.RepositoryImage.fromEcrRepository(repository, imageTagParameter.valueAsString),
    command: ['npm', 'run', config.isDevelopment ? 'dev' : 'start', '--', '-p', String(config.marketing_web.server.port)],
    environment: {
      NODE_ENV: config.env === 'staging' ? 'production' : config.env,
      NEXT_PUBLIC_VERSION: imageTagParameter.valueAsString,
      PLASMIC_CMS_ID: config.marketing_web.plasmic.cms_id,
      PLASMIC_CMS_PUBLIC_KEY: config.marketing_web.plasmic.cms_public_key,
      PLASMIC_CMS_SECRET_KEY: config.marketing_web.plasmic.cms_secret_key,
      TELENUTRITION_API_BASEURL: ['staging', 'production'].includes(config.env)
          ? config.marketing_web.base_url.concat(config.telenutrition_api.albListenerRulePrefix)
          : 'http://localhost:' + config.telenutrition_api.server.port,
    },
    // store the logs in cloudwatch
    logging: ecs.LogDriver.awsLogs({
      logGroup: logGroup,
      streamPrefix: 'web-task'
    }),
  })

  // the docker container port mappings within the container
  container.addPortMappings({ containerPort: config.marketing_web.server.port });

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
    desiredCount: config.marketing_web.server.count,
    taskDefinition,
    securityGroups: [taskSecurityGroup],
    vpcSubnets: subnets,
  })

  // add to a target group so make containers discoverable by the application load balancer
  const albTargetGroup = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(stack, 'FoodsmartcomMarketingWebTargetGroup', {
    targetGroupArn: Fn.importValue('CommonNetwork-FoodsmartcomMarketingWebTargetGroupArn')
  })

  service.attachToApplicationTargetGroup(albTargetGroup)

  return {}
}

export default {
  createWebService,
}
