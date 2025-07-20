#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { TelenutritionStack } from '../src/telenutrition/stack'
import { TelenutritionFlowsStack } from '../src/telenutrition-flows/stack'
import { TelenutritionAthenaStack } from '../src/telenutrition-athena/stack'
import { TelenutritionAppStack } from '../src/telenutrition-app/stack'
import { TelenutritionE2EStack } from '../src/telenutrition-e2e/stack'
import Config from '@mono/common/lib/config'

async function main() {
  const config = await Config.from()
  const app = new cdk.App()

  if (config.isProduction) {
    const telenutrionStack = new TelenutritionStack(app, 'TelenutritionStack', {
      stackName: 'telenutrition',
      env: {
        region: config.aws.region,
        account: config.aws.accountId,
      },
    })

    const telenutritionAthenaStack = new TelenutritionAthenaStack(app, 'TelenutritionAthenaStack', {
      stackName: 'telenutrition-athena',
      env: {
        region: config.aws.region,
        account: config.aws.accountId
      },
    }, config)
  }

  const telenutrionFlowsStack = new TelenutritionFlowsStack(app, 'TelenutritionFlowsStack', {
    stackName: 'TelenutritionFlows',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    }
  }, config)

  const telenutritionAppStack = new TelenutritionAppStack(app, 'TelenutritionAppStack', {
    stackName: 'TelenutritionApp',
    env: {
      region: config.aws.region,
      account: config.aws.accountId
    },
  }, config)

  const telenutritionE2EStack = new TelenutritionE2EStack(app, 'TelenutritionE2EStack', {
    stackName: 'TelenutritionE2E',
    env: {
      region: config.aws.region,
      account: config.aws.accountId
    },
  }, config)
}

main()
