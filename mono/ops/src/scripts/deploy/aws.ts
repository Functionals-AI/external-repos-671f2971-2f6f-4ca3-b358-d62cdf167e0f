import { Result,  err, ok } from 'neverthrow'
import { CodeBuild } from 'aws-sdk'
import { DescribeTasksCommand, Container } from '@aws-sdk/client-ecs'
import { GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'

const MTAG = [ 'ops', 'scripts', 'deploy', 'aws' ]

async function sleep(ms) {
  return new Promise<void>(resolve => setTimeout(() => resolve(), ms))
}

// Extended type for ECS container with log configuration
export interface ECSContainer extends Container {
  logConfiguration?: {
    logDriver: string;
    options?: {
      [key: string]: string;
    };
  };
}

export interface WaitForTaskResult {
  status: string,
  exitCode: any,
}

export async function waitForTask(context: IContext, id: string, containerName: string, cluster: string): Promise<Result<WaitForTaskResult, ErrCode>> {
  const { aws: { ecsClient, }, logger } = context
  const TAG = [ ...MTAG, 'waitForTask' ]

  try {
    let status;
    let exitCode;

    logger.info(context, TAG, '⏳ Waiting for task completion...')

    while (!status || status !== 'STOPPED') {
      const { tasks } = await ecsClient.send(new DescribeTasksCommand({ 
        tasks: [id], 
        cluster 
      }))
    
      status = ''

      if (tasks !== undefined && tasks.length === 1) {
        const task = tasks[0]

        status = task.lastStatus
    
        if (status === 'STOPPED') {
          const container = task.containers?.find(c => c.name === containerName) as ECSContainer;

          exitCode = container.exitCode;
        }

        logger.info(context, TAG, `  Status: ${status}`)

      }
      else {
        logger.error(context, TAG, 'Unable  to get atsk status.', {
          id,
          containerName,
          cluster,
        })
      }

      if (status !== 'STOPPED') {
        await sleep(5000);
      }
    }

    return ok({ status, exitCode })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface StartBuildOptions {
  projectName: string,
  sourceVersion?: string,
}

export interface StartBuildResult {
  groupName: string,
  streamName: string,
}

export async function startBuild(context: IContext, options: StartBuildOptions): Promise<Result<StartBuildResult, ErrCode>> {
  const { config, logger } = context

  options.sourceVersion ??= 'master'

  try {
    const codebuild = new CodeBuild({ region: config.aws.region })

    const { build } = await codebuild.startBuild({
      projectName: options.projectName,
      ...(options.sourceVersion && { sourceVersion: options.sourceVersion }),
    }).promise()

    if (build === undefined) {
      return err(ErrCode.SERVICE)
    }

    const id = build.id

    if (id === undefined) {
      return err(ErrCode.SERVICE)
    }

    logger.info(context, `buildProject`, `Build started`, { projectName: options.projectName })

    const started = Date.now()
    const timeout = 15 * 60 * 1000

    do {
      const { builds } = await codebuild.batchGetBuilds({ ids: [id] }).promise()

      if (builds === undefined) {
        return err(ErrCode.SERVICE)
      }

      const build = builds[0]

      if (build === undefined) {
        return err(ErrCode.SERVICE)
      }

      if (build.buildStatus === undefined) {
        return err(ErrCode.SERVICE)
      }

      logger.info(context, `buildProject`, `Build status`, { status: build.buildStatus, projectName: build.projectName })

      if (['FAILED', 'FAULT',].includes(build.buildStatus)) {
        logger.error(context, `buildProject`, `build failed or fault`)
        return err(ErrCode.SERVICE)
      }

      if (['STOPPED'].includes(build.buildStatus)) {
        logger.error(context, `buildProject`, `build stopped`)
        return err(ErrCode.SERVICE)
      }

      if ('TIMED_OUT'.includes(build.buildStatus)) {
        logger.error(context, `buildProject`, `build timed out`)
        return err(ErrCode.TIMEOUT)
      }


      if (['SUCCEEDED'].includes(build.buildStatus)) {
        console.log(JSON.stringify(build.logs))

        if (build.logs === undefined || build.logs.groupName === undefined || build.logs.streamName === undefined) {
          logger.error(context, `buildProject`, `logs undefined`)
          return err(ErrCode.SERVICE)
        }

        return ok({
          groupName: build.logs.groupName,
          streamName: build.logs.streamName,
        })
      }

      if (['IN_PROGRESS'].includes(build.buildStatus)) {
        await new Promise((resolve) => setTimeout(resolve, 15 * 1000))
      }
    } while (Date.now() < started + timeout)


    logger.info(context, `buildProject`, `Build exceeded 15 minutes`)
    return err(ErrCode.TIMEOUT)

  } catch (e) {
    logger.exception(context, `buildProject`, e)
    return err(ErrCode.EXCEPTION)
  }
}

export interface FetchLogsOptions {
  groupName: string,
  streamName: string,
  filter?: (event: string) => boolean
}

export async function fetchLogs(context: IContext, options: FetchLogsOptions): Promise<Result<string[], ErrCode>> {
  const { aws: { cwLogsClient, }, logger } = context

  try {
    const { events } = await cwLogsClient.send( new GetLogEventsCommand({
      logGroupName: options.groupName,
      logStreamName: options.streamName,
    }))

    if (events === undefined) {
      logger.error(context, `deploy.fetchLogs`, `events is undefined`)
      return err(ErrCode.SERVICE)
    }

    const messages = events.map(event => event.message || '')

    if (options.filter !== undefined) {
      const filterFn = options.filter
      const filtered = messages.filter((message) => filterFn(message))

      return ok(filtered)
    }

    return ok(messages)
  } catch (e) {
    logger.exception(context, `fetchLogs`, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface WaitForChangesetResult {
  status: any,
  reason: any,
}

async function waitForChangeset(context: IContext, changeSetId: string, check: (status: string) => boolean): Promise<Result<WaitForChangesetResult, ErrCode>> {
  const { aws: { cloudformation }, logger } = context
  const TAG = [ ...MTAG, 'waitForChangeset' ]

  try {
    let status, reason

    logger.info(context, TAG, '⏳ Waiting for changeset...', { changeSetId, })

    while (!check(status)) {
      const response = await cloudformation.describeChangeSet({ ChangeSetName: changeSetId })

      status = response.Status
      reason = response.StatusReason

      logger.info(context, TAG, 'Status',  { status, })

      if (!check(status)) {
        await sleep(5000)
      }
    }

    return ok({ status, reason })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

async function waitForStack(context: IContext, stackName: string, check): Promise<Result<any, ErrCode>> {
  const { aws: { cloudformation }, logger } = context
  const TAG = [ ...MTAG, 'waitForStack' ]

  try {
    let status

    logger.info(context, TAG, '⏳ Waiting for stack update...',  { stackName })

    while (!check(status)) {
      const response = await cloudformation.describeStacks({ StackName: stackName })

      if (response.Stacks === undefined) {
        logger.error(context, TAG, 'Failed to  describe stacks.', {
          response,
        })

        return err(ErrCode.SERVICE)
      }
      const stack = response.Stacks[0]

      status = stack.StackStatus

      logger.info(context, TAG, 'Status', { status, })

      if (!check(status)) {
        await sleep(5000)
      }
    }

    return ok({ status })
  }
  catch (e) {
    logger.exception(context, TAG, e) 

    return err(ErrCode.EXCEPTION)
  }
}

export interface DeployStackResult {
  changeSetName: string,
  changeSetId: string,
}

type StackParameterValue = { ParameterValue: string } | { UsePreviousValue: true }

export type StackParameter = {
  ParameterKey: string,
} & StackParameterValue

export async function deployStack(context: IContext, stackName: string, params: StackParameter[]): Promise<Result<DeployStackResult, ErrCode>> {
  const { aws: { cloudformation }, logger } = context
  const TAG = [ ...MTAG, 'deployStack' ]

  try {
    const changeSetName = `cs-${Date.now()}`

    logger.info(context, TAG, `Deploying CloudFormation Stack`, {
      stackName,
      params,
      changeSetName,
    })

    const { Id: changeSetId } = await cloudformation.createChangeSet({
      ChangeSetType: 'UPDATE',
      ChangeSetName: changeSetName,
      StackName: stackName,
      UsePreviousTemplate: true,
      Parameters: params,
      Capabilities: ['CAPABILITY_NAMED_IAM']
    })

    if (changeSetId === undefined) {
      logger.error(context, TAG, 'Failed to create changeset.')

      return err(ErrCode.SERVICE)
    }

    const waitForChangesetResult = await waitForChangeset(context, changeSetId, (status) => /FAILED|COMPLETE$/.test(status))

    if (waitForChangesetResult.isErr()) {
      logger.error(context, TAG, 'Errolr waiting  for changeset.', {
        stackName,
        params,
        changeSetName,
        changeSetId,
        error: waitForChangesetResult.error,
      })

      return err(waitForChangesetResult.error)
    }
    const { status, reason } = waitForChangesetResult.value

    if (status === 'FAILED') {
      logger.error(context, TAG, 'Changeset failed.', {
        stackName,
        changeSetId,
        status,
        reason,
      })

      return err(ErrCode.SERVICE)
    }

    logger.info(context, TAG, `Executing change set.`, {
      stackName,
      params,
      changeSetName,
      changeSetId,
    })


    await cloudformation.executeChangeSet({
      ChangeSetName: changeSetId,
    })

    const waitForStackResult = await waitForStack(context, stackName, (status) => /FAILED|COMPLETE$/.test(status))

    if (waitForStackResult.isErr()) {
      logger.error(context, TAG, 'Errolr waiting  for stack.', {
        stackName,
        params,
        changeSetName,
        changeSetId,
        error: waitForStackResult.error,
      })

      return err(waitForStackResult.error)

    }
    const { status: statusExecute } = waitForStackResult.value

    if (statusExecute !== 'UPDATE_COMPLETE') {
      logger.error(context, TAG, 'Stack updated did not complete.', {
        stackName,
        params,
        changeSetName,
        changeSetId,
        statusExecute,
      })

      return err(ErrCode.SERVICE)
    }

    logger.info(context, TAG, `Stack deployment completed with status: ${statusExecute}`, {
      stackName,
      params,
      changeSetName,
      changeSetId,
      statusExecute,
    })

    return ok({
      changeSetName,
      changeSetId,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}
