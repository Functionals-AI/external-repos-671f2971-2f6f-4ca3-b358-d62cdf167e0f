#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AnalyticsEventsStack } from '../src/events/stack'
import { AnalyticsFlowsStack } from '../src/flows/stack'
import { IConfig } from '@mono/common/lib/config'
import Config from '@mono/common/lib/config'
import CdkConfig from '@mono/common-cdk/lib/config'

const _STACK_ID = 'AnalyticsStack'

async function createStack() {
  const config: IConfig = await Config.from()
  const cdkConfig = CdkConfig.getConfig()
  const app = new cdk.App()

  new AnalyticsEventsStack(app, 'AnalyticsEventsStack', {
    stackName: 'AnalyticsEvents',
    env: {
      region: cdkConfig.awsRegion,
      account: cdkConfig.awsAccountId,
    },
  }, config)


  new AnalyticsFlowsStack(app, 'AnalyticsFlowsStack', {
    stackName: 'AnalyticsFlows',
    env: {
      region: cdkConfig.awsRegion,
      account: cdkConfig.awsAccountId,
    },
  }, config)

  app.synth()

}

createStack().then(() => {
    console.log(`Created stack - ${_STACK_ID}`)
    process.exit(0)
  })
  .catch(e => {
    console.log(`Error creating stack - ${_STACK_ID}, e - ${e}`)
    process.exit(1)
  })