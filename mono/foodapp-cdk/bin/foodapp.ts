#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FoodappStack } from '../src/stack';
import { FoodappFlowsStack } from '../src/foodapp-flows/stack'
import { IConfig } from '@mono/common/lib/config'
import Config from '@mono/common/lib/config'
import CdkConfig from '@mono/common-cdk/lib/config'

const _STACK_ID = 'FoodappStack'
const _STACK_NAME = 'foodapp'

const FLOWS_STACK_ID = 'FoodappFlowsStack'
const FLOWS_STACK_NAME = 'foodapp-flows'

async function createStack() {
  const config: IConfig = await Config.from()
  const cdkConfig = CdkConfig.getConfig()
  const app = new cdk.App();

  const stack = new FoodappStack(app, _STACK_ID, config, {
    stackName: _STACK_NAME,
    env: {
      region: cdkConfig.awsRegion,
      account: cdkConfig.awsAccountId,
    },
  });

  new FoodappFlowsStack(app, FLOWS_STACK_ID, config, {
    stackName: FLOWS_STACK_NAME,
    env: {
      region: cdkConfig.awsRegion,
      account: cdkConfig.awsAccountId,
    },
  });

  app.synth()

  return stack
}

createStack().then(() => {
    console.log(`Created stacks - ${_STACK_ID}, ${FLOWS_STACK_ID}`)
    process.exit(0)
  })
  .catch(e => {
    console.log(`Error creating stacks - ${_STACK_ID}, ${FLOWS_STACK_ID}, e - ${e}, stack - ${e.stack}`)
    process.exit(1)
  })