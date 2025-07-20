import { createHash } from 'node:crypto'
import { ok, err, Result } from "neverthrow"
import { format } from 'date-fns'
import { PublishCommand } from '@aws-sdk/client-sns'

import { IContext } from "@mono/common/lib/context"
import { ErrCode } from "@mono/common/lib/error"
import { CommitStatus, ImportSummary, selectImportSummary } from '@mono/common/lib/eligibility/store'
import { JsonObject, task, TaskBuilder } from "@mono/common-flows/lib/builder"
import { ECSTaskParams, ECSTaskLoggingOptions } from '@mono/common-flows/lib/tasks/aws/ecs'
import { getFlowTaskLogRecord, updateFlowTaskLogRecord } from '@mono/common-flows/lib/logging'
import { doesImportSatisfyAcceptanceCriteria } from '@mono/ops/lib/eligibility/legacy'

const MTAG = [ 'ops-flows', 'tasks', 'eligibility-import-legacy' ]

/**
 * Helper to generate task logging options.
 * 
 * @param context 
 * @param input 
 * @returns 
 */
export function createECSTaskLoggingOptions(context: IContext, input: JsonObject, flowId: string, taskId: string): ECSTaskLoggingOptions {
  const { config } = context
  const details = input['detail'] as object
  const s3Key = details['object']['key']
  const eligibilityConfig = config.ops?.eligibility

  let inputId: string = 'unknown'

  if (eligibilityConfig) {
    const importConfig = eligibilityConfig.imports.find(imp => imp.active && s3Key.startsWith(imp.s3Prefix))

    if (importConfig) {
      inputId = importConfig.spec
    }
  }

  //
  // Compute hash of input detail relevevant to the object.
  //
  //   - object.bucket
  //   - object.key
  //   - object.size
  //
  // Exclude object.etag as if it changes regardless of the object content on S3.
  //
  // {
  //   "version": "0",
  //   "id": "9b762fbb-498a-fa96-f76e-2720e97c1397",
  //   "detail-type": "Object Created",
  //   "source": "aws.s3",
  //   "account": "495477141215",
  //   "time": "2024-06-19T04:52:12Z",
  //   "region": "us-west-2",
  //   "resources": [
  //     "arn:aws:s3:::zipongo-prod-eligibility-ready-us-west-2"
  //   ],
  //   "detail": {
  //     "version": "0",
  //     "bucket": {
  //       "name": "zipongo-prod-eligibility-ready-us-west-2"
  //     },
  //     "object": {
  //       "key": "elevance/FoodSmart_Eligibility_20240617.csv",
  //       "size": 68446395,
  //       "etag": "0324000b4669ed976851c7033b930638-2",
  //       "sequencer": "00667263F5E429BC4F"
  //     },
  //     "request-id": "9HQDX4V2667G2WWX",
  //     "requester": "495477141215",
  //     "source-ip-address": "76.253.13.200",
  //     "reason": "CompleteMultipartUpload"
  //   }
  //
  const hash = createHash('md5')

  hash.update(JSON.stringify({
    bucket: details['bucket']['name'],
    key: s3Key,
    size: details['object']['size']
  }))

  const inputHash = hash.digest('hex')

  return {
    flowId: flowId,
    taskId: taskId,
    inputId,
    input,            
    inputHash,
    waitOn: new Set([ "flowId", "taskId", "inputId", "status" ]),
    skipOn: new Set([ "flowId", "taskId", "inputId", "inputHash", "status" ])
  }
}

const CLUSTER = 'App'
const CONTAINER_NAME = 'AppScripts'
const STACK_NAME = 'app'
const LOGICAL_RESOURCE_ID = 'ECSScriptsTask'

export enum ImportMode {
  DryRun = 'DryRun',
  Commit = 'Commit',
}

/**
 * Helper to create ECS Task invokation parameters.
 * 
 * @param context 
 * @param input 
 * @returns 
 */
