import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { ResultField } from '@aws-sdk/client-cloudwatch-logs'
import { Result, err, ok, Err } from 'neverthrow'
import * as dayjs from 'dayjs'

export interface QueryOptions {
  query: string,
  logGroupNames: string[],
  startTime: number,
  endTime?: number,
  limit?: number,
}

export async function query(context: IContext, options: QueryOptions): Promise<Result<Array<Array<ResultField>>, ErrCode>> {
  const { logger, aws: { cloudwatchlogs } } = context

  try {
    const now = Date.now() / 1000 | 0
    const query = options.query
    const startTime = options.startTime
    const endTime = options.endTime || Date.now() / 1000 | 0
    const limit = options.limit || 1000
    const logGroupNames = options.logGroupNames

    if (startTime === undefined) {
      return err(ErrCode.ARGUMENT_ERROR)
    }

    const { queryId } = await cloudwatchlogs.startQuery({
      logGroupNames,
      queryString: query,
      startTime,
      endTime,
      limit,
    })

    if (queryId === undefined) {
      return err(ErrCode.SERVICE)
    }

    const expires = Date.now() + 15 * 60 * 1000

    do {
      const { results, status } = await cloudwatchlogs.getQueryResults({
        queryId,
      })

      if (status === 'Scheduled' || status === 'Running') {
        await new Promise((resolve) => {
          setTimeout(resolve, 2*1000)
        })

        continue
      }

      if (status === 'Timeout') {
        return err(ErrCode.TIMEOUT)
      }

      if (status === 'Failed') {
        return err(ErrCode.SERVICE)
      }

      if (status === 'Cancelled') {
        return err(ErrCode.CANCELLED)
      }

      if (status === 'Complete') {
        if (results === undefined) {
          return err(ErrCode.SERVICE)
        }

        return ok(results)
      }

    } while (expires > Date.now())

    return err(ErrCode.TIMEOUT)
  } catch (e) {
    logger.exception(context, 'logs.query', e)
    return err(ErrCode.EXCEPTION)
  }
}

export interface QueryGroupTraceOptions {
  query: string,
  logGroupName: string,
  startTime: number,
  endTime?: number,
}

export async function queryGroupTrace(context: IContext, options: QueryGroupTraceOptions): Promise<Result<[any, string[], number][], ErrCode>> {
  const { logger } = context

  try {
    const params = {
      query: options.query,
      logGroupNames: [options.logGroupName],
      startTime: options.startTime,
      endTime: options.endTime
    }

    const result = await query(context, params)
  
    if (result.isErr()) {
      return err(result.error)
    }
  
    // only collect unique tag/message logs to reduce number
    const dedup: Record<string, any> = {}

    for (let rows of result.value) {
      const timestamp = rows.filter(row => row.field === '@timestamp').map(row => row.value)?.[0]
      const message = rows.filter(row => row.field === '@message').map(row => row.value)?.[0]

      if (timestamp === undefined || message === undefined) {
        continue
      }

      if (/^\{/.test(message) && /\}$/.test(message)) {
        try {
          const data = {...JSON.parse(message), '@timestamp': timestamp}
          const id = `${data.tag}|${data.message}`

          if (!(id in dedup)) {
            dedup[id] = []
          } 

          dedup[id].push(data.trace)
        } catch(e2) {
          logger.error(context, 'logs.queryGroupTrace', `failed to parse json log`, {message})
        }
      }
    }

    const ids = Object.values(dedup).reduce((acc, traces) => ({...acc, [traces[0]]: traces}), {})
    const traces: [any, string[], number][] = []

    for (let id of Object.keys(ids)) {
      const result = await query(context, {...params, query: `
        fields @timestamp, @message
        | filter trace = '${id}'
        | sort @timestamp desc
        | limit 100
      `})

      if (result.isErr()) {
        continue
      }

      const logs = result.value.map((rows) => {
        const timestamp = rows.filter(row => row.field === '@timestamp').map(row => row.value)?.[0]
        const message = rows.filter(row => row.field === '@message').map(row => row.value)?.[0]

        if (timestamp === undefined || message === undefined) {
          return undefined
        }

        if (/^\{/.test(message) && /\}$/.test(message)) {
          try {
            return {...JSON.parse(message), '@timestamp': dayjs(timestamp).toDate().getTime()}
          } catch(e2) {
            logger.error(context, 'logs.queryGroupTrace', `failed to parse json log`, {message})
          }
        }
      })
      .filter(message => !!message)

      const min = logs.reduce((acc, log) => {
        const ts = dayjs(log['@timestamp']).toDate().getTime()
        return ts < acc ? ts : acc
      }, Number.MAX_SAFE_INTEGER)

      logs.sort((a,b) => a['@timestamp'] < b['@timestamp'] ? -1 : a['@timestamp'] > b['@timestamp'] ? 1 : 0)

      traces.push([logs, ids[id], min])
    }

    traces.sort((a,b) => a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0)

    return ok(traces)
  } catch(e) {
    logger.exception(context, 'logs.queryGroupTrace', e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  query,
  queryGroupTrace,
}