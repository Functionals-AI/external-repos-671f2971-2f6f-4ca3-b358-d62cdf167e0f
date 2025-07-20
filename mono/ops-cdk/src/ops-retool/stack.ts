import { RemovalPolicy, Stack, StackProps, Duration } from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import { Construct } from 'constructs'
import Config from '@mono/common-cdk/lib/config'
import { createVpc } from '@mono/common-cdk/lib/vpc'
import { IConfig } from '@mono/common/lib/config'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { PublicHostedZone, PrivateHostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53'
import {LoadBalancerTarget, Route53RecordTarget} from 'aws-cdk-lib/aws-route53-targets'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { ListenerAction, ListenerCondition } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'


const _DATABASE_NAME = 'retool'

interface OpsRetoolStackProps extends StackProps {
  okta_cidrs: string[];
}

export class OpsRetoolStack extends Stack {


  constructor(scope: Construct, id: string, props: OpsRetoolStackProps, config: IConfig) {
    super(scope, id, props)

    const cdkConfig = Config.getConfig();
    const { vpc, subnets } = createVpc(this, cdkConfig)
    const cluster = new ecs.Cluster(this, `RetoolCluster`, {
      clusterName: `Retool`,
      containerInsights: true,
      vpc,
    })

    const dns = config.common_cdk.route53.foodsmartcom.public
    const domainName = `admin.${dns.domain}`;
    const domainZone = PublicHostedZone.fromHostedZoneAttributes(this, 'FoodsmartcomHostedZone', {
      hostedZoneId: dns.zoneId,
      zoneName: dns.domain,
    })

    // Create security groups - they're configured later

    // Create security group for internal ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'RetoolALBSecurityGroup', {
      description: 'Retool load balancer security group.',
      vpc: vpc,
      securityGroupName: `${config.env}-sg-alb-retool`
    })

    // Retool temporal worker(s)
    const retoolTemporalWorkerSecurityGroup = new ec2.SecurityGroup(this, 'RetoolTemporalWorkerSecurityGroup', {
      description: 'Retool temporal worker security group.',
      vpc: vpc,
      securityGroupName: `${config.env}-sg-temporal-worker-retool`
    })

    // Externally-facing security group for external ALB
    const oktaSecurityGroup = new ec2.SecurityGroup(this, 'RetoolOktaSCIMSecurityGroup', {
      description: 'SCIM load balancer security group.',
      vpc: vpc,
      allowAllOutbound: true,
    });

    // Build out containers in fargate
    const retoolTaskDef = new ecs.FargateTaskDefinition(this, 'RetoolTask', {
      memoryLimitMiB: 4096,
      cpu: 2048,
      family: 'retool',
    })

    const retoolJobsRunnerTaskDef = new ecs.FargateTaskDefinition(this, 'RetoolJobsRunnerTask', {
      memoryLimitMiB: 4096,
      cpu: 2048,
      family: 'retool',
    })

    const image = ecs.ContainerImage.fromRegistry('tryretool/backend:3.75.11-stable')
    const secretsManager = secretsmanager.Secret.fromSecretNameV2(this, 'retool', 'retool')

    const environment = {
      'NODE_ENV': 'production',
      'POSTGRES_DB': _DATABASE_NAME,
      'POSTGRES_HOST': config.common.store.writer.host,
      'POSTGRES_PORT': String(config.common.store.writer.port),
      'POSTGRES_SSL_ENABLED': 'true',
      'POSTGRES_USER': config.ops.retool.user,
      'GITHUB_APP_ID': '290879',
      'GITHUB_APP_INSTALLATION_ID': '33962665',
      'VERSION_CONTROL_LOCKED': 'false',
      'INVITES_PER_DAY': '5000',
      'RETOOL_EXPOSED_TELENUTRITION_API_BASE_URL': config.telenutrition_api.retool.baseUrl,
    }

    const secrets = {
      'POSTGRES_PASSWORD': ecs.Secret.fromSecretsManager(secretsManager,'POSTGRES_PASSWORD'),
      'JWT_SECRET': ecs.Secret.fromSecretsManager(secretsManager,'JWT_SECRET'),
      'ENCRYPTION_KEY': ecs.Secret.fromSecretsManager(secretsManager,'ENCRYPTION_KEY'),
      'LICENSE_KEY': ecs.Secret.fromSecretsManager(secretsManager,'LICENSE_KEY'),
      'GITHUB_APP_PRIVATE_KEY': ecs.Secret.fromSecretsManager(secretsManager,'GITHUB_APP_PRIVATE_KEY'),
      'SCIM_AUTH_TOKEN': ecs.Secret.fromSecretsManager(secretsManager,'SCIM_AUTH_TOKEN'),
      'RETOOL_EXPOSED_TELENUTRITION_API_SECRET':  ecs.Secret.fromSecretsManager(secretsManager,'RETOOL_EXPOSED_TELENUTRITION_API_SECRET'),
    }

    const logGroup = new LogGroup(this, 'OpsRetoolTaskLogGroup', {
      logGroupName: `/foodsmart/ops/ops-retool`,
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const logDriver = ecs.LogDriver.awsLogs({
      logGroup: logGroup,
      streamPrefix: 'ops-retool-tasks'
    })

    retoolTaskDef.addContainer('retool', {
      image,
      portMappings: [{
        containerPort: 3000
      }],
      environment: {
        'SERVICE_TYPE': 'MAIN_BACKEND,DB_CONNECTOR',
        'COOKIE_INSECURE': 'true',
        'BASE_DOMAIN': `https://${domainName}`,
        ...environment
      },
      secrets: secrets,
      command: ["./docker_scripts/start_api.sh"],
      logging: logDriver,
    })

    retoolJobsRunnerTaskDef.addContainer('retool-jobs-runner', {
      image,
      environment: {
        'SERVICE_TYPE': 'JOBS_RUNNER',
        ...environment
      },
      secrets: secrets,
      command: ["./docker_scripts/start_api.sh"],
      logging: logDriver,
    })

    new ecs.FargateService(this, 'OpsRetoolJobRunnerService', {
      cluster,
      desiredCount: 1,
      taskDefinition: retoolJobsRunnerTaskDef,
      securityGroups: [albSecurityGroup],
      vpcSubnets: subnets
    })

    const adminCert = new acm.Certificate(this, 'AdminRetoolCertificate', {
      domainName: domainName,
      subjectAlternativeNames: [`internal-${domainName}`],
      validation: acm.CertificateValidation.fromDns(domainZone),
    })

    const retoolInternalService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'OpsRetoolInternalService', {
      cluster,
      certificate: adminCert,
      desiredCount: config.isProduction ? 2 : 1,
      openListener: false,
      publicLoadBalancer: false,
      assignPublicIp: false,
      taskDefinition: retoolTaskDef,
      taskSubnets: subnets,
      protocol: ApplicationProtocol.HTTPS,
      redirectHTTP: true,
      securityGroups: [albSecurityGroup],
      loadBalancer: new ApplicationLoadBalancer(this, 'RetoolInternalALB', {
        vpc,
        internetFacing: false,
        securityGroup: albSecurityGroup,
        vpcSubnets: subnets,
      })
    })

    retoolInternalService.targetGroup.configureHealthCheck({
      path: '/api/checkHealth',
    })

    const retoolTemporalWorkerTaskDef = new ecs.FargateTaskDefinition(this, 'RetoolTemporalWorkerTask', {
      memoryLimitMiB: 2048,
      cpu: 1024,
      family: 'retool',
    })

    retoolTemporalWorkerTaskDef.addContainer('retool-temporal-worker', {
      image,
      environment: {
        'SERVICE_TYPE': 'WORKFLOW_TEMPORAL_WORKER',
        'NODE_OPTIONS': '--max_old_space_size=1024',
        'DISABLE_DATABASE_MIGRATIONS': 'true',
        'WORKFLOW_BACKEND_HOST': `http://${retoolInternalService.loadBalancer.loadBalancerDnsName}`,
        ...environment
      },
      secrets: secrets,
      command: ["./docker_scripts/start_api.sh"],
      logging: logDriver,
    })

    const temporalWorkerService = new ecs.FargateService(this, 'OpsRetoolTemporalWorkerService', {
      cluster,
      desiredCount: 1,
      taskDefinition: retoolTemporalWorkerTaskDef,
      securityGroups: [retoolTemporalWorkerSecurityGroup],
      vpcSubnets: subnets
    })

    // Setup S3 buckets for retool
    if(config.ops_cdk?.data?.destBuckets?.commonData?.arn && config.ops_cdk?.data?.destBuckets?.commonData?.kmsKeyArn) {
      const bucketName = config.ops_cdk.data.destBuckets.commonData.name;
      const kmsKeyArn = config.ops_cdk.data.destBuckets.commonData.kmsKeyArn;

      const commonDataBucket = s3.Bucket.fromBucketName(this, 'CommonDataBucket', bucketName);
      commonDataBucket.grantRead(retoolTaskDef.taskRole);   
      commonDataBucket.grantReadWrite(retoolTaskDef.taskRole, `credentialing`);   
      commonDataBucket.grantReadWrite(retoolTaskDef.taskRole, `credentialing/*`);

      const commonDataBucketKMSKey = kms.Key.fromKeyArn(this, 'CommonDataBucketKmsKey', kmsKeyArn);
      commonDataBucketKMSKey.grantEncryptDecrypt(retoolTaskDef.taskRole);
    }

    // Create External ALB for Okta SCIM use
    const oktaLoadBalancer = new ApplicationLoadBalancer(this, 'SCIMLoadBalancer', {
      vpc,
      internetFacing: true,
      securityGroup: oktaSecurityGroup,
    });

    const oktaScimListner = oktaLoadBalancer.addListener('SCIMListener', {
      port: 443,
      open: false,
      protocol: ApplicationProtocol.HTTPS,
      certificates: [adminCert],
      defaultAction: ListenerAction.fixedResponse(403, {
          contentType: 'text/plain',
          messageBody: 'Forbidden'
        })
    });
    
    const oktaScimListnerTarget = oktaScimListner.addTargets('SCIMTarget', {
      port: 3000,
      protocol: ApplicationProtocol.HTTP,
      targets: [retoolInternalService.service],
      healthCheck: {
        path: '/api/checkHealth',
        interval: Duration.minutes(1),
      },
    });

    // Rule 1: Allow okta to reach the scim API
    oktaScimListner.addAction('OktaPrefixListApiScimRule', {
      action: ListenerAction.forward([oktaScimListnerTarget]), 
      conditions: [
        ListenerCondition.pathPatterns(['/api/scim/v2/*'])
      ],
      priority: 1,
    });

    // Rule 2: Allow all traffic from local IP ranges
    oktaScimListner.addAction('LocalIpAllowAllRule', {
      action: ListenerAction.forward([oktaScimListnerTarget]),
      conditions: [
        ListenerCondition.sourceIps(['10.0.0.0/8']),
      ],
      priority: 2,
    });

    // Point admin.foodsmart-env.com to public load balancer for Okta
    const adminPublicAliasRecord = new ARecord(this, 'AdminPublicAliasRecord', {
      zone: domainZone,
      recordName: domainName,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(oktaLoadBalancer)),
    });
    adminPublicAliasRecord.node.addDependency(retoolInternalService.loadBalancer);

    // Create Private Route53 entry to point to the private IP in Ops VPC
    const OpsVpc = ec2.Vpc.fromLookup(this, 'OpsVPC', {
      vpcId: config.ops_cdk.vpcs.default.id,
    });

    const privateHostedZone = new PrivateHostedZone(this, 'AdminPrivateZone', {
      zoneName: domainName,
      vpc: OpsVpc
    });

    // Also point to the private load balancer from inside this VPC
    privateHostedZone.addVpc(vpc);
    
    new ARecord(this, 'InternalALBAliasRecord', {
      zone: privateHostedZone,
      recordName: domainName,
      target: RecordTarget.fromAlias(new LoadBalancerTarget(retoolInternalService.loadBalancer)),
    });

    // Set security group Rules

    // Fetch external security group IDs
      const islandSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this,'IslandSecurityGroup', config.common_cdk.vpcs.default.securityGroups.island.id,
      {
          allowAllOutbound: false, // Ensure you control egress rules in the remote SG
          mutable: false, // Mark as immutable since you won't manage it in this account
      }
    );

    // Configure security group for internal ALB
    albSecurityGroup.addIngressRule(islandSecurityGroup, ec2.Port.tcp(80), `Allow inbound HTTP traffic from Island`);
    albSecurityGroup.addIngressRule(islandSecurityGroup, ec2.Port.tcp(443), `Allow inbound HTTPS traffic from Island`);

    const commonStoreSecurityGroup = ec2.SecurityGroup.fromLookupById(this, 'CommonStoreSecurityGroup', config.common_cdk.vpcs.default.securityGroups.rds_common_store.id);
    commonStoreSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(5432), `Retool access to RDS common store cluster.`);

    const commonRedshiftSecurityGroup = ec2.SecurityGroup.fromLookupById(this, 'CommonRedshiftSecurityGroup', config.common_cdk.vpcs.default.securityGroups.redshift.id);
    commonRedshiftSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(5439), `Retool access to Redshift common cluster.`);

    // Configure security groups for Retool temporal worker(s)
    albSecurityGroup.addIngressRule(retoolTemporalWorkerSecurityGroup, ec2.Port.tcp(80), `Allow inbound HTTP traffic from Retool temporal worker`);
    commonStoreSecurityGroup.addIngressRule(retoolTemporalWorkerSecurityGroup, ec2.Port.tcp(5432), `Retool access to RDS common store cluster.`);

    // Configure security groups for external ALB
    const prefixGroupName = `okta_us_cell_14`;

    // Create AWS Prefix List for this 'us_cell_x'
    const prefixList = new ec2.CfnPrefixList(this, prefixGroupName, {
      addressFamily: 'IPv4',
      maxEntries: props.okta_cidrs.length,
      entries: props.okta_cidrs.map((cidr: string) => ({ cidr })),
      prefixListName: prefixGroupName,
    });

    // Optionally, you can log the generated names and CIDRs for debugging
    console.log(`Created Prefix List: ${prefixGroupName} with ${props.okta_cidrs.length} CIDRs`);

    // Add Okta rules AFTER prefix list is created
    // Note: Since this is > 60 rules, we need to request a quota increase from AWS
    // This has been done for staging, production, and dev
    oktaSecurityGroup.addIngressRule(
      ec2.Peer.prefixList(prefixList.attrPrefixListId),
      ec2.Port.tcp(443),
      `Allow traffic from Okta Prefix List: us_cell_14`
    );
    oktaSecurityGroup.node.addDependency(prefixList);
  }
}
