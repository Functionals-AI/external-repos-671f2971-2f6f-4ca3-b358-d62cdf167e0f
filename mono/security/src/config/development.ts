import { err, ok, Result } from 'neverthrow'

import { resolveSecrets } from '@mono/common/lib/config'
import { ErrCode } from '@mono/common/lib/error'
import { IConfig } from '.'

const config: IConfig = {
  get isProduction() { return false },
  get isStaging() { return false },
  get isDevelopment() { return true },
  get isDevenv() { return false },
  env: 'development',
  aws: {
    region: 'us-west-2',
    accountId: '914374131125',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/common-HZIXmP'
  },
  security: {}
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
  