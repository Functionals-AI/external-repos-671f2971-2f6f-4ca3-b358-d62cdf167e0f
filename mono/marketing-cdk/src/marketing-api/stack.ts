import { CfnOutput, Fn, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { IConfig } from '@mono/common/lib/config'
import { EventBus, Rule } from 'aws-cdk-lib/aws-events'
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda'
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { CloudWatchLogGroup } from 'aws-cdk-lib/aws-events-targets'
import { Duration } from 'aws-cdk-lib'



export class MarketingApiStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, config: IConfig) {
    super(scope, id, props)

    const eventBus = new EventBus(this, 'QualtricsEventBus', {
      eventBusName: 'marketing-qualtrics'
    })

    const eventLoggerRule = new Rule(this, "QualtricsEventLoggerRule", {
      description: "Log all Qualtrics events",
      eventPattern: {
        region: [ config.aws.region ]
      },
      eventBus
    })

    const logGroup = new LogGroup(this, 'QualtricsEventLogGroup', {
      logGroupName: '/foodsmart/marketing/qualtrics-events',
    })

    eventLoggerRule.addTarget(new CloudWatchLogGroup(logGroup))

    const marketingApiFunction = new Function(this, 'MarketingApiFunction', {
      functionName: `Marketing-Api`,
      timeout: Duration.minutes(5),
      handler: 'index.handler',
      code: Code.fromInline(`
        exports.handler = async (event) => {
          const crypto = require('crypto')
          const AWSEventBridgeClient = require("@aws-sdk/client-eventbridge")
          const EventBridgeClient = AWSEventBridgeClient.EventBridgeClient
          const PutEventsCommand = EventBridgeClient.PutEventsCommand
          
          console.log(event)

          if (event.resource === '/webhooks/qualtrics' && event.httpMethod === 'POST') {
            const params = event.body.split('&').reduce((dict, part) => {
              const [key, val] = part.split('=')
              dict[key] = [val, decodeURIComponent(val)]
              return dict
            }, {})

            console.log(params)
            const hmac = crypto.createHmac('sha512', 'ovpFXHnOowxMQfvp')
            hmac.update(params['MSG'][0])
            const hash = hmac.digest('hex')

            console.log(hash)

            const topic = params['Topic'][0]
            const detailType = topic.split('.').slice(1,3).join('.')
            const detail = params['MSG'][1]            

            const eventbridge = new EventBridgeClient({region: '${config.aws.region}'}),
            const putEventsCommand = new PutEventsCommand({
              Entries: [
                {
                  EventBusName: '${eventBus.eventBusName}',
                  Source: 'qualtrics',
                  DetailType: detailType,
                  Detail: detail,
                }
              ]
            })
            const result = await eventBridgeClient.send(putEventsCommand)

            console.log(result)
          }

          const response = {
            statusCode: 200,
            body: JSON.stringify({})
          }
  
          return response
        }
      `),
      runtime: Runtime.NODEJS_22_X,
      environment: {
      }
    })

    eventBus.grantPutEventsTo(marketingApiFunction.role)

    new CfnOutput(this, 'MarketingApi-QualtricsEventBusArnOutput', {
      exportName: Fn.join('-', [Fn.ref('AWS::StackName'), 'QualtricsEventBusArn']),
      value: eventBus.eventBusArn,
      description: 'Qualtrics event bus arn output',
    })

    const api = new LambdaRestApi(this, 'MarketingApi', {
      restApiName: 'MarketingApi',
      handler: marketingApiFunction,
      proxy: false,
    })

    const webhooks = api.root.addResource('webhooks')
    const webhookQualtrics = webhooks.addResource('qualtrics')
    webhookQualtrics.addMethod('POST')

  }
}