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

export class OpsMigrationsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const taskImageTagParameter = new CfnParameter(this, 'TaskImageBuildTag', {
      description: "Ops migrations task image tag.",
      type: "String"
    })
    
    const cdkConfig = CdkConfig.getConfig()
    const {vpc, subnets} = createVpc(this, cdkConfig)

    const { 
      repository: postgresRepository,
    } = buildFactory(this, DOMAIN, { 
      vpc, 
      subnets, 
      config: cdkConfig,
      projectName: 'ops-migrations-store',
      dockerFilePath: './ops-cdk/src/ops-migrations/postgres-dockerfile',
     })


     const { 
      repository: redshiftRepository,
    } = buildFactory(this, DOMAIN, { 
      vpc, 
      subnets, 
      config: cdkConfig,
      projectName: 'ops-migrations-warehouse',
      dockerFilePath: './ops-cdk/src/ops-migrations/redshift-dockerfile',
     })

     const ecsTaskSecurityGroup = new ec2.SecurityGroup(this, 'OpsMigrationsTaskSecurityGroup', {
      securityGroupName: `ops-migrations-task-sg`,
      vpc,
      allowAllOutbound: true,
    })

    // Allow access to postgres store cluster
    const commonStoreSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'CommonStoreSecurityGroupId', Fn.importValue('common-store-ClusterSecurityGroupId'))
    commonStoreSecurityGroup.addIngressRule(ecsTaskSecurityGroup, ec2.Port.tcp(5432), `${DOMAIN} migrations task access to Postgres cluster`)

    // Allow access to redshift cluster
    const warehouseSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'WarehouseSecurityGroupId', Fn.importValue('CommonWarehouse-WarehouseClusterSecurityGroupId'))
    warehouseSecurityGroup.addIngressRule(ecsTaskSecurityGroup, ec2.Port.tcp(5439), `${DOMAIN} migrations task access to warehouse cluster`)

    const cluster = new ecs.Cluster(this, `OpsMigrationsCluster`, {
      clusterName: `OpsMigrations`,
      containerInsights: true,
      vpc,
    })

    const logGroup = new LogGroup(this, 'OpsMigrationsTaskLogGroup', {
      logGroupName: `/foodsmart/ops/ops-migrations`,
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const taskManagedPolicyName = 'OpsMigrationsTasksPolicy'
    const taskManagedPolicy = new iam.ManagedPolicy(this, taskManagedPolicyName, {
      description: 'Policy assumed by Ops Migrations task.',
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

    const taskRoleName = 'OpsMigrationsTaskRole'
    const taskRole = new iam.Role(this, taskRoleName, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role assumed by Ops Migrations task.',
      managedPolicies: [
        taskManagedPolicy
      ],
      roleName: taskRoleName
    })


    const commonConfigSecrets = Secret.fromSecretCompleteArn(this, 'CommonConfigSecretsManager', config.aws.secretsmanagerArn)

    // Create Postgres migration task definition and container

    const taskDef = new ecs.FargateTaskDefinition(this, 'OpsMigrationsPostgresTaskDef', {
      family: `${props.stackName}-postgres-task`,
      memoryLimitMiB: 8192,
      cpu: 2048,
      taskRole: taskRole
    })

    taskDef.addContainer('OpsMigrationsPostgresTaskContainer', {
      containerName: 'ops-migrations-postgres-task',
      image: ecs.ContainerImage.fromEcrRepository(postgresRepository, taskImageTagParameter.valueAsString),
      environment: {
        'NODE_ENV': config.env,
        'DATABASE_URL': `postgres://svc_migration@${config.common.store.writer.host}:${config.common.store.writer.port}/foodsmart`,
        'PGSSLROOTCERT': '/app/ssl/global-bundle.pem',
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ops-migrations-postgres-task',
        logGroup,
      }),
      secrets: {
        'PGPASSWORD': ecs.Secret.fromSecretsManager(commonConfigSecrets, 'common.store.svc_migration.password'),
      },
    })

    // Create Redshift migration task definition and container

    const warehouseMigrationsTaskDef = new ecs.FargateTaskDefinition(this, 'OpsMigrationsWarehouseTaskDef', {
      family: `${props.stackName}-warehouse-task`,
      memoryLimitMiB: 8192,
      cpu: 2048,
      taskRole: taskRole,
    })

    warehouseMigrationsTaskDef.addContainer('OpsMigrationsWarehouseTaskContainer', {
      containerName: 'ops-migrations-warehouse-task',
      image: ecs.ContainerImage.fromEcrRepository(redshiftRepository, taskImageTagParameter.valueAsString),
      environment: {
        'NODE_ENV': config.env,
        'DATABASE_URL': `redshift://svc_migration@${config.redshift.connection.host}:${config.redshift.connection.port}/${config.redshift.connection.database}`,
        'PGSSLROOTCERT': '/app/ssl/global-bundle.pem',
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ops-migrations-redshift-task',
        logGroup,
      }),
      secrets: {
        'PGPASSWORD': ecs.Secret.fromSecretsManager(commonConfigSecrets, 'common.redshift.svc_migration.password'),
      },
    })
  }
}
