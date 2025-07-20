import { Result, err, ok, } from 'neverthrow'

import { Context } from '@mono/common'
import { ErrCode } from '@mono/common/lib/error'
import { deployStack, fetchLogs, StartBuildResult, startBuild } from './aws'

const MTAG = [ 'ops', 'scripts', 'deploy', 'telenutrition-app' ]

async function main(): Promise<Result<void, ErrCode>> {
  const context = await Context.create()
  const { logger } = context
  const TAG = [ ...MTAG, 'main' ]

  let sourceVersion = 'master'

  if (process.argv.length === 3) {
    sourceVersion = process.argv[2]
  }

  const [ 
    apiBuildResult,
    webBuildResult,
    flowsBuildResult
   ] = await Promise.all([
    startBuild(context, {
      projectName: 'telenutrition-api',
      sourceVersion,
    }),
    startBuild(context, {
      projectName: 'telenutrition-web',
      sourceVersion,
    }), 
    startBuild(context, {
      projectName: 'telenutrition-flows',
      sourceVersion,
    })
   ])

  interface BuildResult {
    build: string,
    result: Result<StartBuildResult, ErrCode>,
    version?: string,
    errorCode?: ErrCode,
    logResult?: Result<string[], ErrCode>,
    logErrorCode?: ErrCode,
  }

  const apiBuild: BuildResult = { build: 'telenutrition-api', result: apiBuildResult}
  const webBuild: BuildResult = { build: 'telenutrition-web', result: webBuildResult}
  const flowsBuild: BuildResult = { build: 'telenutrition-flows', result: flowsBuildResult}

  const buildResults: BuildResult[] = [ apiBuild, webBuild, flowsBuild ]

  for (let buildResult of buildResults) {
    const { build, result, } = buildResult

    if (result.isErr()) {
      logger.error(context, TAG, 'Build error.', {
        error: result.error,
        build,
      })

      buildResult.errorCode = result.error
    } else {
      const logResult = await fetchLogs(context, {
        groupName: result.value.groupName,
        streamName: result.value.streamName,
        filter: (message) => /^TAG_VERSION/.test(message),
      })

      buildResult.logResult = logResult

      if (logResult.isErr()) {
        logger.error(context, `main`, `error getting logs`)

        buildResult.logErrorCode = logResult.error
      }
      else {
        const logs = logResult.value

        if (logs.length === 1) {
          const message = logs[0]
          const match = message.match(/TAG_VERSION - (release-v\d+\.\d+-(?:hotfix-\d+-)?[a-f0-9]{8}|[a-f0-9]{8})/)

          if (match === null) {
            logger.error(context, `main`, `error getting tag version from logs`, { message })
          }
          else {
            buildResult.version = match[1]
          }
        }
      }
    }
  }

  if (buildResults.find(result => result.result.isErr() || result?.logResult?.isErr() || result.version === undefined)) {
    logger.error(context, TAG, `Errors performing builds.`, { buildResults, })

    return err(ErrCode.SERVICE)
  }

  const result1 = await deployStack(context, 'TelenutritionApp', [
    {
      ParameterKey: 'ApiImageBuildTag',
      ParameterValue: apiBuild.version as string, // We've determined its not undefined.
    }, 
    {
      ParameterKey: 'WebImageBuildTag',
      ParameterValue: webBuild.version as string,
    }, 
    {
      ParameterKey: 'BootstrapVersion',
      UsePreviousValue: true,
    }
  ])

  if (result1.isErr()) {
    logger.error(context, TAG, 'Error performing telenutrition app. deploy.')
  }
  else {
    logger.info(context, TAG, 'Telenutrition app. deployment successful!')
  }

  const result2 = await deployStack(context, 'TelenutritionFlows', [
    {
      ParameterKey: 'TelenutritionFlowsImageBuildTag',
      ParameterValue: flowsBuild.version as string,
    }, 
    {
      ParameterKey: 'BootstrapVersion',
      UsePreviousValue: true,
    }
  ])

  if (result2.isErr()) {
    logger.error(context, TAG, 'Error performing telenutrition flows deploy.')
  }
  else {
    logger.info(context, TAG, 'Telenutrition app. deployment successful!')
  }

  if (result1.isErr() || result2.isErr()) {
    return err(ErrCode.SERVICE)
  }
  return ok(undefined)
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