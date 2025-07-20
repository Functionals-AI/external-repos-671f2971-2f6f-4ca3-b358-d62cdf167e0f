/**
 * Foodmsmart DB stack.
 */
import { Construct } from 'constructs'
import { CfnParameter, Fn, Stack, StackProps } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { RemovalPolicy } from 'aws-cdk-lib'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

import { IConfig } from '@mono/common/lib/config'
import CdkConfig from '@mono/common-cdk/lib/config'
import { createVpc } from '@mono/common-cdk/lib/vpc'
import { factory as buildFactory } from '@mono/common-cdk/lib/build'

const DOMAIN = 'ops'

/**
 * Resources to facilitate running migrations using dbmate.
 * See 'db-tasks/Dockerfile'
 */
export class OpsStoreStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const taskImageTagParameter = new CfnParameter(this, 'TaskImageBuildTag', {
      description: "Ops store task image tag.",
      type: "String"
    })
    
    const cdkConfig = CdkConfig.getConfig()

    const {vpc, subnets} = createVpc(this, cdkConfig)

    const { 
      repository,
    } = buildFactory(this, DOMAIN, { 
      vpc, 
      subnets, 
      config: cdkConfig,
      projectName: 'ops-store',
      dockerFilePath: './ops-cdk/src/ops-store/Dockerfile',
     })

    const ecsTaskSecurityGroup = new ec2.SecurityGroup(this, 'OpsStoreClusterSecurityGroup', {
      securityGroupName: `ops-store-cluster-sg`,
      vpc,
      allowAllOutbound: true,
    })

    const commonStoreSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'CommonStoreSecurityGroupId', Fn.importValue('common-store-ClusterSecurityGroupId'))

    commonStoreSecurityGroup.addIngressRule(ecsTaskSecurityGroup, ec2.Port.tcp(5432), `${DOMAIN} store task access to RDS common store cluster`)

    const cluster = new ecs.Cluster(this, `OpsStoreCluster`, {
      clusterName: `OpsStore`,
      containerInsights: true,
      vpc,
    })

    const logGroup = new LogGroup(this, 'OpsStoreTaskLogGroup', {
      logGroupName: `/foodsmart/ops/ops-store`,
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const taskManagedPolicyName = 'OpsStoreTasksPolicy'
    const taskManagedPolicy = new iam.ManagedPolicy(this, taskManagedPolicyName, {
      description: 'Policy assumed by Ops store task.',
      managedPolicyName: taskManagedPolicyName,
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement(
            {
              actions: [
                'secretsmanager:GetSecretValue'
              ],
              resources: [
                config.aws.secretsmanagerArn
              ]
            }
          ),
        ]
      })
    })

    const taskRoleName = 'OpsStoreTaskRole'
    const taskRole = new iam.Role(this, taskRoleName, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role assumed by Ops store task.',
      managedPolicies: [
        taskManagedPolicy
      ],
      roleName: taskRoleName
    })

    const taskDef = new ecs.FargateTaskDefinition(this, 'OpsStoreTaskDef', {
      family: `${props.stackName}-task`,
      memoryLimitMiB: 8192,
      cpu: 2048,
      taskRole: taskRole
    })

    const dbSecret = Secret.fromSecretCompleteArn(this, 'CommonSecretsManager', config.aws.secretsmanagerArn)
    const dbHost = config.common.store.writer.host
    const dbPort = config.common.store.writer.port
    //
    // Password comes from the PGPASSWORD env var extracted via secrets.
    //
    const databaseUrl = `postgres://svc_common@${dbHost}:${dbPort}/foodsmart`

    //
    // Create container:
    //
    // SSL is required and enabled by default. The Dockerfile downloads the combined
    // bundle with the root cert. That is passed via the PGSSLROOTCERT env var.
    // See postgres lib/pq environment documentation for specifics as it is used
    // by dbmate:
    //
    //   https://www.postgresql.org/docs/current/libpq-envars.html
    //
    taskDef.addContainer('OpsStoreTaskContainer', {
      containerName: 'ops-store-task',
      image: ecs.ContainerImage.fromEcrRepository(repository, taskImageTagParameter.valueAsString),
      environment: {
        'NODE_ENV': config.env,
        'DATABASE_URL': databaseUrl,
        'PGSSLROOTCERT': '/app/ssl/global-bundle.pem',
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ops-store-task',
        logGroup,
      }),
      secrets: {
        'PGPASSWORD': ecs.Secret.fromSecretsManager(dbSecret, 'common.store.svc_common.password'),
      },
    })
  }
}
