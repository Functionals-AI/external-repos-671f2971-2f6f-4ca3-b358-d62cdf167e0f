#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import axios from 'axios';
import { OpsStack } from '../src/ops/stack'
import { OpsAccessStack } from '../src/ops-access/stack'
import { OpsDataStack } from '../src/ops-data/stack'
import { OpsStoreStack } from '../src/ops-store/stack'
import { OpsTransferStack } from '../src/ops-transfer/stack'
import { OpsFlowsStack } from '../src/ops-flows/stack'
import { OpsRetoolStack } from '../src/ops-retool/stack'
import { OpsMigrationsStack } from '../src/ops-migrations/stack'
import { OpsDeidentStack } from '../src/ops-deident/stack'

import Config from '@mono/common/lib/config'
import DomainConfig from '@mono/ops/lib/config'

async function main() {
  const config = await Config.from()
  const domainConfig = await DomainConfig.from()

  const app = new cdk.App()

  const opsStack = new OpsStack(app, 'OpsStack', {
    stackName: 'Ops',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config)

  if (config.isProduction) {
    new OpsAccessStack(app, 'OpsAccessStack', {
      stackName: 'OpsAccess',
      env: {
        region: config.aws.region,
        account: config.aws.accountId,
      },
    }, config)
  }

  new OpsDataStack(app, 'OpsDataStack', {
    stackName: 'OpsData',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config)

  new OpsStoreStack(app, 'OpsStoreStack', {
    stackName: 'OpsStore',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config)

  new OpsMigrationsStack(app, 'OpsMigrationsStack', {
    stackName: 'OpsMigrations',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config)

  new OpsTransferStack(app, 'OpsTransferStack', {
    stackName: 'OpsTransfer',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config)

  new OpsFlowsStack(app, 'OpsFlowsStack', {
    stackName: 'OpsFlows',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config, domainConfig) 

  new OpsDeidentStack(app, 'OpsDeidentStack', {
    stackName: 'OpsDeident',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config) 

  if (config.isStaging || config.isProduction || config.isDevelopment) {
    // 1. Fetch external IPs from Okta at synth-time
    const ipRangesUrl = 'https://s3.amazonaws.com/okta-ip-ranges/ip_ranges.json';
    const response = await axios.get(ipRangesUrl);
    
    // Suppose we only care about "us_cell_14" IP ranges
    const cidrs = response.data['us_cell_14']?.ip_ranges ?? [];
    console.log(`Synth-time fetched ${cidrs.length} Okta IP ranges for 'us_cell_14'`);

    new OpsRetoolStack(app, 'OpsRetoolStack', {
      stackName: 'OpsRetool',
      env: {
        region: config.aws.region,
        account: config.aws.accountId,
      },
      okta_cidrs: cidrs,
    }, config)
  }
}

main()