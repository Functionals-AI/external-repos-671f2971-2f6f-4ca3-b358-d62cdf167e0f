import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import { PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { RemovalPolicy } from 'aws-cdk-lib'

interface ICreateVpnEndpointOptions {
  vpc: ec2.IVpc,
  cidr: string,
  metadata: string,
  subnets: ec2.SelectedSubnets,
  routes: {
    name: string,
    cidr: string,
    subnets: ec2.SelectedSubnets
  }[],
  rules: {
    cidr: string,
    groupId?: string,
  }[]
}

export function createClientVpn(stack: Construct, options: ICreateVpnEndpointOptions) {
  const { vpc, subnets, routes, rules, cidr, metadata } = options

  const samlProvider = new iam.SamlProvider(stack, 'ClientVpnSamlProvider', {
    metadataDocument: iam.SamlMetadataDocument.fromXml(metadata),
  })

  const zone = PublicHostedZone.fromPublicHostedZoneId(stack, 'FoodsmartCoHostedZone', 'Z087011223VA2ICLPXPEX')

  const cert = new acm.Certificate(stack, 'VpnFoodsmartCoCertificate', {
    domainName: 'vpn.foodsmart.co',
    validation: acm.CertificateValidation.fromDns(zone),
  })

  const securityGroup = new ec2.SecurityGroup(stack, 'ClientVpnSecurityGroup', {  
    description: 'Security group used by AWS Client VPN to access internal databases and hosts',
    securityGroupName: `OpsAccess_ClientVpn`,
    vpc,
    allowAllOutbound: true,
  })

  const logGroup = new logs.LogGroup(stack, 'ClientVpnLogGroup', {
    logGroupName: '/foodsmart/ops-access/client-vpn',
    retention: logs.RetentionDays.THREE_MONTHS,
    removalPolicy: RemovalPolicy.DESTROY,
  })
  const logStream = logGroup.addStream('ClientVpnLogStream')

  const endpoint = vpc.addClientVpnEndpoint('ClientVpnEndpoint', {
    cidr,
    serverCertificateArn: cert.certificateArn,
    userBasedAuthentication: ec2.ClientVpnUserBasedAuthentication.federated(samlProvider),
    authorizeAllUsersToVpcCidr: true,
    splitTunnel: true,
    vpcSubnets: subnets,
    logging: true,
    logGroup: logGroup,
    logStream: logStream,
    securityGroups: [securityGroup]
  })

  for (let [index, rule] of rules.entries()) {
    const params: {cidr: string, groupId?: string} = {
      cidr: rule.cidr,
    }

    if (rule.groupId !== undefined) {
      params.groupId = rule.groupId
    }

    endpoint.addAuthorizationRule(`${rule.groupId}Rule${index}`, params)  
  }

  for (let route of routes) {
    const {name, cidr, subnets: {subnets}} = route

    for (let [index, subnet] of subnets.entries()) {
      endpoint.addRoute(`${name}Route${index+1}`, {
        cidr,
        target: ec2.ClientVpnRouteTarget.subnet(subnet)
      })
    }  
  }

  return {
    endpoint,
    securityGroup
  }
}

export default {
  createClientVpn,
}