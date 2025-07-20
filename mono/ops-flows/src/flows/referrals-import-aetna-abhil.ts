import { JsonObject, succeed, wait, workflow } from '@mono/common-flows/lib/builder'
import { importInboundReferrals } from '@mono/ops/lib/referral/sources/aetna-abhil'
import ReferralsTasks from '../tasks/referrals'
import { detailType, EventTypes } from '@mono/common-flows/lib/tasks/aws/eventbridge'

const SOURCE = 'aetna-abhil'
const FLOW_NAME = `referrals-ingest-${SOURCE}`

enum State {
  Wait = 'Wait',
  Import = 'Import',
  Success = 'Success',
}

const IMPORT_FLOW_NAME = 'eligibility-import-legacy'

export default workflow(function(config) {
  return {
    ...((config.isProduction) && {
      event: {
        bus: 'default',
        source: ['foodsmart'],
        detailType: [
          detailType({
            type: EventTypes.FlowCompleted,
            domain: 'ops',
            flowName: IMPORT_FLOW_NAME,
          })
        ],
      }
    }),
    startAt: State.Wait,
    states: {
      // `eligibility-import-legacy` completion event triggers both this and the
      // `upsert-identities` flow, but we require `upsert-identities` to complete
      // before starting this flow. This is janky but mostly works.
      // 
      // See https://app.clickup.com/t/10502102/ENG-2543 for work to migrate
      // upsert-identities.
      [State.Wait]: wait({
        seconds: 60 * 60, // 1 hour
        next: State.Import,
      }),
      [State.Import]: ReferralsTasks.importInboundReferrals({
        flowName: FLOW_NAME,
        importFunction: importInboundReferrals,
        input: function (input: JsonObject) {
          let detail = input['detail']

          if (detail['data']) {
            detail = detail['data'] as JsonObject
          }

          input['referral'] = {
            // Input to the flow expected to be an S3 event.
            // @ts-ignore
            s3_bucket: detail.bucket.name,
            // @ts-ignore
            s3_key: detail.object.key,
          }
          return input
        },
        next: State.Success
      }),
      [State.Success]: succeed(),
    }
  }
})
