/**
 * Base types.
 * 
 * Note, circuilar requires cause undefines.
 */
import { err, ok, Result } from 'neverthrow'

import { IBaseConfig, resolveSecrets } from '@mono/common/lib/config'
import { ErrCode } from '@mono/common/lib/error'
import { IConfig, IOpsDataInboundOnly, IOpsDataInboundOutbound } from './'

type IOpsData = IOpsDataInboundOnly | IOpsDataInboundOutbound

export interface ClientDataConfig {
  client: string,
  secretsmanagerArn?: string, // Optional, as in some cases there are no secrets.
  data: IOpsData
}

export enum OpsDataSourceType {
  EXTERNAL_SFTP = "EXTERNAL_SFTP",
  INTERNAL_SFTP = "INTERNAL_SFTP",
  EXTERNAL_DATA_BUCKET = "EXTERNAL_DATA_BUCKET",
}

export enum OpsDataDestS3BucketType {
  EXTERNAL_DATA_BUCKET = "EXTERNAL_DATA_BUCKET",
  ELIGIBILITY_READY_BUCKET = "ELIGIBILITY_READY_BUCKET",
}

export enum OpsDataDestType {
  INTERNAL_S3 = "INTERNAL_S3",
  EXTERNAL_SFTP = "EXTERNAL_SFTP",
}

export function fetch(config: IConfig, clientDataConfigs: ClientDataConfig[]) {

  async function fetcher(): Promise<Result<IConfig, ErrCode>> {
    const result = await resolveSecrets(config)

    if (result.isErr()) {
      return err(ErrCode.SERVICE)
    }

    const resolvedConfig = result.value

    if (resolvedConfig.ops.data === undefined) {
      resolvedConfig.ops.data = {}
    }

    //
    // Resolve secrets for each of the client configs.
    //
    for (const clientDataConfig of clientDataConfigs) {
      let clientConfig: IConfig

      if (clientDataConfig.secretsmanagerArn) {
        const clientResolvedConfigResult = await resolveSecrets({
          get isProduction() { return config.isProduction },
          get isStaging() { return config.isStaging },
          get isDevelopment() { return config.isDevelopment },
          get isDevenv() { return config.isDevenv },
          env: config.env,
          aws: {
            region: 'us-west-2',
            accountId: config.aws.accountId,
            secretsmanagerArn: clientDataConfig.secretsmanagerArn,
          },
          ops: {
            data: {
              [clientDataConfig.client]: clientDataConfig.data,
            }
          }
        })

        if (clientResolvedConfigResult.isErr()) {
          return err(ErrCode.SERVICE)
        }

        clientConfig = clientResolvedConfigResult.value
      }
      else {
        clientConfig = {
          get isProduction() { return config.isProduction },
          get isStaging() { return config.isStaging },
          get isDevelopment() { return config.isDevelopment },
          get isDevenv() { return config.isDevenv },
          env: config.env,
          aws: {
            region: 'us-west-2',
            accountId: config.aws.accountId,
            secretsmanagerArn: config.aws.secretsmanagerArn
          },
          ops: {
            data: {
              [clientDataConfig.client]: clientDataConfig.data,
            }
          }
        }
      }

      resolvedConfig.ops.data[clientDataConfig.client] = {
          aws: clientConfig.aws,
          ...(clientConfig.ops.data as IOpsData)[clientDataConfig.client]
      }
    }

    // For any SFTP destinations resolve the SFTP to the defaultSFTP if it's not
    // present for the specific destination. This means we we only need to
    // check if dest.sftp is present at actual runtime.
    for(const key in resolvedConfig.ops.data) {
      const dataBase = resolvedConfig.ops.data[key]

      if (dataBase.hasOwnProperty('outbound')) {
        const data = dataBase as IOpsDataInboundOutbound
        if (data.outbound) {
          const destinations = Array.isArray(data.outbound) ? data.outbound : [data.outbound]
          for (const destination of destinations) {
            const dests = Array.isArray(destination.dest) ? destination.dest : [destination.dest]
  
            for (const dest of dests) {
              if (dest.type === OpsDataDestType.EXTERNAL_SFTP) {
                dest.sftp = dest.sftp ?? data.sftp
              }
            }
          }
        }
      }
    }

    return ok(resolvedConfig)
  }

  return fetcher 
}
