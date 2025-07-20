import { err, ok, Result } from 'neverthrow'

import { resolveSecrets } from '@mono/common/lib/config'
import { ErrCode } from '@mono/common/lib/error'
import { IConfig } from '.'

const config: IConfig = {
  get isProduction() { return false },
  get isStaging() { return true },
  get isDevelopment() { return false },
  get isDevenv() { return false },
  env: 'staging',
  aws: {
    accountId: '288831299874',
    region: 'us-west-2',
    secretsmanagerArn: 'arn:aws:secretsmanager:us-west-2:288831299874:secret:mono/common-6e0utY'
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
