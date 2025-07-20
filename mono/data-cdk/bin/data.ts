#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'

import { DataSagemakerStack } from '../src/data-sagemaker/stack'
import Config from '@mono/common/lib/config'

async function main() {
  const config = await Config.from()
  
  if (config.isProduction) {
    const app = new cdk.App()

    const dataStack = new DataSagemakerStack(app, 'DataSagemakerStack', {
      stackName: 'DataSagemaker',
      env: {
        region: config.aws.region,
        account: config.aws.accountId,
      },
    }, config)
  }
}

main()