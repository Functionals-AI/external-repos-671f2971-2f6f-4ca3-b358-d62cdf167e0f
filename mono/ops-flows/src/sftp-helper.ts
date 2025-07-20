import { err, ok, Result } from 'neverthrow'

import { SFTPConfig } from '@mono/common-flows/lib/tasks/sftp'
import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import {
  IConfig as IDomainConfig,
  IOpsDataInboundOnly,
  IOpsDataInboundOutbound,
  IOpsDataInboundSource,
  OpsDataSourceType,
} from '@mono/ops/lib/config'

export function sftpGetConfig(source: string): (context: IContext) => Promise<Result<SFTPConfig, ErrCode>> {
  return async (context: IContext): Promise<Result<SFTPConfig, ErrCode>> => {
    const { logger } = context
    const domainConfig = context.domainConfig as IDomainConfig
    const TAG = ['ops-flows', 'flows', 'sftp-helper', 'sftpGetConfig']

    try {
      const opsDataBase = domainConfig.ops?.data && domainConfig.ops.data[source]
      let srcConfig: IOpsDataInboundSource | undefined
      if (!opsDataBase) {
        logger.error(context, TAG, 'source config not found.', { source })

        return err(ErrCode.INVALID_CONFIG)
      } else if (opsDataBase.hasOwnProperty('inbound') === true) {
        const opsData = opsDataBase as IOpsDataInboundOutbound

        srcConfig = opsData.inbound?.src
      } else {
        const opsData = opsDataBase as IOpsDataInboundOnly

        srcConfig = opsData?.src
      }

      srcConfig = srcConfig?.type === OpsDataSourceType.EXTERNAL_SFTP ? srcConfig : undefined

      if (srcConfig) {
        return ok({
          connectionConfig: srcConfig.sftp,
          remotePath: srcConfig.remotePath,
        })
      } else {
        logger.error(context, TAG, 'SFTP config not found.')

        return err(ErrCode.INVALID_CONFIG)
      }
    } catch (e) {
      logger.exception(context, TAG, e)

      return err(ErrCode.EXCEPTION)
    }
  }
}

export default {
  sftpGetConfig,
}
