import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as firehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { KinesisDestination, LambdaDestination } from 'aws-cdk-lib/aws-logs-destinations';
import { Construct } from 'constructs';
import { IConfig } from '@mono/common/lib/config'

export function createCloudWatch(stack: Construct, config: IConfig) {
  const accountId = cdk.Aws.ACCOUNT_ID;

  // Create the S3 bucket for Cloudwatch->firehose->crowdstrike
  // As this is just log shipping, keep the retention at no more than a week.
  // Consider reducing retention to reduce cost.
  const seimBucket = new s3.Bucket(stack, "export-logs-to-siem-", {
    lifecycleRules: [{
      id: 'S3LogRetention',
      expiration: cdk.Duration.days(7),
      enabled: true
    }]
  });

  // Create the Kinesis Firehose delivery stream
  const firehoseRole = new iam.Role(stack, 'FirehoseRole', {
    assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    inlinePolicies: {
      firehosePolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ['s3:PutObject', 's3:PutObjectAcl'],
            resources: [seimBucket.bucketArn + '/*']
          })
        ]
      })
    }
  });

  const firehoseStream = new firehose.CfnDeliveryStream(stack, 'FirehoseToS3seim', {
    extendedS3DestinationConfiguration: {
      bucketArn: seimBucket.bucketArn,
      roleArn: firehoseRole.roleArn,
      prefix: "cloudwatch/loggroups/", 
      processingConfiguration: {
        enabled: true,
        processors: [{
          type: "AppendDelimiterToRecord",
          parameters: [{
            parameterName: "Delimiter",
            parameterValue: '\\n',
          }],
        }],
      },
    }
  });

  // Create the Lambda function to enrich cloudwatch loggroup events and send tofirehose
  const lambdaRole = new iam.Role(stack, 'CloudWatchtoFirehoseLambdaRole', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    ],
    inlinePolicies: {
      lambdaPolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: ['*']
          }),
          new iam.PolicyStatement({
            actions: ['firehose:PutRecordBatch'],
            resources: [firehoseStream.attrArn]
          })
        ]
      })
    }
  });

  const cloudwatchLogProcessor = new lambda.Function(stack, 'CloudWatchtoFirehoseLambda', {
    runtime: lambda.Runtime.NODEJS_22_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset('lambda/CloudWatchtoFirehoseLambda/dist'),
    role: lambdaRole,
    environment: {
      DELIVERY_STREAM_NAME: firehoseStream.ref
    }
  });

  // Subscribe selected cloudwatch log groups to the firehose

  // Function to sanitize log group names
  const sanitizeName = (name: string): string => {
    return name.replace(/[^a-zA-Z0-9-_]/g, '-');
  };


  
  // Vendor Specific Configs ======================================================================

  // Sumologic ----------------------------
  if(config.security_cdk.sumologic){
    // Role so Sumologic can read the S3bucket
    const sumoRole = new iam.Role(stack, 'sumologicCloudwatchLogsRole', {
      assumedBy: new cdk.aws_iam.ArnPrincipal(config.security_cdk.sumologic.assumedBy),
      externalIds: [config.security_cdk.sumologic.cloudwatch.externalId],
      path: '/',
      inlinePolicies: {
        SumoPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:ListBucket',
              ],
              resources: [
                seimBucket.bucketArn + '/*',
                seimBucket.bucketArn,
              ],
            })
          ],
        }),
      },
    });

    // Iterate through the log group names and add a subscription filter to each
    config.security_cdk.sumologic.cloudwatch.loggroups.forEach(logGroupName => {
      const sanitizedLogGroupName = sanitizeName(logGroupName);

      const existingLogGroup = logs.LogGroup.fromLogGroupName(stack, `LogGroup-sumologic-${sanitizedLogGroupName}`, logGroupName);

      new logs.SubscriptionFilter(stack, `Subscription-sumologic-${sanitizedLogGroupName}`, {
        logGroup: existingLogGroup,
        destination: new LambdaDestination(cloudwatchLogProcessor),
        filterPattern: logs.FilterPattern.allEvents(),
      });
    });
  }

  // Optimize sumologic by adding SNS when logs are created

  // Create the SNS Topic
  const sumoSNSTopic = new sns.Topic(stack, 'SumologicSNSTopic', {
    topicName: `SumoSNSTopic-${cdk.Stack.of(stack).stackName}`,
  });

  // Create the SNS Subscription
  sumoSNSTopic.addSubscription(new snsSubscriptions.UrlSubscription(config.security_cdk.sumologic.cloudwatch.snsurl, {
    protocol: sns.SubscriptionProtocol.HTTPS,
    deadLetterQueue: undefined,
    filterPolicy: undefined,
    rawMessageDelivery: false,
  }));

  // Create the SNS Topic Policy
  new sns.CfnTopicPolicy(stack, 'SumologicSNSTopicPolicy', {
    topics: [sumoSNSTopic.topicArn],
    policyDocument: {
      Version: '2012-10-17',
      Id: 'SumologicTopicPolicy',
      Statement: [
        {
          Effect: 'Allow',
          Action: 'sns:Publish',
          Principal: {
            AWS: '*',
          },
          Resource: sumoSNSTopic.topicArn,
          Condition: {
            StringEquals: {
              'aws:SourceAccount': cdk.Aws.ACCOUNT_ID,
            },
            ArnLike: {
              'aws:SourceArn': seimBucket.bucketArn,
            },
          },
        },
      ],
    },
  });
  
  // Crowdstrike --------------------------
  // Disabling because this isn't even ingesting
  /*
  if(config.security_cdk.crowdstrike){
    // Add the things that CrowdStrike wants
    // Create SQS Queue that recieves a notification every time a new log is written to the bucket
    const crowdStrikeSQSQueue = new sqs.Queue(stack, 'crowdstrike-cloudwatch-${accountId}Queue');
    // Attach queue to the bucket
    seimBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.SqsDestination(crowdStrikeSQSQueue));

    // Ensure that crowdsrike can access this bucket from their account
    const crowdstrikeRole = new iam.Role(stack, "crowdstrike-cloudwatch-${accountId}Role", {
      assumedBy: new cdk.aws_iam.ArnPrincipal(config.security_cdk.crowdstrike.assumedBy),
      externalIds: [config.security_cdk.crowdstrike.cloudwatch.externalId],  
      inlinePolicies: {
        CrowdStrikeS3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['s3:GetObject'],
              resources: [seimBucket.bucketArn + '/*']
            }),
            new iam.PolicyStatement({
              actions: ['s3:ListBucket'],
              resources: [seimBucket.bucketArn]
            })
          ]
        }),
        CrowdStrikeSQSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueUrl', 'sqs:GetQueueAttributes'],
              resources: [crowdStrikeSQSQueue.queueArn]
            })
          ]
        })
      }
    });

    // SQS Queue Policy
    const crowdStrikeSQSQueuePolicy = new sqs.QueuePolicy(stack, 'CrowdStrikeSQSQueuePolicy', {
      queues: [crowdStrikeSQSQueue],
    });
    crowdStrikeSQSQueuePolicy.document.addStatements(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sqs:SendMessage'],
      resources: [crowdStrikeSQSQueue.queueArn],
      principals: [new iam.ServicePrincipal('s3.amazonaws.com')]
    }));

    // Iterate through the log group names and add a subscription filter to each
    config.security_cdk.crowdstrike.cloudwatch.loggroups.forEach(logGroupName => {
      const sanitizedLogGroupName = sanitizeName(logGroupName);

      const existingLogGroup = logs.LogGroup.fromLogGroupName(stack, `LogGroup-${sanitizedLogGroupName}`, logGroupName);

      new logs.SubscriptionFilter(stack, `Subscription-${sanitizedLogGroupName}`, {
        logGroup: existingLogGroup,
        destination: new LambdaDestination(cloudwatchLogProcessor),
        filterPattern: logs.FilterPattern.allEvents(),
      });
    });
  }
  */
}

export default {
  createCloudWatch,
}