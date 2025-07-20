import { Stack, StackProps } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { Construct } from 'constructs'

import { IConfig } from '@mono/common/lib/config'
import { createClientVpn } from './vpn'


export class OpsAccessStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)    

    const opsVpcConfig = config.ops_cdk.vpcs.default

    if (opsVpcConfig) {
      const vpc = ec2.Vpc.fromLookup(this, `OpsVpc`, {
        isDefault: false,
        vpcId: opsVpcConfig.id,
      })
      
      const subnets = vpc.selectSubnets({
        subnets: opsVpcConfig.subnets.vpn.map(subnet => ec2.Subnet.fromSubnetAttributes(this, subnet.subnetId, subnet))
      })
    
      const routes = [{
        name: 'CommonInternal',
        cidr: config.common_cdk.vpcs.default.cidrBlock,
        subnets,
      }, {
        name: 'DefaultStaging',
        cidr: '10.1.0.0/16',
        subnets,
      }, {
        name: 'DefaultDevelopment',
        cidr: '10.10.0.0/16',
        subnets,
      }]
  
      const rules = [{
        groupId: 'Ops',
        cidr: config.common_cdk.vpcs.default.cidrBlock,
      }, {
        groupId: 'Data',
        cidr: config.common_cdk.vpcs.default.cidrBlock,
      },
      {
        groupId: 'Ops',
        cidr: '10.1.0.0/16',
      },
      {
        groupId: 'Data',
        cidr: '10.1.0.0/16',
      },
      {
        groupId: 'Developer',
        cidr: '10.1.0.0/16',
      },
      {
        groupId: 'Ops',
        cidr: '10.10.0.0/16',
      },
      {
        groupId: 'Data',
        cidr: '10.10.0.0/16',
      },
      {
        groupId: 'Developer',
        cidr: '10.10.0.0/16',
      },
    ]

      const cidr = config.ops_cdk.vpn.cidr
      const metadata = config.ops_cdk.vpn.samlMetadata
    
      const {securityGroup: vpnSecurityGroup} = createClientVpn(this, {vpc, subnets, routes, rules, cidr, metadata})

      const rdsSecurityGroup = ec2.SecurityGroup.fromLookupById(this, 'RdsSecurityGroup', config.common_cdk.vpcs.default.securityGroups.rds.id)
      rdsSecurityGroup.addIngressRule(vpnSecurityGroup, ec2.Port.tcp(3306), 'VPN access to RDS MySQL')

      const redshiftSecurityGroup = ec2.SecurityGroup.fromLookupById(this, 'RedshiftSecurityGroup', config.common_cdk.vpcs.default.securityGroups.redshift.id)
      redshiftSecurityGroup.addIngressRule(vpnSecurityGroup, ec2.Port.tcp(5439), 'VPN access to Redshift')
    }
  }
}