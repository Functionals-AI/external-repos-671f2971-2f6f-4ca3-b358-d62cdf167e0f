import { ok, Result } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IConfig } from '.'

const config: IConfig = {
  get isProduction() { return false },
  get isStaging() { return false },
  get isDevelopment() { return false },
  get isDevenv() { return true },
  env: 'devenv',
  aws: {
    region: 'us-west-2',
    accountId: '914374131125',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/common-HZIXmP'
  },
  security: {}
}

async function fetch(): Promise<Result<IConfig, ErrCode>> {
  return ok(config)
}
    
export default {
  fetch,
}