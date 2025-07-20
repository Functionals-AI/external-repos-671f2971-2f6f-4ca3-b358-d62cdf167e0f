import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { Err, err, ok, Result } from 'neverthrow'
import { ErrCode } from '../error'
import * as _ from 'lodash'
import { IBaseConfig } from './index'

const SM_PREFIX = 'sm::'
const BASE64_PREFIX = 'base64::'

// cache the client to avoid making provider credential calls and hitting ratelimit
// context is created after the config and can not be used to cache the client
let _client: SecretsManagerClient | undefined

export async function resolveSecrets<IConfigType extends IBaseConfig>(config: IConfigType): Promise<Result<IConfigType, ErrCode>> {
  try {
    if (_client === undefined) {
      _client = new SecretsManagerClient({ region: config.aws.region as string })
    }

    const response = await _client.send(new GetSecretValueCommand({SecretId: config.aws.secretsmanagerArn}))
  
    if (response.SecretString === undefined) {
      return err(ErrCode.NOT_FOUND)
    }
  
    const secrets = JSON.parse(response.SecretString)
    const transformed = traverse(secrets, _.cloneDeep(config))
  
    return ok(transformed)  
  } catch(e) {
    console.log({level: 'error', message: e.message, e})
    return err(ErrCode.EXCEPTION)
  }
}

function traverse(secrets, node) {
  if (_.isString(node) && node.startsWith(SM_PREFIX)) {
    let key = node.substring(SM_PREFIX.length)

    let isBase64 = false

    if (key.startsWith(BASE64_PREFIX)) {
      key = key.substr(BASE64_PREFIX.length)
      isBase64 = true
    }

    if (!(key in secrets)) {
      throw new Err(`Config value ${node} not found in secrets`)
    }

    let value = secrets[key]

    if (isBase64) {
      value = Buffer.from(value, 'base64').toString('ascii')
    }

    return value
  } else if (_.isArray(node)) {
    return node.map(child => traverse(secrets, child))
  } else if (_.isObject(node) && !_.isRegExp(node)) {
    return Object.entries(node).reduce((transform, [key, value]) => {
      transform[key] = traverse(secrets, value)
      return transform
    }, {})

  }

  return node
}

export default {
  resolveSecrets,
}