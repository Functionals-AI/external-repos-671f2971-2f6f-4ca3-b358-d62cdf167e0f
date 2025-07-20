#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { SecurityStack } from '../src/security/stack'

import Config from '@mono/common/lib/config'

async function main() {
  const config = await Config.from()
  const app = new cdk.App()

  const securityStack = new SecurityStack(app, 'SecurityStack', {
    stackName: 'Security',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config)

  
}

main()