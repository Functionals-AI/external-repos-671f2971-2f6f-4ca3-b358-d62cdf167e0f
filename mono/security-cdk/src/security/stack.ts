import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { IConfig } from '@mono/common/lib/config'
import { createCloudWatch } from './cloudwatch'
import { createIAMPolicies } from './iampolicies'
import { createCloudWatchDataProtection } from './cloudwatch-data-protection'


export class SecurityStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props);

    // Create the CloudWatch->SEIM log shipping 
    if (config.security_cdk.crowdstrike != null){
      if (config.security_cdk.crowdstrike.cloudwatch != null || config.security_cdk.sumologic.cloudwatch != null){
        createCloudWatch(this, config);
      }
    }

    // Create CloudWatch Logs data protection for PHI/PII masking
    createCloudWatchDataProtection(this, config);

    // Have a place for IAM policies that exist across all environments
    createIAMPolicies(this, config);
  } 
}
