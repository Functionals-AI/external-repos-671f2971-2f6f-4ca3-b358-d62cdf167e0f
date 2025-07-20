/**
 * Resources in order to receive client data from external soures, ie: their SFTP servers.
 */
import { CfnOutput, Fn, RemovalPolicy, SecretValue, Stack, StackProps, Token } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as redshift from 'aws-cdk-lib/aws-redshiftserverless'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { IConfig } from '@mono/common/lib/config'

export class OpsDeidentStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)


    const vpc = ec2.Vpc.fromLookup(this, `${config.env}-vpc`, {
      isDefault: false,
      vpcId: config.common_cdk.vpcs.default.id,
    })
  
    const analyticsSubnets = vpc.selectSubnets({
      subnets: config.common_cdk.vpcs.default.subnets.analytics.map(subnet => ec2.Subnet.fromSubnetAttributes(this, subnet.subnetId, subnet))
    })

        // Create deident cluster role with minimal data share consumer permissions
    // Create secret for Redshift admin password
    const adminSecret = new secretsmanager.Secret(this, 'RedshiftDeidentAdminSecret', {
      secretName: `${config.env}/redshift-deident/admin-password`,
      generateSecretString: {
        passwordLength: 32,
        excludeCharacters: '"\'\\/@',
      },
    })

    const deidentRedshiftRole = new iam.Role(this, 'DeidentRedshiftRole', {
      assumedBy: new iam.ServicePrincipal('redshift.amazonaws.com'),
      description: 'Role for Deident Redshift cluster to consume shared data',
      roleName: 'FoodsmartDeidentRedshiftRole'
    })

    // Grant Redshift role access to the admin secret
    adminSecret.grantRead(deidentRedshiftRole)

    // Add minimal data share consumer permissions
    const dataShareConsumerPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'redshift:AuthorizeDataShare',
        'redshift:DescribeDataShares',
        'redshift:GetDataShare',
        'redshift:GetDataShareAssociations',
        'redshift:ListDataShares'
      ],
      resources: ['*']
    })

    // Create Redshift Serverless namespace for deidentified data sharing
    const namespace = new redshift.CfnNamespace(this, 'OpsRedshiftDeidentNamespace', {
      namespaceName: `deident`,
      adminUsername: 'admin',
      adminUserPassword: adminSecret.secretValue.unsafeUnwrap(),
      dbName: 'deidentified',
      defaultIamRoleArn: deidentRedshiftRole.roleArn,
      iamRoles: [deidentRedshiftRole.roleArn],
      tags: [{
        key: 'Description',
        value: 'Namespace for exposing deidentified data to company consumers'
      }]
    })

    // Create security group for Redshift deident cluster
    const redshiftDeidentSecurityGroup = new ec2.SecurityGroup(this, 'RedshiftDeidentSecurityGroup', {
      vpc,
      description: 'Security group for Ops Redshift Deident cluster',
      allowAllOutbound: true,
    })

    const vpnSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'VPNSecurityGroup', config.common_cdk.vpcs.default.securityGroups.vpn.id)
    redshiftDeidentSecurityGroup.addIngressRule(vpnSecurityGroup, ec2.Port.tcp(5439), 'VPN access to Redshift')

    const redshiftAnalyticsSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'RedshiftAnalyticsSecurityGroup', config.common_cdk.vpcs.default.securityGroups.redshift.id)
    redshiftDeidentSecurityGroup.addIngressRule(redshiftAnalyticsSecurityGroup, ec2.Port.tcp(5439), 'VPN access to Redshift')


    // Create Redshift Serverless workgroup
    const workgroup = new redshift.CfnWorkgroup(this, 'OpsRedshiftDeidentWorkgroup', {
      workgroupName: `deident`,
      baseCapacity: 8,
      enhancedVpcRouting: true,
      namespaceName: namespace.namespaceName,
      publiclyAccessible: false,
      subnetIds: analyticsSubnets.subnetIds,
      securityGroupIds: [redshiftDeidentSecurityGroup.securityGroupId],
      tags: [{
        key: 'Description',
        value: 'Workgroup for exposing deidentified data to company consumers'
      }]
    })


    // Add dependency to ensure namespace is created first
    workgroup.addDependency(namespace)
    deidentRedshiftRole.addToPrincipalPolicy(dataShareConsumerPolicy)
  }
}
