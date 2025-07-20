import { Fn, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

import { IConfig } from '@mono/common/lib/config'
import { createWorkflow } from '@mono/common-cdk/lib/flows'
import { flows as e2EFlows, dependencies as e2EDependencies } from '@mono/telenutrition-e2e'

const domain = 'telenutrition-e2e';

export class TelenutritionE2EStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props);

    const { taskDefinition } = createWorkflow({
      config,
      flows: e2EFlows,
      domain,
      dependencies: e2EDependencies(),
      stack: this,
      dockerFileDir: 'telenutrition-e2e'
    })
  }
}