export async function createECSTaskParams(context: IContext, input: JsonObject, mode: ImportMode) : Promise<Result<ECSTaskParams, ErrCode>> {
  const {
    aws: { 
      ecs, 
      cloudformation 
    }, 
    logger, 
    config
  } = context

  const TAG = [...MTAG, 'createRunTaskParams']

  try {
    const details = input['detail']
    const s3Key = details['object']['key']
    const s3Bucket = details['bucket']['name']

    const DEFAULT_VPC = config.common_cdk.vpcs.default
    const SUBNETS = DEFAULT_VPC?.subnets?.internal?.map(s => s.subnetId)
    const SECURITY_GROUPS = DEFAULT_VPC ? DEFAULT_VPC.securityGroups : null
    const SECURITY_GROUP = SECURITY_GROUPS ? SECURITY_GROUPS.admin_api : null
    
    logger.info(context, TAG, `subnets - ${SUBNETS ? SUBNETS.concat() : null }`)
    logger.info(context, TAG, `security group - ${SECURITY_GROUP ? SECURITY_GROUP.id : null}`)
    
    if (!(SUBNETS instanceof Array) || !SUBNETS.length) {
      logger.error(context, TAG, `Internal subnets are not specified`)
    
      return err(ErrCode.SERVICE)
    }
    
    if (!SECURITY_GROUP) {
      logger.error(context, TAG, `Required security not available.`)
    
      return err(ErrCode.SERVICE)
    }
        
    //
    // we need to retrieve the correct taskDefinition ID to pass to ecs.runTask
    // we do it by describing the app cloudformation
    //
    const describeStackResourceParams = {
      StackName: STACK_NAME,
      LogicalResourceId: LOGICAL_RESOURCE_ID
    }
    
    let describeStackResourceResponse
    
    try {
      logger.info(context, TAG, `describing stack resource for stack - ${STACK_NAME}`)
      describeStackResourceResponse = await cloudformation.describeStackResource(describeStackResourceParams)
   
      logger.info(context, TAG, `finished describing stack resource, response is - ${describeStackResourceResponse}`)
    } catch (e) {
      logger.exception(context, TAG, e)

      return err(ErrCode.EXCEPTION)
    }
    
    const taskDefinitionArn: string = describeStackResourceResponse['StackResourceDetail']['PhysicalResourceId']
    const eligibilityConfig = config.ops?.eligibility
    
    if (!eligibilityConfig) {
      logger.error(context, TAG, 'Eligibility config not available.', config.ops)
    
      return err(ErrCode.INVALID_CONFIG)
    }
    
    const importConfig = eligibilityConfig.imports.find(imp => imp.active && s3Key.startsWith(imp.s3Prefix))
    
    if (!importConfig) {
      logger.error(context, TAG, 'import config not found.', {
        s3Key,
        eligibilityConfig
      })
    
      return err(ErrCode.INVALID_CONFIG)
    }

    logger.debug(context, TAG, 'Import config: ', importConfig)
    
    let efileDateYYYYMMDD = format(new Date(), `yyyyMMdd`)
    let efileDateMMDDYYYY = format(new Date(), 'MM/dd/yyyy')
    
    const { 
      nameRegex,
      nameYearMatch,
      nameMonthMatch,
      nameDayMatch,
    } = importConfig
    
    if (nameRegex && nameYearMatch && nameMonthMatch && nameDayMatch) {
      const file = s3Key.split('/').pop()
    
      if (file) {
        const matches = file.match(nameRegex)

        if (matches && matches.length === 4) {
          const year = matches[nameYearMatch]
          const month = matches[nameMonthMatch]
          const day = matches[nameDayMatch]
    
          efileDateYYYYMMDD = `${year}${month}${day}`
          efileDateMMDDYYYY = `${month}/${day}/${year}`
        }
        else {
          logger.warn(context, TAG, 'Failed to match file params.', {
            s3Key,
            file,
            importConfig,
            matches,
          })
        }
      }
    }
    else {
      logger.warn(context, TAG, 'Name match config params not found!', importConfig)
    }
    
    const outputPathBucket = config.ops_cdk.ecs?.taskBucketName
    const extraParams: string[] = []

    if (mode === ImportMode.Commit) {
      extraParams.push("--commit")
    }
        
    if (importConfig.accountId) {
      extraParams.push("--account_id", `${importConfig.accountId}`)
    }
    
    if (importConfig.subOrgId) {
      extraParams.push('--suborganization_id', importConfig.subOrgId)
    }
    
    const runTaskParams: ECSTaskParams = {
      taskDefinition: taskDefinitionArn,
      cluster: CLUSTER,
      launchType: "FARGATE",
      //count: 1,
      overrides: {
        containerOverrides: [
          {
            command: [ "node", "./scripts/eligibility/import-eligibility.es6", 
              "--file", `s3://${s3Bucket}/${s3Key}`, 
              "--addons", "/dev/null",
              "--spec", `${importConfig.spec}`,
              "--organization_id", `${importConfig.orgId}`,
              "--file_date", `${efileDateMMDDYYYY}`,
              "--outputs_path", `s3://${outputPathBucket}/eligibility/eligibility-import/${importConfig.spec}_${efileDateYYYYMMDD}/`,
              ...extraParams,
            ],
            name: CONTAINER_NAME,
          }
        ]
      },
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: SUBNETS,
          securityGroups: [
            SECURITY_GROUP.id
          ],
          assignPublicIp: "DISABLED",
        }
      },
    }

    logger.debug(context, TAG, 'run task params: ', runTaskParams)
    
    return ok(runTaskParams)
  } catch (e) {
    logger.exception(context, MTAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

/**
 * @typedef InvokeImportTaskOutput - Expected output from invoking the importer ECS task.
 */
export interface InvokeImportTaskOutput {
  flowTaskLogId?: number,
  skipped?: boolean,
  taskArn: string,
  command: string[],
  orgId : string | number,
  spec : string,
  s3Bucket : string,
  s3Key : string,
  s3Uri : string,
}

export interface InvokeDryRunTaskOutput extends InvokeImportTaskOutput {
  input: any,
  dry_run: InvokeImportTaskOutput,
}

export interface InvokeCommitTaskOutput extends InvokeImportTaskOutput {
  input: any,
  dry_run: InvokeImportTaskOutput,
  commit: InvokeImportTaskOutput,
}

export type InvokeImportStateOutput = InvokeDryRunTaskOutput | InvokeCommitTaskOutput

export interface GetAndPostImportTaskResultsInputOptions extends Omit<TaskBuilder, 'handler' | 'type'> { 
  mode: ImportMode,
}

/**
 * @typedef ImportTaskResults - Summary result of the importer.
 */
export interface ImportTaskResults {
  input: any,
  dry_run: InvokeImportTaskOutput,
  commit?: InvokeImportTaskOutput,
  summary?: ImportSummary,
  acceptance_criteria_met?: string, // Actually, a boolean would be nice but our flow builder only supports string comparisons.
}

/**
 * Get importer task results which are persisted in MySQL.
 * 
 * @param taskParams 
 * 
 * @returns {Result<ImportTaskResults, ErrCode>} - Returns summary, and boolean indicating whether acceptance criteria were met.
 */
export function getAndPostImportTaskResults(taskParams: GetAndPostImportTaskResultsInputOptions): TaskBuilder {
  const TAG = 'tasks.aws.ecsPostTaskResults'

  return task({
    ...taskParams,
    handler: async function (context: IContext, input: JsonObject): Promise<Result<JsonObject, ErrCode>> {
      const { mysql: { reader }, logger, config, aws: { snsClient } } = context

      const importMode = taskParams.mode
      const date = format(new Date(), `yyyy-MM-dd`)

      const {
        flowTaskLogId,
        spec,
        orgId,
        s3Bucket,
        s3Key,
        s3Uri,
        command,
      } = input as any as InvokeImportTaskOutput

      logger.info(context, TAG, `Reading stats for date - ${date}`, {
        mode: taskParams.mode,
      })
          
      try {
        const skipped = input['skipped'] ?? false

        if (skipped) {
          logger.info(context, TAG, `Task execution skipped.`, {
            input,
          })
            
          return ok(input)
        }

        const commitStatus: CommitStatus = importMode === ImportMode.DryRun ? CommitStatus.DryRun : CommitStatus.Commit

        const selectImportSummaryResult = await selectImportSummary(context, date, Number(orgId), spec, commitStatus)

        if (selectImportSummaryResult.isErr()) {
          logger.error(context, TAG, 'Error selecting import log entry.', input)

          return err(selectImportSummaryResult.error)
        }

        const summary = selectImportSummaryResult.value 

        logger.info(context, TAG, `${importMode} summary:`, { summary, })

        const message: string[] = []
            
        message.push(`${importMode} run result:`)
        message.push(``)
        message.push(`  spec: ${spec}`)
        message.push(`  org ID: ${orgId}`)
        message.push(`  s3 key: ${s3Key}`)
        message.push(`  s3 uri: ${s3Uri}`)
        message.push(`  summary:`)
        message.push(`    ${JSON.stringify(summary)}`)
        message.push(`  command:`)
        message.push(`    ${command.join(' ')}`)

        if (config.isProduction) {
          const topicParams = {
            TopicArn: config.ops_cdk.sns.eligibilityArn,
            Subject: `Eligibility import ${importMode} result for ${input['spec']} `,
            Message: message.join("\n")
          }
          const snsCommand = new PublishCommand(topicParams)
            
          await snsClient.send(snsCommand)
        }

        if (flowTaskLogId) {
          //
          // Update the log record meta with similar info sent in the SNS message.
          // This can be used to get info. on what has been immported.
          //
          const getLogRecordResult = await getFlowTaskLogRecord(context, { flowTaskLogId, })

          if (getLogRecordResult.isErr()) {
            logger.error(context, TAG, 'Error getting flow task log record.', { flowTaskLogId, })
          }
          else {
            const logRecord = getLogRecordResult.value[0]

            logRecord.meta = {
              spec,
              org_id: orgId,
              s3_bucket: s3Bucket,
              s3_key: s3Key,
              summary: summary as any as JsonObject,
            }

            await updateFlowTaskLogRecord(context, logRecord)
          }
        }
            
        const acceptanceCriteriaResult = doesImportSatisfyAcceptanceCriteria(context, summary)

        if (acceptanceCriteriaResult.isErr()) {
          logger.error(context, TAG, 'Error calculating acceptance criteria.', {
            summary,
          })

          return err(acceptanceCriteriaResult.error)
        }

        logger.debug(context, TAG, 'Acceptance criteria satisfied result: ', {
          satisfied: acceptanceCriteriaResult.value
        })

        const commit: InvokeImportTaskOutput | undefined = input['commit'] as any as (InvokeImportTaskOutput | undefined)

        //
        // Filter out all the meta-data at the top-level.
        //
        const output: ImportTaskResults = {
          input: input['input'] as JsonObject,
          dry_run: input['dry_run'] as any as InvokeImportTaskOutput,
          ...(commit && { commit, }),
          summary,
          //
          // String as only StringEquals and NOT BooleanEquals are supported in 'choice' states.
          //
          acceptance_criteria_met: String(acceptanceCriteriaResult.value), // String as only StringEquals and NOT BooleanEquals are supported
        }

        logger.debug(context, TAG, 'output: ', output)
            
        return ok(output as any as JsonObject)
      } catch(e) {
        logger.exception(context, TAG, e)

        return err(ErrCode.EXCEPTION)
      }
    } 
  })
}

export default {
  createECSTaskLoggingOptions,
  getAndPostImportTaskResults,
}