import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import { Stack, StackProps, CfnOutput} from 'aws-cdk-lib'
import { Construct } from 'constructs'

import { IConfig } from '@mono/common/lib/config'

export class CommonCacheStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const shortLinkTable = new dynamodb.Table(this, 'CommonShortLinkTable', {
      tableName: 'common_shortlink',
      partitionKey: { 
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expires',
      pointInTimeRecovery: true,
    })

    const shortLinkOutput = new CfnOutput(this, 'ShortLinkTableArn', {value: shortLinkTable.tableArn})

    const ratelimitTable = new dynamodb.Table(this, 'CommonRatelimitTable', {
      tableName: 'common_ratelimit',
      partitionKey: { 
        name: 'key',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'expires',
    })

    const ratelimitOutput = new CfnOutput(this, 'RatelimitTableArn', {value: ratelimitTable.tableArn})
  }
}