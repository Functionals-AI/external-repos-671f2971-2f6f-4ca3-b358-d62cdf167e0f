import { Result, err, ok, } from 'neverthrow'

import { Context } from '@mono/common'
import { ErrCode } from '@mono/common/lib/error'
import { deployStack, fetchLogs, startBuild } from './aws'

const MTAG = [ 'ops', 'scripts', 'deploy', 'ops-flows' ]

async function main(): Promise<Result<void, ErrCode>> {
  const context = await Context.create()
  const { logger } = context
  const TAG = [ ...MTAG, 'main' ]

  try {

    let sourceVersion = 'master'

    if (process.argv.length === 3) {
      sourceVersion = process.argv[2]
    }

    const result = await startBuild(context, {
      projectName: 'ops-flows',
      sourceVersion,
    })

    if (result.isErr()) {
      console.log(`build error: ${result.error}`)

      return err(result.error)
    }
    const logResult = await fetchLogs(context, {
      groupName: result.value.groupName,
      streamName: result.value.streamName,
      filter: (message) => /^TAG_VERSION/.test(message),
    })

    if (logResult.isErr()) {
      logger.error(context, `main`, `error getting logs`)

      return err(ErrCode.SERVICE)
    }

    let logVersion = ''
    const logs = logResult.value

    if (logs.length === 1) {
      const message = logs[0]
      const match = message.match(/TAG_VERSION - (release-v\d+\.\d+-(?:hotfix-\d+-)?[a-f0-9]{8}|[a-f0-9]{8})/)

      if (match === null) {
        logger.error(context, `main`, `error getting tag version from logs`, { message })
        return err(ErrCode.SERVICE)
      }

      logVersion = match[1]
    }

    const updateResult = await deployStack(context, 'OpsFlows', [
      {
       ParameterKey: 'FlowsImageBuildTag',
        ParameterValue: logVersion,
      }, 
      {
        ParameterKey: 'BootstrapVersion',
        UsePreviousValue: true,
      }
    ])

    if (updateResult.isErr()) {
      logger.error(context, TAG, 'Deployment failed.')

      return err(updateResult.error)
    }

    logger.info(context, TAG, 'Deployment success.', {
      version: logVersion,
    })

    return ok(undefined)
  }
  catch(e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

main().then(result => {
  if (result.isErr()) {
    console.error('Deployment failed.')

    process.exit(1)
  }

  process.exit(0)
}).catch(e => {
  console.error('Exception during deployment.', e)

  process.exit(1)
})