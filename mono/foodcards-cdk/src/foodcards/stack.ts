import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from "constructs"
import { CfnOutput, CfnParameter, Fn, Stack, StackProps } from 'aws-cdk-lib'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import { RemovalPolicy } from 'aws-cdk-lib'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

import { IConfig } from '@mono/common/lib/config'
import CdkConfig from '@mono/common-cdk/lib/config'
import { createVpc } from '@mono/common-cdk/lib/vpc'

import { factory as buildFactory } from '@mono/common-cdk/lib/build'

export class FoodcardsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const taskImageTagParameter = new CfnParameter(this, 'ScriptsTaskImageBuildTag', {
      description: "Foodcards Scripts Task image tag.",
      type: "String"
    })

    const foodcardsS3BucketKey = new kms.Key(this, 'FoodcardsS3BucketKey', {
      enabled: true,
      alias: 'foodcards',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
    })

    foodcardsS3BucketKey.grantEncryptDecrypt(new iam.AccountRootPrincipal)

    const foodcardsBucket = new s3.Bucket(this, 'FoodcardsBucket', {
      bucketName: `foodsmart-${config.env}-foodcards-${config.aws.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: foodcardsS3BucketKey,
      eventBridgeEnabled: true,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: false,
    })

    const cdkConfig = CdkConfig.getConfig()
    
    const {vpc, subnets} = createVpc(this, cdkConfig)

    const ecsTaskSecurityGroup = new ec2.SecurityGroup(this, 'FoodcardsClusterSecurityGroup', {
      securityGroupName: `foodcards-cluster-sg`,
      vpc,
      allowAllOutbound: true,
    })

    const cluster = new ecs.Cluster(this, `FoodCardsCluster`, {
      clusterName: `FoodCards`,
      containerInsights: true,
      vpc,
    })

    const {repository} = buildFactory(this, 'foodcards', {vpc, subnets, config: cdkConfig})

    const logGroup = new LogGroup(this, 'FoodcardsTasksLogGroup', {
      logGroupName: `/foodsmart/foodcards/foodcards-tasks/scripts`,
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const scriptsTaskManagedPolicyName = 'FoodsmartFoodcardsScriptsTaskPolicy'
    const scriptsTaskManagedPolicy = new iam.ManagedPolicy(this, scriptsTaskManagedPolicyName, {
      description: 'Policy assumed by Foodcards scripts task.',
      managedPolicyName: scriptsTaskManagedPolicyName,
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
          new iam.PolicyStatement({
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey'
            ],
            resources: [
              foodcardsS3BucketKey.keyArn
            ]
          }),
          new iam.PolicyStatement({
            actions: [
              's3:ListBucket',
              's3:PutObject',
              's3:GetObject',
              's3:GetObjectVersion',
            ],
            resources: [foodcardsBucket.bucketArn, `${foodcardsBucket.bucketArn}/*`],
          }),
        ]
      })
    })

    const scriptsTaskRoleName = 'FoodsmartFoodcardsScriptsTaskRole'
    const scriptsTaskRole = new iam.Role(this, scriptsTaskRoleName, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role assumed to Foodcards ECS Scripts task.',
      managedPolicies: [
        scriptsTaskManagedPolicy
      ],
      roleName: scriptsTaskRoleName
    })

    const scriptsTaskDef = new ecs.FargateTaskDefinition(this, 'FoodcardsScriptsTaskDef', {
      family: `${props.stackName}-scripts`,
      memoryLimitMiB: 8192,
      cpu: 2048,
      taskRole: scriptsTaskRole
    })

    scriptsTaskDef.addContainer('FoodcardsTaskScriptsContainer', {
      containerName: 'foodcards-tasks-scripts',
      image: ecs.ContainerImage.fromEcrRepository(repository, taskImageTagParameter.valueAsString),
      entryPoint: [
        'npm',
        'run',
        'scripts'
      ],
      environment: {
        'NODE_ENV': config.env,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'foodcards-tasks-scripts',
        logGroup,
      })
    })

    //
    // Stack outputs:
    //  * S3 Bucket KMS key,
    //  * S3 Bucket ARN.
    //
    new CfnOutput(this, 'FoodcardsS3BucketKeyOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'FoodcardsS3KmsKeyArn']),
      value: foodcardsS3BucketKey.keyArn,
      description: 'Foodcards S3 KMS key arn',
    })

    new CfnOutput(this, 'FoodcardsS3BucketArnOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'FoodcardsS3BucketArn']),
      value: foodcardsBucket.bucketArn,
      description: 'Foodcards S3 bucket arn',
    })
  }
}
