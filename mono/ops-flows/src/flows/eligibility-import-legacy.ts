import { Result } from 'neverthrow'
import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'

import { choice, succeed, fail, workflow, JsonObject } from '@mono/common-flows/lib/builder'
import { ECSTaskParams, invokeTask, waitForTaskToComplete } from '@mono/common-flows/lib/tasks/aws/ecs'
import { EventTypes, FlowCompletedEventDetail, publishEvent as publishEventTask } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import { ImportMode, InvokeDryRunTaskOutput, InvokeCommitTaskOutput, InvokeImportTaskOutput, createECSTaskLoggingOptions, createECSTaskParams, getAndPostImportTaskResults } from '../tasks/eligibility-import-legacy'

const DOMAIN = 'ops'
const FLOW_NAME = 'eligibility-import-legacy'
const FLOW_ID = 'eligibilityImportLegacy'
const MTAG = [ 'ops-flows', 'flows', FLOW_NAME ]

const CLUSTER = 'App'

enum State {
  DryRun = 'DryRun',
  WaitUntilDryRunComplete = 'WaitUntilDryRunComplete',
  ReadDryRunStatsAndPost = 'ReadDryRunStatsAndPost',
  ToCommitOrNot = 'ToCommitOrNot',
  Commit = 'Commit',
  WaitUntilCommitComplete = 'WaitUntilCommitComplete',
  ReadCommitStatsAndPost = 'ReadCommitStatsAndPost',
  ToFailOrNot = 'ToFailOrNot',
  PublishCompletedEvent = 'PublishCompletedEvent',
  Fail = 'Fail',
  Success = 'Success',
}

export interface EligibilityImportLog  {
  summary: string,
  import_date: Date | null,
  commit_status: string,
  id: number,
}

