import { Result } from 'neverthrow'
import Context, { IContext } from '../context'
import { ErrCode } from '../error'
import Logger from '../logger'

export type ScriptHandlerInput = string[]
export type ScriptHandlerOutput = Record<string, string | number>
export type ScriptHandlerFunction = (context: IContext, input: ScriptHandlerInput) => Promise<Result<ScriptHandlerOutput, ErrCode>>
export type ScriptRegistryFunction = (name: string, args: string[]) => Promise<void>
export type ScriptRegistry = Record<string, ScriptRegistryFunction>

const MTAG = Logger.tag()

function register(handle: ScriptHandlerFunction) {  
  return async function(name: string, args: string[]) {
    const TAG = [...MTAG, 'handler']
    
    const context = await Context.create()
    const {logger} = context

    handleSignals(context)

    logger.info(context, [...TAG, 'start'], `Started script ${name}`, {script: name})

    const result = await handle(context, args)
    const extra = result.isOk() ? {success:true, ...result.value} : {success:false, error: result.error}

    logger.info(context, [...TAG, 'finish'], `Finished script ${name}`, {script: name, ...extra})

    await terminate(context)
  }
}

function handleSignals(context: IContext) {
  process.on('SIGTERM', async () => {
    // logger.error(context, `${TAG}.sigterm`, `The task ${taskName} is being forced to stop`)
    terminate(context)
  })
}

async function terminate(context: IContext) {
  await Context.destroy(context)
  process.exit(0)
}

export default {
  register,
}