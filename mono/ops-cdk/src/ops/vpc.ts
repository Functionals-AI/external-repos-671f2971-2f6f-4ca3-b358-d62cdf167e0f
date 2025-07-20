import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'

export interface CreateVpcOptions {
  cidr: string,
}

export interface CreateVpcResult {
  vpc: ec2.IVpc,
}

export function createVpc(stack: Construct, options: CreateVpcOptions): CreateVpcResult {
  const {cidr} = options

  const vpc = new ec2.Vpc(stack, 'OpsVpc', {
    vpcName: 'Ops',
    cidr,
    natGateways: 1,
    maxAzs: 2,
    subnetConfiguration: [
      {
        name: 'Public',
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 24,
      },
      {
        name: 'VpnPrivateNat',
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        cidrMask: 24,
      },
    ],
  })

  return {vpc}
}

export default {
  createVpc,
}