import { err, ok, Result } from 'neverthrow'

import { resolveSecrets } from '@mono/common/lib/config'
import { ErrCode } from '@mono/common/lib/error'
import { IConfig, ISecurityData } from '.'

const config: IConfig = {
  get isProduction() { return true },
  get isStaging() { return false },
  get isDevelopment() { return false },
  get isDevenv() { return false },
  env: 'production',
  aws: {
    region: 'us-west-2',
    accountId: '495477141215',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:495477141215:secret:mono/ops-jO1yrU',
  },
  security: {},
  security_cdk: {
    crowdstrike: {
      assumedBy: 'arn:aws:iam::292230061137:role/crowdstrike-3pi-us1-connectors',
      cloudwatch: {
        externalId: 'c1a83eee-26b8-419e-b646-b0129f32c72d',
        loggroups: [
          '/foodsmart/telenutrition-api',
          '/foodsmart/telenutrition-web',
        ],
      },
      cloudtrail: {
        externalId: '8990bc8b97d5406aa633c05ddd171a9f',
      }
    }
  }
}

async function fetch(): Promise<Result<IConfig, ErrCode>> {
  const result = await resolveSecrets(config)
    
  if (result.isErr()) {
    return err(ErrCode.SERVICE)
  }
    
  return ok(result.value)
}
    
export default {
  fetch,
}