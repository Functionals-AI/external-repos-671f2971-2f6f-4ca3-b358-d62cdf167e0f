# Lambda Support

Facilitates creating stacks which contain Lambda functions for a domain.

## Defining Lambda Functions in a Domain

To define Lambda functions for a **domain** the  following folder structure should be created 
within a ```<domain>-lambdas``` folder. For example, assume there is a doamin called **demo**  the
**domain-lambdas**  page should be created:

```
demo-lambdas/
  package.json
  tsconfig.json
  DockerFile
  src/
    entrypoint.ts
    functions/
      hello.ts
      index.ts
```

The above hypothetical **demo** domain contains a "hello" function which would be defined as follows:

```
import { Result, ok } from 'neverthrow'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { JsonObject } from '@mono/common/lib/json'
import { lambda } from '@mono/common-lambdas/lib/builder'

const MTAG = [ 'demo-lambdas', 'functions', 'helo' ]

export default lambda(function(config) {
  return {
    name: 'hello',
    handler: async function(context: IContext, event: JsonObject): Promise<Result<any, ErrCode>> {
      const { logger } = context
      const TAG = [ ...MTAG, 'hello' ]

      console.log(`event: ${JSON.stringify(event)}`)

      return ok(event)
    },
    memorySize: 2048,
  }
})
```

The corresponding ```demo-lambdas/src/functions.index.ts```  should  export the function factories:

```
import Hello from './hello'

export default [
  Hello,
]
```

The entrypoint (demo-lambdas/src/entrypoint.ts) would be:

```
import { handlerFactory } from '@mono/common-lambdas/lib/entrypoint' 
import functions from './functions'

export const handler = handlerFactory(functions)
```

The corresponding Dockerfile would be:

```
FROM public.ecr.aws/lambda/nodejs:22 as builder

WORKDIR /app
ARG NODE_ENV=production

# Install pnpm and dependencies
RUN npm install -g pnpm@10.6.5

COPY . .

RUN pnpm install --filter=. --frozen-lockfile --loglevel notice
RUN CI=true pnpm install --filter=@mono/demo-lambdas... --frozen-lockfile --loglevel notice
RUN pnpm turbo run tsc:build --filter=@mono/demo-lambdas... --concurrency=50%

FROM public.ecr.aws/lambda/nodejs:22

COPY --from=builder /app/package.json ${LAMBDA_TASK_ROOT}/package.json
COPY --from=builder /app/node_modules ${LAMBDA_TASK_ROOT}/node_modules

COPY --from=builder /app/common/lib ${LAMBDA_TASK_ROOT}/common/lib
COPY --from=builder /app/common/package.json ${LAMBDA_TASK_ROOT}/common/package.json
COPY --from=builder /app/common/node_modules ${LAMBDA_TASK_ROOT}/common/node_modules

COPY --from=builder /app/common-lambdas/lib ${LAMBDA_TASK_ROOT}/common-lambdas/lib
COPY --from=builder /app/common-lambdas/package.json ${LAMBDA_TASK_ROOT}/common-lambdas/package.json
COPY --from=builder /app/common-lambdas/node_modules ${LAMBDA_TASK_ROOT}/common-lambdas/node_modules

COPY --from=builder /app/demo-lambdas/lib ${LAMBDA_TASK_ROOT}/demo-lambdas/lib
COPY --from=builder /app/demo-lambdas/package.json ${LAMBDA_TASK_ROOT}/demo-lambdas/package.json
COPY --from=builder /app/demo-lambdas/node_modules ${LAMBDA_TASK_ROOT}/demo-lambdas/node_modules

CMD [ "demo-lambdas/lib/entrypoint.handler" ]
```

## Creating A CDK Lambdas Stack

Now, for the hypothetical **demo** domain, the corresponding ```demo-cdk``` whould have a ```demo-lambdas``` stack (```demo-cdk/src/demo-lambdas/stack.ts```):

```
import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

import { IConfig } from '@mono/common/lib/config'
import { createLambdas } from '@mono/common-cdk/lib/lambdas'
import lambdas from '@mono/demo-lambdas/lib/functions'

export class DemoLambdasStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const createLambdasResult = createLambdas(this, config, 'demo', lambdas, {
      dockerFilePath: './demo-lambdas/Dockerfile'
    })
  }
}
```

Furthermore, the **first time** such a stack would be  deployed, there would be an  absence of an image. This would create the Lambda function creation to fail. To avoid this, the lambda creation supports a **context variable** to indicate this is the initial stack deployment which will only create the  build project. IE:

```
pnpm cdk deploy --context InitialDeploy=1 DemoLambdasStack
```

The **InitialDeploy** context variable prevents creatiion of the entire stack, and only creates the build project. Subsequently, a build should be performed, and a complete build performed:

```
pnpm cdk deploy --parameters LambdasImageBuildTag=$IMAGE_TAG DemoLambdasStack
```