import { Result } from 'neverthrow'
import { Duration } from 'aws-cdk-lib'

import { IConfig } from '@mono/common/lib/config'
import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'

export type LambdaFactory = (config: IConfig) => LambdaBuilder

export type LambdaBuilder = {
  name: string;
  handler: (context: IContext, event:any) => Promise<Result<any, ErrCode>>;
  timeout?: Duration;
  memorySize?: number; 
}

export function lambda(builder: LambdaFactory): LambdaFactory {
  return function(config: IConfig) {
    return builder(config)
  }
}

export default {
  lambda,
}