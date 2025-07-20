import { CfnOutput, Duration, Fn, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IConfig } from '@mono/common/lib/config'
import { PublicHostedZone } from 'aws-cdk-lib/aws-route53'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as s3 from 'aws-cdk-lib/aws-s3'

import { lookupVpc } from '../vpc'
import { createS3BucketName } from '../naming'

export class CommonNetworkStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const dns = config.common_cdk.route53.foodsmartcom.public
    const zone = PublicHostedZone.fromHostedZoneAttributes(this, 'FoodsmartcomHostedZone', {
      hostedZoneId: dns.zoneId,
      zoneName: dns.domain,
    })

    const cert = new acm.Certificate(this, 'FoodsmartcomCertificate', {
      domainName: dns.domain,
      validation: acm.CertificateValidation.fromDns(zone),
    })

    const { vpc, subnets } = lookupVpc(this, config.common_cdk.vpcs.default)

    const albSecurityGroup = new ec2.SecurityGroup(this, "FoodsmartcomAlbSecurityGroup", {
      vpc,
    })

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
    )

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
    )

    // Application load balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, `FoodsmartcomAlb`, {
      vpc,
      vpcSubnets: subnets.public,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    })

    const accessLogsBucket = new s3.Bucket(this, 'CommonNetworkAccessLogsBucket', {
      bucketName: createS3BucketName(config, 'common', 'access-logs'),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
    })

    alb.logAccessLogs(accessLogsBucket, dns.domain)

    alb.addRedirect({
      sourceProtocol: elbv2.ApplicationProtocol.HTTP,
      sourcePort: 80,
      targetProtocol: elbv2.ApplicationProtocol.HTTPS,
      targetPort: 443,
    });

    // Target group to make resources containers dicoverable by the application load balencer
    const telenutritionApiTargetGroup = new elbv2.ApplicationTargetGroup(this, "FoodsmartcomTelenutritionApiTargetGroup", {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health-check',
      },
      deregistrationDelay: Duration.seconds(30),
    })

    // Target group to make resources containers dicoverable by the application load balencer
    const telenutritionWebTargetGroup = new elbv2.ApplicationTargetGroup(this, "FoodsmartcomTelenutritionWebTargetGroup", {
      vpc,
      port: 8081,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/schedule/api/health',
      },
      deregistrationDelay: Duration.seconds(30),
    })

     // Target group to make resources containers dicoverable by the application load balencer
     const marketingWebTargetGroup = new elbv2.ApplicationTargetGroup(this, "FoodsmartcomMarketingWebTargetGroup", {
      vpc,
      port: 8081,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health-check',
      },
      deregistrationDelay: Duration.seconds(30),
    })

    const defaultAction = elbv2.ListenerAction.forward([marketingWebTargetGroup])

    // only allow HTTPS connections 
    const listener = alb.addListener("FoodsmartcomHttpsListener", {
      open: true,
      port: 443,
      certificates: [cert],
      defaultAction,
    })

    listener.addAction('FoodsmartcomTelenutritionApiAction', {
      priority: 10,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/telenutrition/api/v1/*']),
      ],
      action: elbv2.ListenerAction.forward([telenutritionApiTargetGroup])
    })

    listener.addAction('FoodsmartcomTelenutritionWebAction', {
      priority: 11,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/schedule', '/schedule/', '/schedule/*', '/_next/*']),
      ],
      action: elbv2.ListenerAction.forward([telenutritionWebTargetGroup])
    })

    listener.addAction('FoodsmartcomShortlinkAction', {
      priority: 12,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/l/*']),
      ],
      action: elbv2.ListenerAction.forward([telenutritionApiTargetGroup])
    })

    listener.addAction('FoodsmartcomTelenutritionRetoolApiAction', {
      priority: 13,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/retool-api/*']),
      ],
      action: elbv2.ListenerAction.forward([telenutritionApiTargetGroup])
    })

    if (config.isProduction) {
      listener.addAction('FoodsmartcomOktaRedirectAction', {
        priority: 14,
        conditions: [
          elbv2.ListenerCondition.hostHeaders(['dashboard.foodsmart.com']),
        ],
        action: elbv2.ListenerAction.redirect({
          host: 'foodsmart.okta.com',
          path: '/#{path}',
          port: '#{port}',
          protocol: '#{protocol}',
          query: '#{query}',
          permanent: true,
        })
      })  
    }
    
    new route53.ARecord(this, 'FoodsmartcomARecord', {
      zone,
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(alb)),
    });

    new CfnOutput(this, 'FoodsmartcomTelenutritionApiTargetGroupOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'FoodsmartcomTelenutritionApiTargetGroupArn']),
      value: telenutritionApiTargetGroup.targetGroupArn,
      description: 'Foodsmart.com Telenutrition Api TargetGroup Arn',
    })

    new CfnOutput(this, 'FoodsmartcomTelenutritionWebTargetGroupArnOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'FoodsmartcomTelenutritionWebTargetGroupArn']),
      value: telenutritionWebTargetGroup.targetGroupArn,
      description: 'Foodsmart.com Telenutrition Web TargetGroup Arn',
    })

    new CfnOutput(this, 'FoodsmartcomMarketingWebTargetGroupArnOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'FoodsmartcomMarketingWebTargetGroupArn']),
      value: marketingWebTargetGroup.targetGroupArn,
      description: 'Foodsmart.com Marketing Web TargetGroup Arn',
    })

    new CfnOutput(this, 'FoodsmartcomAlbSecurityGroupIdOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'FoodsmartcomAlbSecurityGroupId']),
      value: albSecurityGroup.securityGroupId,
      description: 'Foodsmart.com ALB security group Id',
    })

  }
}