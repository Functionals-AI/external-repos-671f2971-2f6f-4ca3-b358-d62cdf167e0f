import { Console } from 'node:console'
import { IntervalHistogram, monitorEventLoopDelay } from 'node:perf_hooks'
import { Result, err, ok } from 'neverthrow'

import { IContext } from '../context'
import { ErrCode } from '../error'

const MTAG = [ 'common', 'nodejs', 'perf' ]

const console = new Console({ 
  stdout: process.stdout, 
  stderr: process.stderr,
  inspectOptions: {
    depth: null
  }
});

/**
 * Log an interval histogram. Values converted from nano-seconds to milli-seconds.
 * 
 * @param TAG 
 * @param ih 
 */
function logIntervalHistogram(TAG: string, ih: IntervalHistogram) {
  const level = 'info'

  console.log(JSON.stringify({
    level,
    TAG, 
    ...{
      min: ih.min / (1000 * 1000), // in nano seconds, convert to milliseconds.
      max: ih.max / (1000 * 1000),
      mean: ih.mean / (1000 * 1000),
      stddev: ih.stddev / (1000 * 1000),
      p75: ih.percentile(75) / (1000 * 1000),
      p90: ih.percentile(90) / (1000 * 1000),
      p95: ih.percentile(95) / (1000 * 1000),
      p99: ih.percentile(99) / (1000 * 1000)
    }
  }))

  // console.log(ih)
}

const _EVENT_LOOP_DELAY_LOG_TAG = [ ...MTAG, 'event-loop-delay' ].join('.')

function logEventLoopDelaySamples(ih: IntervalHistogram, logInterval: number) {
  setTimeout(() => {
    logIntervalHistogram(_EVENT_LOOP_DELAY_LOG_TAG, ih)
    ih.reset()
    logEventLoopDelaySamples(ih, logInterval)
  }, logInterval)
}

const _DEFAULT_EVENT_LOOP_DELAY_RESOLUTION = 20
const _DEFAULT_EVENT_LOOP_DELAY_LOG_INTERVAL = 60 * 1000 // Log once ever minute.

/**
 * @typedef {Object} LogEventLoopDelayOptions - Options for logging NodeJS event loop delay.
 * @property {number} resolution - Sample rate in milliseconds. See perf_hooks.monitorEventLoopDelay options.
 * @property {number} logInterval - Log histogram data every logInterval milliseconds.
 */
export interface LogEventLoopDelayOptions {
  resolution?: number,
  logInterval?: number
}
export function logEventLoopDelay(options?: LogEventLoopDelayOptions): Result<void, ErrCode> {
  const TAG = [ ...MTAG, 'logEventLoopDelay' ]

  try {
    const resolution = options?.resolution ?? _DEFAULT_EVENT_LOOP_DELAY_RESOLUTION
    const logInterval = options?.logInterval ?? _DEFAULT_EVENT_LOOP_DELAY_LOG_INTERVAL

    const ih = monitorEventLoopDelay({ resolution, })

    ih.enable()

    logEventLoopDelaySamples(ih, logInterval)

    return ok(undefined)
  }
  catch (e) {
    console.error(TAG.join('.'), e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  logEventLoopDelay,
}