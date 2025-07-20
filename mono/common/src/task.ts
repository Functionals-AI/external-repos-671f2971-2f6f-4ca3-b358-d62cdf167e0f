import { err, ok, Result } from 'neverthrow'
import { IContext } from './context'
import { ErrCode } from './error'
import Logger from './logger'

export type TaskHandlerInput = Record<string, string>
export type TaskHandlerOutput = {status: TaskStatus} & Record<string, any>
export type TaskHandlerFunction = (context: IContext, input: TaskHandlerInput) => Promise<Result<TaskHandlerOutput, ErrCode>>
export type TaskRegistry = Record<string, TaskHandlerFunction>

export enum TaskStatus {
  Success = 'success',
  Fail = 'fail',
}

const MTAG = Logger.tag()
const INPUT_PREFIX = 'IN|'
const TASK_TOKEN_PREFIX = 'TASK_TOKEN'

async function handle(context: IContext, registry: TaskRegistry, taskName: string) {
  const TAG = [...MTAG, 'handle']
  const {logger, aws} = context
  const taskToken = getTaskToken()

  try {
    if (!(taskName in registry)) {
      await aws.sfn.sendTaskFailure({taskToken, error: String(ErrCode.NOT_FOUND)})
      return
    }

    const taskHandler = registry[taskName]
    const input: TaskHandlerInput = getInput()
    const handlerResult = await taskHandler(context, input)
  
    if (handlerResult.isOk()) {      
      const output = getOutput(handlerResult.value)
      await aws.sfn.sendTaskSuccess({taskToken, output})
    } else {
      await aws.sfn.sendTaskFailure({taskToken, error: String(handlerResult.error)})
    }
  } catch(e) {
    logger.exception(context, TAG, e)
    await aws.sfn.sendTaskFailure({taskToken, error: String(ErrCode.EXCEPTION)})
  }
}

function getInput(): TaskHandlerInput {
  return Object.entries(process.env)
    .reduce((input, [key, value]) => {
      if (key.startsWith(INPUT_PREFIX)) {
        input[key.substring(INPUT_PREFIX.length)] = value || ''
      }
      return input
    }, {})
}

function getOutput(output: TaskHandlerOutput): string {
  return JSON.stringify(output)
}

function getTaskToken() {
  return process.env[TASK_TOKEN_PREFIX]
}

export default {
  handle,
}