import { Result, err, ok, } from 'neverthrow'

import { Context } from '@mono/common'
import { ErrCode } from '@mono/common/lib/error'
import { deployStack, fetchLogs, startBuild } from './aws'
import { getTagVersionFromLogs } from './common'
import { migrateUp } from './migrate'

const MTAG = [ 'ops', 'scripts', 'deploy', 'ops-store' ]

function usage() {
  console.log(`USAGE: ts-node src/scripts/deploy/ops-store.ts [options] [<branch>]`)
  console.log('')
  console.log('Build ops store and migrate  schemas.')
  console.log('Specify -- between -s schemas and optional branch when specifying a branch.')

  console.log('OPTIONS:')
  console.log('-s | --schemas <schema1>  .. <schema N>  Schemas to migrate.')
  console.log('-m | --migrate-only                      Only run migrations, skip build / deploy')
  process.exit(1)
}

interface ParsedArgs {
  sourceVersion: string,
  migrateOnly: boolean,
  schemas: string[],
}

function parseArgs(): ParsedArgs {
  const processArgv = [ ...process.argv ]

  if (processArgv.length && processArgv[0].endsWith('bin.js')) {
    processArgv.shift()
  }

  if (processArgv.length && processArgv[0].endsWith('ops-store.ts')) {
    processArgv.shift()
  }

  let sourceVersion = 'master'
  const schemas: string[] = []

  let parsingSchemas = false 
  let migrateOnly = false
  let sourceVersionParsed = false
  let argNum = 0

  for (const arg of processArgv) {
    argNum++

    console.log(argNum, parsingSchemas, processArgv.length,  arg)
    if (arg === '-h' || arg === '--help') {
      usage()
    }
    else if (arg === '-s' || arg === '--schemas') {
      parsingSchemas = true
    }
    else if (parsingSchemas === true && arg === '--') {
      parsingSchemas = false
    }
    else if (arg === '-m' || arg === '--migrate-only') {
      migrateOnly = true
      parsingSchemas = false
    }
    else if (parsingSchemas === false && argNum === processArgv.length) {
      sourceVersion = arg
    }
    else if (parsingSchemas === true) {
      schemas.push(arg)
    }
    else if (argNum === processArgv.length) {
      sourceVersion = arg
      sourceVersionParsed = true
    }
    else {
      usage()
    }
  }

  if (schemas.length && sourceVersionParsed === false && migrateOnly === false) {
    console.warn('If specifying schemas and version, preceed version with --')
    console.warn('Deploying version: ', sourceVersion)
  }

  if (migrateOnly === true && schemas.length === 0) {
    console.error('No schemas specified.')
    usage()
  }

  return {
    sourceVersion,
    migrateOnly,
    schemas,
  }
}

async function main(): Promise<Result<void, ErrCode>> {
  const context = await Context.create()
  const { logger } = context
  const TAG = [ ...MTAG, 'main' ]

  try {
    const { sourceVersion, schemas,  migrateOnly } = parseArgs()

    console.log(sourceVersion, schemas, migrateOnly)

    if (migrateOnly === false) {
      const buildResuilt = await startBuild(context, {
        projectName: 'ops-store',
        sourceVersion,
      })

      if (buildResuilt.isErr()) {
        logger.error(context, TAG, 'Build error.', {
          error: buildResuilt.error,
        })
 
        return ok(undefined)
      }

      const {
        groupName,
        streamName,
      } = buildResuilt.value 

      const logResult = await fetchLogs(context, {
        groupName,
        streamName,
        filter: (message) => /^TAG_VERSION - /.test(message),
      })

      if (logResult.isErr()) {
        logger.error(context, `main`, `error getting logs`)

        return err(logResult.error)
      }

      const logs = logResult.value
      
      const getTagVersionResult = await getTagVersionFromLogs(context,  logs)

      if (getTagVersionResult.isErr()) {
        return err(ErrCode.SERVICE)
      }

      const matchedVersion = getTagVersionResult.value 

      const deployResult = await deployStack(context, 'OpsStore', [
        {
          ParameterKey: 'TaskImageBuildTag',
          ParameterValue: matchedVersion,
        }, {
          ParameterKey: 'BootstrapVersion',
          UsePreviousValue: true,
        }
      ])

      if (deployResult.isErr()) {
        logger.error(context, TAG, 'Error deploying stack.')

        return err(deployResult.error)
      }

      logger.info(context, TAG, 'Stack deployed.')
    }

    if (schemas.length) {
      logger.info(context, TAG, 'Running migrations.', {
        schemas,
      })

      for (const schema of schemas) {
        const migrateResult = await migrateUp(context, schema)

        if  (migrateResult.isErr()) {
          logger.error(context, TAG, 'Failed to migrate schema.', { schema, })

          return err(ErrCode.SERVICE)
        }
      }
    }
    return ok(undefined)
  }
  catch (e) {
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