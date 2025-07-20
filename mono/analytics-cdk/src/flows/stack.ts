import { Stack, StackProps } from 'aws-cdk-lib'
import { EventBus } from 'aws-cdk-lib/aws-events'

import { Construct } from 'constructs'
import { IConfig } from '@mono/common/lib/config'
import {createWorkflow} from '@mono/common-cdk/lib/flows'

import {getDependencies} from '@mono/common/lib/package'

import {flows} from '@mono/analytics-flows'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as kms from 'aws-cdk-lib/aws-kms'


const domain = 'Analytics'

export class AnalyticsFlowsStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const dependencies = getDependencies('analytics-flows')
    const {taskDefinition} = createWorkflow({config, flows, domain, dependencies, stack: this}) 

    const eventsBucket = s3.Bucket.fromBucketArn(this, `EventsS3Bucket`, `arn:aws:s3:::${config.analytics_cdk.events.bucketName}`)
    eventsBucket.grantRead(taskDefinition.taskRole)

    const eventsBucketKey = kms.Key.fromKeyArn(this, `EventsS3BucketKey`, config.analytics_cdk.events.bucketKeyArn)
    eventsBucketKey.grantDecrypt(taskDefinition.taskRole)

    const eventBus = EventBus.fromEventBusArn(this, 'DefaultEventBus', `arn:aws:events:us-west-2:${config.aws.accountId}:event-bus/default`)

    eventBus.grantPutEventsTo(taskDefinition.taskRole)

  }
}