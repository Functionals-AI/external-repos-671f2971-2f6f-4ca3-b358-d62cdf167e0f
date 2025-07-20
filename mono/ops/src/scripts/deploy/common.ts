import { Result, err, ok }  from  'neverthrow'

import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"

export function getTagVersionFromLogs(context: IContext, logs: string[]): Result<string, ErrCode> {
  const { logger } = context

  try {
    const message = logs.find(log => log.startsWith('TAG_VERSION - ' ))

    if (message === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    const match = message.match(/TAG_VERSION - (release-v\d+\.\d+-(?:hotfix-\d+-)?[a-f0-9]{8}|[a-f0-9]{8})/)

    if (match === null) {
      logger.error(context, `main`, `error getting tag version from logs`, { message })

      return err(ErrCode.NOT_FOUND)
    }

    return ok(match[1])
  }
  catch (e) {
    logger.exception(context, `common`, e)

    return err(ErrCode.EXCEPTION)
  }
}
