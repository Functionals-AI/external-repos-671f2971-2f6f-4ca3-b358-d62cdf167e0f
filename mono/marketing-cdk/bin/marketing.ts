import * as cdk from 'aws-cdk-lib'
import Config from '@mono/common/lib/config'
import { MarketingApiStack } from '../src/marketing-api/stack'
import { MarketingFlowsStack } from '../src/marketing-flows/stack'
import { MarketingWebStack } from '../src/marketing-web/stack'

async function main() {
  const config = await Config.from()

  const app = new cdk.App()

  new MarketingFlowsStack(app, 'MarketingFlowsStack', {
    stackName: 'MarketingFlows',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config)

  new MarketingWebStack(app, 'MarketingWebStack', {
    stackName: 'MarketingWeb',
    env: {
      region: config.aws.region,
      account: config.aws.accountId,
    },
  }, config)
  

  if (config.isProduction) {
    
    new MarketingApiStack(app, 'MarketingApiStack', {
      stackName: 'MarketingApi',
      env: {
        region: config.aws.region,
        account: config.aws.accountId,
      },
    }, config)

  }
}

main()