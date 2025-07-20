import Devenv from './devenv'
import Development from './development'
import Staging from './staging'
import Production from './production'

import { Environment, IBaseConfig, getEnvironment } from '@mono/common/lib/config'
import { List } from 'aws-sdk/lib/model'

  
export interface ISecurityData {
  aws?: {
    region: string,
    accountId: string,
    secretsmanagerArn: string,
  }
}  

export interface IConfig extends IBaseConfig {
  security: {
    data?: Record<string, ISecurityData>,
  },
  security_cdk?: {
    crowdstrike?: {
      assumedBy: string,
      cloudwatch?: {
        externalId: string,
        loggroups: string[],
      },
      cloudtrail?: {
        externalId: string,
      },
    },
    sumologic?: {
      assumedBy: string,
      cloudwatch?: {
        externalId: string,
        loggroups: string[],
        snsurl: string,
      },
      cloudtrail?: {
        externalId: string,
      },
    }
  }
}

async function from(env?: Environment): Promise<IConfig> {
  if (env === undefined) {
    env = getEnvironment()
  }
  
  if (env === 'devenv') {
    const result = await Devenv.fetch()
  
    if (result.isErr()) {
      throw new Error(`Error fetching config for env: ${env}`)
    }
    
    return result.value
  
  } else if (env === 'development') {
    const result = await Development.fetch()
  
    if (result.isErr()) {
      throw new Error(`Error fetching config for env: ${env}`)
    }
  
    return result.value
  }
  else if (env === 'staging') {
    const result = await Staging.fetch()
  
    if (result.isErr()) {
      throw new Error(`Error fetching config for env: ${env}`)
    }
  
    return result.value
  }
  else if (env === 'production') {
    const result = await Production.fetch()

    if (result.isErr()) {
      throw new Error(`Error fetching config for env: ${env}`)
    }
  
    return result.value
  }
  
  throw new Error(`invalid value for env: ${env}`)
}

export default {
  from,
}
