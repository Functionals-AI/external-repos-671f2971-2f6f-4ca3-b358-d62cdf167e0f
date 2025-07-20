import { err, ok, Result } from 'neverthrow'
import * as _ from 'lodash'
import {format} from 'date-fns'

import Sync from '@mono/common/lib/sync2'
import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { Logger } from '@mono/common'

import Flow from '../scheduling/scheduling-flow'
import { FlowRecord } from '../scheduling/scheduling-flow/types'

const MTAG = Logger.tag()


export async function fetchSchedulingFlowsCompleted(context: IContext): Promise<Result<FlowRecord[], ErrCode>> {
  const TAG = [...MTAG, 'fetchSchedulingFlowsCompleted']
  const {logger} = context

  try {

    const flowsResult = await Flow.Service.queryFlowsComplete(context)

    if (flowsResult.isErr()) {
      return err(flowsResult.error)
    }

    const flows = flowsResult.value

    if (flows.length == 0) {
      return ok([])
    }

    return ok(flows)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  fetchSchedulingFlowsCompleted,
}