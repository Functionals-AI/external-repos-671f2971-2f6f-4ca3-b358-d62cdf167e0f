import { Stack, StackProps } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'

import { IConfig } from '@mono/common/lib/config'
import { createSftpServer } from './sftp'


export class OpsTransferStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)    

    const opsVpcConfig = config.ops_cdk.vpcs.default

    if (opsVpcConfig && opsVpcConfig.id) {
      const vpc = ec2.Vpc.fromLookup(this, `OpsVpc`, {
        isDefault: false,
        vpcId: opsVpcConfig.id,
      })
      
      const publicsSubnets = vpc.selectSubnets({
        subnets: opsVpcConfig.subnets.public.map(subnet => ec2.Subnet.fromSubnetAttributes(this, subnet.subnetId, subnet))
      })

      const server = createSftpServer(this, {
        serverId: config.ops_cdk.sftp?.serverId,
        vpc,
        subnets: publicsSubnets.subnets,
        isProduction: config.isProduction,
        env: config.env,
        region: config.aws.region,
        ipAllocationId: 'eipalloc-753caa11',
        sftpArchiveLambdaEventSources: config.ops_cdk.sftp.sftpArchiveBucket?.lambdaEventSources
      })
    }
  }
}