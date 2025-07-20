import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import { ICdkConfig } from './config'
import { IVpcConfig } from '@mono/common/lib/config'


export interface CreateVpcResult {
  vpc: ec2.IVpc,
  subnets: ec2.SelectedSubnets,
}

export function createVpc(stack: Construct, config: ICdkConfig): CreateVpcResult {
  const {env, vpcId, subnetsInternal} = config

  const vpc = ec2.Vpc.fromLookup(stack, `${env}-vpc`, {
    isDefault: false,
    vpcId,
  })

  const subnets = vpc.selectSubnets({
    subnets: subnetsInternal.map(subnet => ec2.Subnet.fromSubnetAttributes(stack, subnet.subnetId, subnet))
  })

  return {vpc, subnets}
}

export interface LookupVpcResult {
  vpc: ec2.IVpc,
  subnets: Record<string, ec2.SelectedSubnets>,
}

export function lookupVpc(stack: Construct, config: IVpcConfig): LookupVpcResult {
  const vpc = ec2.Vpc.fromLookup(stack, `vpc`, {
    isDefault: false,
    vpcId: config.id,
  })

  const internalSubnets = vpc.selectSubnets({
    subnets: config.subnets.internal.map(subnet => ec2.Subnet.fromSubnetAttributes(stack, subnet.subnetId, subnet))
  })

  const publicSubnets = vpc.selectSubnets({
    subnets: config.subnets.public.map(subnet => ec2.Subnet.fromSubnetAttributes(stack, subnet.subnetId, subnet))
  })

  return {
    vpc, 
    subnets: {
      public: publicSubnets,
      internal: internalSubnets,
    }
  }
}

export default {
  createVpc,
  lookupVpc,
}