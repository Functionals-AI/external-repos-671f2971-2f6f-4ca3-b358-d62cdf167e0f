import { task, workflow } from '@mono/common-flows/lib/builder'
import Logs from '@mono/ops/lib/logs'
import * as dayjs from 'dayjs'
import { err, ok } from 'neverthrow'
import { PublishCommand } from '@aws-sdk/client-sns'

export default workflow(function (config) {
  let rate = (config.isStaging || config.isProduction) ? '1 hour' : '1 day'
  let interval: [number, dayjs.ManipulateType] = (config.isStaging || config.isProduction) ? [-1, 'hour'] : [-1, 'day']

  return {
    rate,
    startAt: 'SendTelenutritionErrorLogs',
    states: {
      SendTelenutritionErrorLogs: task({
        handler: async (context, input) => {
          const { aws: { snsClient } } = context

          const result = await Logs.queryGroupTrace(context, {
            query: `
              fields @timestamp, @message
              | filter level = 'error'
              | sort @timestamp desc
              | limit 20
            `,
            logGroupName: config.telenutrition_cdk.telenutrition_app.apiLogGroupName,
            startTime: dayjs().add(interval[0], interval[1]).add(-2, 'minutes').unix(),
            endTime: dayjs().unix()
          })
      
          if (result.isErr()) {
            return err(result.error)
          }

          const logs = result.value
          
          if (logs.length === 0) {
            return ok({count: logs.length})
          }

          const lines: string[] = []

          for (let [entries, ids] of logs) {
            const id = entries[0].trace

            lines.push(`TRACE: ${entries[0].trace} (${ids.length})`)
      
            for (let entry of entries) {
              lines.push(`  ${dayjs(entry['@timestamp']).toISOString()}: [${entry.level}] ${entry.message}`)
            }
            lines.push('')
          }

          const params = {
            TopicArn: config.ops_cdk.sns.alertsLogsArn,
            Subject: `Telenutrition Error Logs (${config.env})`,
            Message: lines.join("\n"),
          }

          const command = new PublishCommand(params)
          await snsClient.send(command)

          return ok({ count: logs.length })
        },
      }),
    }
  }
})

