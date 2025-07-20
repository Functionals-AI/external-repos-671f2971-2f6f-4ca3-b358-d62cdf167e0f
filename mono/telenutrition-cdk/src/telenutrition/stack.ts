import { CfnParameter, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as events from 'aws-cdk-lib/aws-events'
import { Construct } from 'constructs'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

import Config from '@mono/common-cdk/lib/config'
import {createVpc} from '@mono/common-cdk/lib/vpc'
import Secrets from '@mono/common-cdk/lib/secrets'

import {createTasksBuild} from './build'

import * as _ from 'lodash'


export class TelenutritionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const config = Config.getConfig()

    const {vpc, subnets} = createVpc(this, config)

  }
}