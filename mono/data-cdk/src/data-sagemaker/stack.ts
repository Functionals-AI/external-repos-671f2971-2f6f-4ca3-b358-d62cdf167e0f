import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IConfig } from '@mono/common/lib/config'
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as ec2 from 'aws-cdk-lib/aws-ec2'

export class DataSagemakerStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const vpcConfig = config.common_cdk.vpcs.default
    const vpcId = vpcConfig.id
    const subnetIds = vpcConfig.subnets.data.map(subnetAttrs => subnetAttrs.subnetId)

    const kmsKey = new kms.Key(this, 'DataSagemakerStudioKey', {
      enabled: true,
      alias: 'data-sagemaker/studio',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
    })
  
    const executionRole = new iam.Role(this, 'SagemakerStudioExecutionRole', {
      roleName: 'FoodsmartSagemakerStudioExecutionRole',
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRedshiftFullAccess'),
      ]
    })
  
    kmsKey.grantEncryptDecrypt(executionRole)
    kmsKey.grant(executionRole, 'kms:CreateGrant')

    const vpc = ec2.Vpc.fromLookup(this, `SagemakerVpc`, {
      isDefault: false,
      vpcId,
    })
  
    const securityGroup = new ec2.SecurityGroup(this, 'SagemakerStudioSecurityGroup', {
      vpc,
      description: 'Security group used by Sagemaker Studio',
      securityGroupName: `Data-SagemakerStudio`,
    })
  
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(2049), 'Sagemaker EFS')
    securityGroup.addIngressRule(securityGroup, ec2.Port.tcpRange(8192, 65535))

    const domain = new sagemaker.CfnDomain(this, 'FoodsmartSagemakerDomain', {
      appNetworkAccessType: 'VpcOnly',
      vpcId,
      subnetIds,
      authMode: 'SSO',
      domainName: 'Foodsmart',
      defaultUserSettings: {
        executionRole: executionRole.roleArn,
        securityGroups: [securityGroup.securityGroupId],
        sharingSettings: {
          notebookOutputOption: 'Disabled',
        }
      },
      kmsKeyId: kmsKey.keyId,
    })

    const redshiftUnloadRole = new iam.Role(this, 'SagemakerRedshiftRole', {
      roleName: 'FoodsmartSagemakerRedshiftRole',
      assumedBy: new iam.ServicePrincipal('redshift.amazonaws.com'),
      inlinePolicies: {
        SagemakerRedshiftUnload: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:*'
              ],
              resources: [
                "arn:aws:s3:::*SageMaker*",
                "arn:aws:s3:::*Sagemaker*",
                "arn:aws:s3:::*sagemaker*",
              ]
            })
          ]
        })
      }
    })
  


  }
}