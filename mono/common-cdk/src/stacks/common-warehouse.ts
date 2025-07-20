import { CfnOutput, CfnParameter, Duration, Fn, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as events from 'aws-cdk-lib/aws-events'
import { CloudWatchLogGroup } from 'aws-cdk-lib/aws-events-targets'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as redshift from 'aws-cdk-lib/aws-redshift'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'

import { IConfig } from '@mono/common/lib/config'
import { ScriptNames } from '@mono/common-tasks/lib/scripts'

import Config from '../config'
import { factory as buildFactory } from '../build'
import { createVpc } from '../vpc'
import { createECSSecurityGroupName, createLogGroupName } from '../naming'
import Secrets from '../secrets'
import { eventBusName } from '@mono/common/lib/warehouse/events'



export class CommonWarehouseStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)


    // import the redshift security group from the redshift common stack
    const redshiftSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'RedshiftSecurityGroupId', config.common_cdk.common_warehouse.security_group)


    new CfnOutput(this, 'CommonWarehouseSecurityGroupIdOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'WarehouseClusterSecurityGroupId']),
      value: redshiftSecurityGroup.securityGroupId,
      description: 'Common warehouse security group ID.',
    })



  }
}
