#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FoodcardsStack } from '../src/foodcards/stack'
import { FoodcardsFlowsStack } from '../src/foodcards-flows/stack'
import { IConfig } from '@mono/common/lib/config'
import Config from '@mono/common/lib/config'

const STACK_ID = 'FoodcardsStack'
const STACK_NAME = 'foodcards'

const FLOWS_STACK_ID = 'FoodcardsFlowsStack'
const FLOWS_STACK_NAME = 'foodcards-flows'

async function main() {
  const config: IConfig = await Config.from()
  const app = new cdk.App();

  new FoodcardsStack(app, STACK_ID, {
    stackName: STACK_NAME,
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config)

  new FoodcardsFlowsStack(app, FLOWS_STACK_ID, {
    stackName: FLOWS_STACK_NAME,
    env: {
      region: config.aws.region,
      account: config.aws.accountId
    }
  }, config)

}

main()
