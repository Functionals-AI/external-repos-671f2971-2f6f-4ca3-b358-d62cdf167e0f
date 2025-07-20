import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs/lib/construct'
import { CfnServer } from 'aws-cdk-lib/aws-transfer'
import { CfnOutput, Duration, Fn, RemovalPolicy } from 'aws-cdk-lib'
import { ILambdaEventSource } from '@mono/common/lib/config'

export interface CreateSftpServerOptions {
  // Add serverId to config after stack creation to avoid circular dependency
  serverId: string | undefined,
  vpc: ec2.IVpc,
  subnets: ec2.ISubnet[],
  isProduction: boolean,
  env: string,
  region: string,
  ipAllocationId: string,
  sftpArchiveLambdaEventSources: ILambdaEventSource[],
}

export function createSftpServer(stack: Construct, options: CreateSftpServerOptions) {

  const sftpS3BucketKey = new kms.Key(stack, 'SftpServerBucketKey', {
    enabled: true,
    alias: 'ops-transfer/sftp',
    enableKeyRotation: true,
    keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
  })
  sftpS3BucketKey.grantEncryptDecrypt(new iam.AccountRootPrincipal)


  new CfnOutput(stack, 'SftpKmsKeyOutput', {
    exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'SftpKmsKeyArn']),
    value: sftpS3BucketKey.keyArn,
    description: 'Sftp KMS key arn',
  })

  const sftpServerBucket = new s3.Bucket(stack, 'SftpServerBucket', {
    bucketName: `foodsmart-${options.env}-sftp-server-${options.region}`,
    encryption: s3.BucketEncryption.KMS,
    encryptionKey: sftpS3BucketKey,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: RemovalPolicy.DESTROY,
    versioned: true,
  })

  new CfnOutput(stack, 'SftpServerBucketArnOutput', {
    exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'SftpServerBucketArn']),
    value: sftpServerBucket.bucketArn,
    description: 'Sftp server bucket arn',
  })

  const sftpArchiveBucket = new s3.Bucket(stack, 'SftpArchiveBucket', {
    bucketName: `foodsmart-${options.env}-sftp-archive-${options.region}`,
    encryption: s3.BucketEncryption.KMS,
    encryptionKey: sftpS3BucketKey,
    eventBridgeEnabled: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: RemovalPolicy.DESTROY,
    versioned: true,
  })

  const sftpCopyLambdaFunction = new lambda.Function(stack, 'SftpCopyLambdaFunction', {
    functionName: `ops-transfer-sftp-copy`,
    timeout: Duration.minutes(5),
    handler: 'index.handler',
    code: lambda.Code.fromInline(`
      exports.handler = async (event) => {
        const AWSS3Client = require("@aws-sdk/client-s3")
        const S3Client = AWSS3Client.S3Client
        const CopyObjectCommand = AWSS3Client.CopyObjectCommand
        const DeleteObjectCommand = AWSS3Client.DeleteObjectCommand

        const s3Client = new S3Client({})
        const serverId = process.env['SERVER_ID']
        const response = {}

        console.log(event)

        const {DST_BUCKET_NAME: dstBucketName, BUCKET_KEY: bucketKey} = process.env

        for (let record of event.Records) {
          if (serverId !== undefined && !record.userIdentity?.principalId?.includes(serverId)) {
            console.log(\`Skipping event due object creation not happening on sftp server\`)
            continue
          }

          if ('s3' in record) {
            const {bucket, object} = record.s3
            console.log(record.s3)

            const parts = object.key.split('.')
            parts.splice(1, 0, object.versionId.substring(0,8))
            const dstKey = parts.join('.')

            const s3CopyCommand = new CopyObjectCommand({
              Bucket: dstBucketName,
              CopySource: \`\${bucket.name}/\${object.key}\`, 
              Key: dstKey,
            })

            await s3Client.send(s3CopyCommand)

            console.log(\`copied: \${bucket.name}/\${object.key} -> \${dstBucketName}/\${dstKey}\`)

            const s3DeleteCommand = new DeleteObjectCommand({
              Bucket: bucket.name,
              Key: object.key,
            })

            await s3Client.send(s3DeleteCommand)

            console.log(\`deleted: \${bucket.name}/\${object.key}\`)
          }
        }

        return response
      }
    `),
    runtime: lambda.Runtime.NODEJS_22_X,
    environment: {
      SERVER_ID: options.serverId,
      DST_BUCKET_NAME: sftpArchiveBucket.bucketName,
      BUCKET_KEY: sftpS3BucketKey.keyArn,
    }
  })

  sftpArchiveBucket.grantWrite(sftpCopyLambdaFunction.role)
  sftpServerBucket.grantReadWrite(sftpCopyLambdaFunction.role)

  const sftpServerObjectCreatedEventSource = new lambdaEventSources.S3EventSource(sftpServerBucket, {
    events: [
      s3.EventType.OBJECT_CREATED
    ]
  })

  sftpCopyLambdaFunction.addEventSource(sftpServerObjectCreatedEventSource)

  //
  // Create event sources for any Lambda's to be triggered from the SFTP archive bucket.
  //
  if (options.sftpArchiveLambdaEventSources) {
    for (let lambdaEventSourceConfig of options.sftpArchiveLambdaEventSources) {
      const eventSource = new lambdaEventSources.S3EventSource(sftpArchiveBucket, {
        events: [
          lambdaEventSourceConfig['event']
        ],
        filters: [ lambdaEventSourceConfig['filter'] ]
      })

      const filterPrefix = lambdaEventSourceConfig['filter']['prefix'].replace('/', '')
      const lambdaFunctionID = `SFTPArchive${filterPrefix.charAt(0).toUpperCase()}${filterPrefix.slice(1)}${lambdaEventSourceConfig['functionName'].split('-').map(n => n.charAt(0).toUpperCase().concat(n.slice(1))).join('')}Lambda`
      const lambdaFunction = lambda.Function.fromFunctionArn(stack, lambdaFunctionID, lambdaEventSourceConfig['functionArn'])

      lambdaFunction.addEventSource(eventSource)
    }
  }

  // Only create the sftp server in production
  if (options.isProduction) {
    const sftpLoggingRole = new iam.Role(stack, 'SftpLoggingRole', {
      assumedBy: new iam.ServicePrincipal('transfer.amazonaws.com'),
      description: 'Logging Role for the AWS Transfer SFTP Server',
    })
  
    sftpLoggingRole.addToPrincipalPolicy(new iam.PolicyStatement({
      sid: 'Logs',
      actions: [
        'logs:CreateLogStream',
        'logs:DescribeLogStreams',
        'logs:CreateLogGroup',
        'logs:PutLogEvents',
      ],
      resources: ['*'],
    }))
  
    const userSecret = new secretsmanager.Secret(stack, 'SftpUserSecret', {
      secretName: 'ops-transfer/sftp-users',
      description: 'User authentication information for transfer SFTP service',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ user: { password: '...', publicKey: '...' } }),
        generateStringKey: 'password',
      }
    })
  
    const userAuthLambdaExecutionRole = new iam.Role(stack, 'SftpUserAuthLambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'SFTP standard user role',
    })
  
    userAuthLambdaExecutionRole.addManagedPolicy({
      managedPolicyArn: Fn.sub('arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')
    })
  
    userAuthLambdaExecutionRole.addToPrincipalPolicy(new iam.PolicyStatement({
      sid: 'List',
      actions: ['s3:ListBucket'],
      resources: [sftpServerBucket.bucketArn],
    }))
  
    userAuthLambdaExecutionRole.addToPrincipalPolicy(new iam.PolicyStatement({
      sid: 'UserObjects',
      actions: [
        's3:ListBucket',
        's3:PutObject',
        's3:GetObject',
        's3:GetObjectVersion',
      ],
      resources: [sftpServerBucket.bucketArn, `${sftpServerBucket.bucketArn}/*`],
    }))
  
  
    const sftpUserRole = new iam.Role(stack, 'SftpUserRole', {
      assumedBy: new iam.ServicePrincipal('transfer.amazonaws.com'),
      description: 'IAM role used by Transfer to give access to S3 bucket after user is authenticated',
    })
  
    sftpUserRole.addToPrincipalPolicy(new iam.PolicyStatement({
      sid: 'Objects',
      actions: [
        's3:ListBucket',
        's3:PutObject',
        's3:PutObjectAcl',
        's3:GetObject',
        's3:GetObjectAcl',
        's3:GetObjectVersion',
        's3:DeleteObject',
        's3:DeleteObjectVersion',
        's3:GetBucketLocation',
      ],
      resources: [sftpServerBucket.bucketArn, `${sftpServerBucket.bucketArn}/*`],
    }))
  
    sftpUserRole.addToPrincipalPolicy(new iam.PolicyStatement({
      sid: 'Kms',
      actions: [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ],
      resources: [sftpS3BucketKey.keyArn],
    }))
  
    const userAuthLambdaFunction = new lambda.Function(stack, 'SftpAuthLambdaFunction', {
      functionName: `ops-transfer-sftp-auth`,
      timeout: Duration.seconds(10),
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          const AWSClientSecretsManager = require("@aws-sdk/client-secrets-manager")
          const SecretsManagerClient = AWSClientSecretsManager.SecretsManagerClient
          const GetSecretValueCommand = AWSClientSecretsManager.GetSecretValueCommand
          const net = require('net')
          const response = {}
          const {protocol, username, serverId, password, sourceIp} = event
          const {SERVER_ID: trustedServerId, ROLE: role, BUCKET_NAME: bucketName, BUCKET_KEY: bucketKey, SECRET_ID: secretId} = process.env
  
          console.log('event: ', event)
  
          if (protocol !== 'SFTP') {
            console.log('Only SFTP protocol is supported')
            return response
          }
  
          if (username === undefined || !/^[a-z]{3,32}$/.test(username)) {
            console.log('username is required or invalid')
            return response
          }
  
          if (serverId !== trustedServerId) {
            console.log('serverId doesnt match')
            return response
          }
  
          const secretsManagerClientInstance = new SecretsManagerClient()
          const secretsManagerCommand = new GetSecretValueCommand({SecretId: secretId})
          const {SecretString: secretString} = await secretsManagerClientInstance.send(secretsManagerCommand)
          const users = JSON.parse(secretString)
  
          if (!(username in users)) {
            return response
          }
  
          const user = users[username]
       
          if ('ips' in user) {
            const ips = user.ips
            const whiteList = new net.BlockList()
  
            for (let ip of ips) {
              if (ip.indexOf('-') >= 0) {
                const ips = ip.split('-')
  
                if (ips.length != 2 || !net.isIP(ip[0]) || !net.isIP(ip[1])) {
                  console.log(\`error: invalid ip: \${ip}\`)
                  continue
                }
                whiteList.addRange(ip[0], ip[1])
              } else {
                if (!net.isIP(ip)) {
                  console.log(\`error: invalid ip: \${ip}\`)
                  continue
                }
                whiteList.addAddress(ip)  
              }
            }
  
            if (!whiteList.check(sourceIp)) {
              console.log(\`error: source ip: \${sourceIp} doesn't match whitelist: \${ips}\`)
              return response
            }
          }
  
          if ('password' in user) {
            if (user.password !== password) {
              return response
            }  
          } else if ('publicKey' in user) {
            response.PublicKeys = user.publicKey.split(',')
          } else {
            return response
          }
  
          response.Role = role
          response.Policy = JSON.stringify({
            "Version": "2012-10-17",
            "Statement": [
              {
                "Sid": "AllowListingOfUserFolder",
                "Effect": "Allow",
                "Action": "s3:ListBucket",
                "Resource": \`arn:aws:s3:::\${bucketName}\`,
                "Condition": {
                    "StringLike": {
                        "s3:prefix": [
                            \`\${username}/*\`,
                            \`\${username}\`
                        ]
                    }
                }
              },
              {
                "Sid": "HomeDirObjectAccess",
                "Effect": "Allow",
                "Action": [
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    's3:DeleteObject',
                    's3:DeleteObjectVersion'            
                ],
                "Resource": \`arn:aws:s3:::\${bucketName}/\${username}/*\`
              },
              {
                "Sid": "KmsAccess",
                "Effect": "Allow",
                "Action": [
                  "kms:Encrypt",
                  "kms:Decrypt",
                  "kms:ReEncrypt",
                  "kms:GenerateDataKey",
                  "kms:DescribeKey"
                ],
                "Resource": bucketKey,
              },
            ]
          })
          response.HomeDirectoryType ='LOGICAL'
          response.HomeDirectoryDetails = JSON.stringify([
            { Entry: '/', Target: \`/\${bucketName}/\${username}\`}
          ])
  
          console.log(response)
          return response
        }
      `),
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: {
        SERVER_ID: options.serverId,
        ROLE: sftpUserRole.roleArn,
        BUCKET_NAME: sftpServerBucket.bucketName,
        BUCKET_KEY: sftpS3BucketKey.keyArn,
        SECRET_ID: userSecret.secretFullArn,
      }
    })
  
    userSecret.grantRead(userAuthLambdaFunction.role)
  
    const securityGroup = new ec2.SecurityGroup(stack, 'SftpSecurityGroup', {  
      vpc: options.vpc,
      description: 'Security group used by AWS Transfer Sftp',
      securityGroupName: `OpsTransfer_Sftp`,
      allowAllOutbound: false,
    })

    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22))

    const subnet = options.subnets.filter(subnet => subnet.availabilityZone === 'usw2-az1')[0]

    const server = new CfnServer(stack, 'SftpServer', {
      domain: 'S3',
      endpointType: 'VPC',
      endpointDetails: {
        vpcId: options.vpc.vpcId,
        subnetIds: [subnet.subnetId],
        securityGroupIds: [securityGroup.securityGroupId],
        addressAllocationIds: [options.ipAllocationId],
      },
      identityProviderType: 'AWS_LAMBDA',
      identityProviderDetails: {
        function: userAuthLambdaFunction.functionArn,
      },
      loggingRole: sftpLoggingRole.roleArn,
      protocols: ['SFTP'],
    })
  
    userAuthLambdaFunction.addPermission('InvokeFunction', {
      action: 'lambda:InvokeFunction',
      principal: new iam.ServicePrincipal('transfer.amazonaws.com'),
      sourceArn: server.attrArn,
    })
  }
}