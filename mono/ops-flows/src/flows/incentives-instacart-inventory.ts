import { err, ok } from 'neverthrow'
import { PublishCommand } from '@aws-sdk/client-sns'

import { ErrCode } from '@mono/common/lib/error'
import { JsonObject, task, workflow } from '@mono/common-flows/lib/builder'
import { getInstacartCodeInventory } from '@mono/ops/lib/incentives/service'

const MTAG = [ 'ops-flows', 'flows', 'incentives-instacart-inventory' ]

enum State {
  GetCodeInventory = 'GetCodeInventory'
}

export default workflow(function (config) {
  //
  // InstaCart codes are only used in production.
  //
  if (config.isStaging || config.isProduction) {
    return {
      rate: '1 day',
      startAt: State.GetCodeInventory,
      states: {
        [State.GetCodeInventory]: task({
          handler: async (context) => {
            const { aws: { snsClient, }, logger } = context
            const TAG = [ ...MTAG, State.GetCodeInventory ]
            const result = await getInstacartCodeInventory(context)

            if (result.isErr()) {
              return err(result.error)
            }

            const topicArn = config.ops_cdk.sns?.alertsIncentivesInstacartArn

            if (!topicArn) {
              logger.error(context, TAG, 'Topic arn not found.')

              return err(ErrCode.INVALID_CONFIG)
            }

            const inventory = result.value

            const toAlarm = inventory.codeInventory.filter(inv => inv.codesToRequest > 0).length > 0

            if (toAlarm) {
              //
              // Codes should be requested for at least 1 denomination.
              //

              logger.info(context, TAG, 'Additional InstaCart codes are required.', {
                inventory,
              })

              const header = [
                'denomination',
                'inventory',
                'dailyConsumption',
                'requiredNDaysCodes',
                'surplusNDays',
                'deficitNDays',
                'daysRemaining',
                'codesToRequest',
              ]
              
              const lines = [
                header.join('\t')
              ]

              for (const codeInventory of inventory.codeInventory) {
                lines.push(header.map(key => codeInventory[key]).join('\t'))
              }

              const params = {
                TopicArn: topicArn,
                Subject: `Instacart code inventory and usage, ${inventory.historyDays} days history (${config.env})`,
                Message: lines.join('\n'),
              }
          
              const command = new PublishCommand(params)
              await snsClient.send(command)
            }
          
            return ok(inventory as any as JsonObject)
          }
        })
      }
    }
  }
})