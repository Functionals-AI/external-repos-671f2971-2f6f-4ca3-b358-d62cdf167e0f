import process from 'node:process'
import { Result, err } from 'neverthrow'

import {Context} from '@mono/common'
import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { LambdaFactory  } from './builder'

export type Functions = LambdaFactory[]

async function invokeFunction(context: IContext, functions: Functions, name: string, event: any): Promise<Result<boolean, ErrCode>> {
  // Find the lambda by name in factories
  for (const factory of functions) {
    if (factory === undefined) {
      continue
    }

    const builder = factory(context.config)
    if (builder?.name === name) {
      // Found the lambda, execute handler with config
      return await builder.handler(context, event)
    }
  }

  // Lambda not found, return error
  return err(ErrCode.NOT_FOUND)
}

export function handlerFactory(functions: Functions) {
  return async function handler(event: any) {
    const TAG = ['telnutrition-lambdas', 'entrypoint', 'handler'].join('.')

    let context: IContext | undefined
    let exitCode = 1

    process.on('SIGTERM', async () => {
      if (context !== undefined) {
        Context.destroy(context)
      }
    })

    try {
      //TODO: Lambda functions need to use RDS Proxy in production to avoid exhausting DB connection limits
      context = await Context.create()

      const name = process.env['FUNCTION_NAME']

      if (name === undefined) {
        console.log(JSON.stringify({tag: TAG, level: 'error', message: `An environment variable with the key "FUNCTION_NAME" must be passed to find the function to invoke. `}))
        return
      }

      const result = await invokeFunction(context, functions, name, event)

      if (result.isErr()) {
        console.log(JSON.stringify({tag: TAG, level: 'error', message: `Unable to find function with the name: ${name}`, data: {code: result.error}}))
        return
      }

      if (result.isOk()) {
        console.log(`result: ${result.value}`)
        exitCode = 0
        return result.value
      }
    } catch(e) {
      console.log(e)
      console.log(JSON.stringify({tag: TAG, level: 'exception'}))
    } finally {
      process.exitCode = exitCode

      if (context !== undefined) {
        await Context.destroy(context)
      }
    }
  }
}

export default {
  handlerFactory,
}