export default workflow(function(config) {
  const inputBucket = config.ops_cdk?.data?.destBuckets.eligibilityReady.name

  if (!inputBucket) {
    console.log('Input bucket is not in config.')

    return
  }

  const eligibilityConfig = config.ops.eligibility

  if (!eligibilityConfig) {
    console.log('Eligibility config not found.')

    return
  }

  const s3EventPattern = eligibilityConfig.imports.filter(imp => imp.active).map(imp => ({ "prefix": imp.s3Prefix }))

  return {
    event: {
      source: ['aws.s3'],
      detailType: ['Object Created'],
      detail: {
        bucket: {
          name: [inputBucket],
        },
        object: {
          key: s3EventPattern,
        }
      }
    },
    startAt: State.DryRun,
    states: {
      [State.DryRun]: invokeTask({
        ecsTaskLoggingOptions: function(context: IContext, input: JsonObject) {
          return createECSTaskLoggingOptions(context, input, FLOW_ID, 'DryRun')
        },
        ecsTaskParams: function (context: IContext, input: JsonObject) : Promise<Result<ECSTaskParams, ErrCode>> {
          return createECSTaskParams(context, input, ImportMode.DryRun)
        },
        output: function (output, input) {
          const details = input['detail']
          const s3Bucket = details['bucket']['name']
          const s3Key = details['object']['key']
          const s3Uri = `s3://${s3Bucket}/${s3Key}`
          const importConfig = eligibilityConfig.imports.find(imp => imp.active && s3Key.startsWith(imp.s3Prefix))
          const orgId = importConfig?.orgId
          const spec = importConfig?.spec
          const runParams = output?.runParams as any
          const containerOverrides = runParams?.overrides?.containerOverrides
          const command = Array.isArray(containerOverrides) && containerOverrides.length ? 
            containerOverrides[0].command || [] : []

          const taskOutput: InvokeImportTaskOutput = {
            ...(output.flowTaskLogId && { flowTaskLogId: output.flowTaskLogId as number}),
            ...(output.skipped !== undefined && { skipped: output.skipped as boolean, }),
            taskArn: output.taskArn as string, 
            command: command,
            orgId : orgId?.toString() ?? "error", 
            spec : spec?.toString() ?? "error",
            s3Bucket,
            s3Key,
            s3Uri,
          }

          const stateOutput: InvokeDryRunTaskOutput = {
            input,
            dry_run: taskOutput,
            ...taskOutput,
          }

          return stateOutput as any as JsonObject
        },
        next: State.WaitUntilDryRunComplete,
      }),
      [State.WaitUntilDryRunComplete]: waitForTaskToComplete({
        cluster: CLUSTER,
        output: function (output, input) {
          output = { ...input }

          return output
        },
        next: State.ReadDryRunStatsAndPost,
      }),
      [State.ReadDryRunStatsAndPost]: getAndPostImportTaskResults({
        mode: ImportMode.DryRun,
        next: State.ToCommitOrNot,
      }),
      [State.ToCommitOrNot]: choice({
        choices: [
          {
            variable: '$.acceptance_criteria_met',
            stringEquals: 'true',
            next: State.Commit,
          }
        ],
        default: State.Fail,
      }),
      [State.Commit]: invokeTask({
        input: function(input) {
          return {
            ...(input['input'] as JsonObject),
            ...input,
          }
        },
        ecsTaskLoggingOptions: function(context: IContext, input: JsonObject) {
          return createECSTaskLoggingOptions(context, input['input'] as JsonObject, FLOW_ID, 'Commit')
        },
        ecsTaskParams: function (context: IContext, input: JsonObject) : Promise<Result<ECSTaskParams, ErrCode>> {
          return createECSTaskParams(context, input['input'] as JsonObject, ImportMode.Commit)
        },
        output: function (output, input) {
          const stateMachineInput = input['input']
          const details = stateMachineInput['detail']
          const s3Bucket = details['bucket']['name']
          const s3Key = details['object']['key']
          const s3Uri = `s3://${s3Bucket}/${s3Key}`
          const importConfig = eligibilityConfig.imports.find(imp => imp.active && s3Key.startsWith(imp.s3Prefix))
          const orgId = importConfig?.orgId
          const spec = importConfig?.spec
          const runParams = output?.runParams as any
          const containerOverrides = runParams?.overrides?.containerOverrides
          const command = Array.isArray(containerOverrides) && containerOverrides.length ? 
            containerOverrides[0].command || [] : []

          const taskOutput: InvokeImportTaskOutput = {
            ...(output.flowTaskLogId && { flowTaskLogId: output.flowTaskLogId as number}),
            ...(output.skipped !== undefined && { skipped: output.skipped as boolean, }),
            taskArn: output.taskArn as string, 
            command: command,
            orgId : orgId?.toString() ?? "error", 
            spec : spec?.toString() ?? "error",
            s3Bucket,
            s3Key,
            s3Uri,
          }

          const stateOutput: InvokeCommitTaskOutput = {
            input: (input['input'] as any),
            dry_run: input['dry_run'] as any as InvokeImportTaskOutput,
            commit: taskOutput,
            ...taskOutput,
          }

          return stateOutput as any as JsonObject
        },
        next: State.WaitUntilCommitComplete,
      }),
      [State.WaitUntilCommitComplete]: waitForTaskToComplete({
        cluster: CLUSTER,
        output: function (output, input) {
          output = { ...input }

          return output
        },
        next: State.ReadCommitStatsAndPost,
      }),
      [State.ReadCommitStatsAndPost]: getAndPostImportTaskResults({
        mode: ImportMode.Commit,
        next: State.ToFailOrNot,
      }),
      [State.ToFailOrNot]: choice({
        choices: [
          {
            variable: '$.acceptance_criteria_met',
            stringEquals: 'true',
            next: State.PublishCompletedEvent,
          }
        ],
        default: State.Fail,
      }),
      [State.PublishCompletedEvent]: publishEventTask({
        eventDetail: function(context: IContext, input: JsonObject): FlowCompletedEventDetail {
          const { logger } = context

          let data
          let detail = input['input']['detail'] as JsonObject
          if (detail) {
            // Send the s3 details along with the event so they can also
            // handle the file as needed.
            data = {
              bucket: detail['bucket'],
              object: detail['object'],
            }
          } else {
            logger.error(context, MTAG, 'No detail found in input', input)
          }

          return {
            type: EventTypes.FlowCompleted,
            domain: DOMAIN,
            flowName: FLOW_NAME,

            data
          }
        },
        next: State.Success,
      }),
      [State.Success]: succeed(),
      [State.Fail]: fail(),
    }
  }
})
