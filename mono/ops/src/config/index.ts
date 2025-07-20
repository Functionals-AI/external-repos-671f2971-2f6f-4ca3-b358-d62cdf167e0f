import Devenv from './devenv'
import Development from './development'
import Staging from './staging'
import Production from './production'

import { Environment, IBaseConfig, ISFTPConfig, getEnvironment } from '@mono/common/lib/config'
import { OpsDataDestS3BucketType, OpsDataDestType, OpsDataSourceType } from './base'

export { OpsDataSourceType as OpsDataSourceType } from './base'
export { OpsDataDestType as OpsDataDestType } from './base'
export { OpsDataDestS3BucketType as OpsDataDestS3BucketType } from './base'

/**
 * PGP secrets.
 */
export interface IPGPConfig {
  privateKey: string,
  passphrase: string,
}

export interface IOpsDataExternalSFTPSource {
  type: OpsDataSourceType.EXTERNAL_SFTP,
  sftp: ISFTPConfig,
  remotePath: string,
  encrypted: boolean,
  isArmored?: boolean, // If encrypted, is it armored text.
}
  
export interface IOpsDataInternalSFTPSource {
  type: OpsDataSourceType.INTERNAL_SFTP,
  sftpArchivePrefix: string,
  encrypted: boolean,
  isArmored?: boolean, // If encrypted, is it armored text.
}

export interface IOpsDataExternalBucketSource {
  type: OpsDataSourceType.EXTERNAL_DATA_BUCKET,
  externalDataBucketPrefix: string,
  encrypted: boolean,
  isArmored?: boolean, // If encrypted, is it armored text.
}

export interface IOpsDataExternalSFTPDest {
  type: OpsDataDestType.EXTERNAL_SFTP,
  sftp?: ISFTPConfig,
  remotePath: string,
  encrypted: boolean,
}

export interface IOpsDataS3Dest {
  type: OpsDataDestType.INTERNAL_S3,
  s3BucketType: OpsDataDestS3BucketType,
  prefix?: string,
  // Matching logic: (IN filePrefixes AND IN fileSuffixes) OR IN fileRegexes
  filePrefixes?: string[], // Files matching a prefix, go to this destination.
  fileSuffixes?: string[], // Only files with matching suffixes, to to this destimation.
  // fileRegexes: Files with a matching a regular expression, go to this destination.
  // Note: A match on fileRegexes supercedes anything in filePrefixes & fileSuffixes. It
  // is assumed the regular expression will carry prefix and suffix matching.
  fileRegexes?: RegExp[],
}

export type IOpsDataInboundDest = IOpsDataS3Dest
export type IOpsDataInboundSource = IOpsDataExternalSFTPSource | IOpsDataInternalSFTPSource | IOpsDataExternalBucketSource

export type IOpsDataOutboundSource = IOpsDataExternalBucketSource
// Any type added to this union should define a corresponding type in the
// OpsDataDestType enum and have it present in the `type` field.
export type IOpsDataOutboundDest = IOpsDataExternalSFTPDest

export interface IOpsDataBase {
    aws?: {
    region: string,
    accountId: string,
    secretsmanagerArn: string,
  },
  pgp?: IPGPConfig,
  sftp?: ISFTPConfig,
}

export interface IOpsDataInbound {
  src: IOpsDataInboundSource,
  dest: IOpsDataInboundDest | IOpsDataInboundDest[],
}

export interface IOpsDataOutbound {
  src: IOpsDataOutboundSource,
  dest: IOpsDataOutboundDest | IOpsDataOutboundDest[],
}

export type IOpsDataInboundOnly = IOpsDataBase & IOpsDataInbound

export interface IOpsDataInboundOutbound extends IOpsDataBase {
  inbound?: IOpsDataInbound,
  outbound?: IOpsDataOutbound | IOpsDataOutbound[],
}

export interface IConfig extends IBaseConfig {
  ops: {
    data?: Record<string, IOpsDataInboundOnly | IOpsDataInboundOutbound>,
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
