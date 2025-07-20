import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { IConfig } from '@mono/common/lib/config'

export function createIAMPolicies(stack: Construct, config: IConfig) {

  const viewCloudwatchAlarms = new iam.ManagedPolicy(stack, 'ViewCloudwatchAlarms', {
    managedPolicyName: 'ViewCloudwatchAlarms',
    statements: [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          // Allow viewing and listing CloudWatch Alarms
          'cloudwatch:DescribeAlarms',
          'cloudwatch:DescribeAlarmHistory',
          'cloudwatch:GetMetricData',
          'cloudwatch:GetMetricStatistics',
          'cloudwatch:ListMetrics'
        ],
        resources: ['*'],
      })
    ],
  });
  
}

export default {
  createIAMPolicies,
}