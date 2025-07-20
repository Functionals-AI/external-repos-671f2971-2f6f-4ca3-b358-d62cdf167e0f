import { CfnParameter, Fn, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as events from 'aws-cdk-lib/aws-events'
import { Construct } from 'constructs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

import Config from '@mono/common-cdk/lib/config'
import {lookupVpc} from '@mono/common-cdk/lib/vpc'
import Secrets from '@mono/common-cdk/lib/secrets'

import * as _ from 'lodash'
import { IConfig } from '@mono/common/lib/config'

import { createApiService } from './api'
import { createWebService } from './web'

export class TelenutritionAppStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const cdkConfig = Config.getConfig()
    const {vpc, subnets} = lookupVpc(this, config.common_cdk.vpcs.default)

    const cluster = new ecs.Cluster(this, `TelenutritionAppCluster`, {
      clusterName: `TelenutritionApp`,
      containerInsights: true,
      vpc,
    })

    const secrets = Secrets.getSecrets(this)

    const albSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'FoodsmartcomAlbSecurityGrop', Fn.importValue('CommonNetwork-FoodsmartcomAlbSecurityGroupId'))

    createApiService(this, {
      stackName: props.stackName,
      vpc,
      subnets: subnets.internal,
      cluster,
      config,
      secrets,
      albSecurityGroup,
    })

    createWebService(this, {
      stackName: props.stackName,
      vpc,
      subnets: subnets.internal,
      cluster,
      config,
      secrets,
      albSecurityGroup,
    })

  }
}