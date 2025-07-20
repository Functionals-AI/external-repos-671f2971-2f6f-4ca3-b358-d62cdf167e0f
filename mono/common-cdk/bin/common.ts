#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { CommonDataStack } from '../src/stacks/common-data'
import { CommonFlowsStack } from '../src/stacks/common-flows'
import { CommonStoreStack } from '../src/stacks/common-store'
import { CommonNetworkStack } from '../src/stacks/common-network'
import { CommonCacheStack } from '../src/stacks/common-cache'
import Config from '@mono/common/lib/config'
import { CommonWarehouseStack } from '../src/stacks/common-warehouse'

async function main() {
  const config = await Config.from()
  const app = new cdk.App()

  const commonDataStack = new CommonDataStack(app, 'CommonDataStack', {
    stackName: 'CommonData',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config)

  const flowsStack = new CommonFlowsStack(app, 'CommonFlowsStack', {
    stackName: 'CommonFlows',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config)

  const StoreStack = new CommonStoreStack(app, 'CommonStoreStack', {
    stackName: 'common-store',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    }
  }, config)

  const WarehouseStack = new CommonWarehouseStack(app, 'CommonWarehouseStack', {
    stackName: 'CommonWarehouse',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    }
  }, config)

  const NetworkStack = new CommonNetworkStack(app, 'CommonNetworkStack', {
    stackName: 'CommonNetwork',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    }
  }, config)

  const CacheStack = new CommonCacheStack(app, 'CommonCacheStack', {
    stackName: 'CommonCache',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    }
  }, config)
}

main()