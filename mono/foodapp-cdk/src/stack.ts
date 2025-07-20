import { Construct } from "constructs"
import { CfnParameter, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import { EventBus, Rule, Schedule } from 'aws-cdk-lib/aws-events'
import { CloudWatchLogGroup, EcsTask } from 'aws-cdk-lib/aws-events-targets'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

import { IConfig } from '@mono/common/lib/config'
import CdkConfig from '@mono/common-cdk/lib/config'
import {createVpc} from '@mono/common-cdk/lib/vpc'
import { eventBusName } from '@mono/foodapp/lib/warehouse/events'

import {createBuild} from './build'

export class FoodappStack extends Stack {
  constructor(scope: Construct, id: string, config: IConfig, props: StackProps) {
    super(scope, id, props)

    const taskImageTagParameter = new CfnParameter(this, 'ScriptsTaskImageBuildTag', {
      description: "Foodapp Scripts Task image tag.",
      type: "String"
    })

    const redshiftFqManagedPolicy = new iam.ManagedPolicy(this, 'FoodappRedshiftFederatedQueryPolicy', {
      description: 'Policy to faciliate Federated Queries to Redshift.',
      managedPolicyName: 'FoodsmartFoodappRedshiftFederatedQueryPolicy',
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement(
            {
              actions: [
                'secretsmanager:GetResourcePolicy',
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
                'secretsmanager:ListSecretVersionIds'
              ],
              resources: [
                config.redshift.foodappStore.fqSecretsmanagerArn
              ]
            }
          ),
          new iam.PolicyStatement(
            {
              actions: [
                'secretsmanager:GetRandomPassword',
                'secretsmanager:ListSecrets'
              ],
              resources: [ '*' ]
            }
          )
        ]
      })
    })

    const redshiftFqRole = new iam.Role(this, 'FoodappRedshiftFederatedQueryRole', {
      assumedBy: new iam.ServicePrincipal('redshift.amazonaws.com'),
      description: 'Role to facilitate Redshift Federated Query to the AWS RDS Aurora application DB.',
      managedPolicies: [
        redshiftFqManagedPolicy
      ],
      roleName: 'FoodsmartFoodappRedshiftFederatedQueryRole'
    })

  }
}