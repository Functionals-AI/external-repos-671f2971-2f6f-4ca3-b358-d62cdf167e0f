import Config from '@mono/common/lib/config'
import Development from './development'
import Staging from './staging'
import Production from './production'

export interface ICdkConfig {
  name: string,
  env: string,
  backendVersion: string,
  awsAccountId: string,
  awsRegion: string,
  vpcId: string,
  subnetsInternal: {
    subnetId: string,
    availabilityZone: string,
    routeTableId: string,
  }[],
  subnetsRDS: {
    subnetId: string,
    availabilityZone: string,
    routeTableId: string,
  }[],
  secretsmanagerArn: string,
  dockerPassword: string,
}

function getConfig(): ICdkConfig {
  const env = Config.getEnvironment()

  if (env === 'staging') {
    return Staging
  }
  else if (env === 'production') {
    return Production
  }

    return Development
}

// TODO: Rewrite function to handle errors and pass strictnullchecks

// function getConfig(): Result<ICdkConfig, ErrCode> {
//   const env = Config.getEnvironment()

//   if (env === 'development') {
//     return ok(Development)
//   }
//   else if (env === 'staging') {
//     return ok(Staging)
//   }
//   else if (env === 'production') {
//     return ok(Production)
//   }

//   return err(ErrCode.NOT_FOUND)
// } 

export default {
  getConfig,
}