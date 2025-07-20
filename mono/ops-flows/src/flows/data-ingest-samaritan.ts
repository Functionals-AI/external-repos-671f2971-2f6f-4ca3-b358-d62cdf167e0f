import { succeed, workflow } from '@mono/common-flows/lib/builder'
import { Samaritan } from '@mono/ops/lib/data'
import OpsTasks from '../tasks/ingest'

const SOURCE = 'samaritan'
const FLOW_NAME = `data-ingest-${SOURCE}`

enum State {
  Ingest = 'Ingest',
  Success = 'Success',
}

const SRC_PREFIX = 'samaritan/inbound/'
const FILE_PREFIX='SHP_Foodsmart_Eligibility_'

export default workflow(function(config) {
  if (config.isProduction) {
    const srcBucket = config.ops_cdk?.sftp?.sftpArchiveBucket?.name

    if (srcBucket) {
      return {
        event: {
          source: ['aws.s3'],
          detailType: [ 'Object Created' ],
          detail: {
            bucket: {
              name: [ srcBucket ],
            },
            object: {
              key: [ { prefix: `${SRC_PREFIX}${FILE_PREFIX}` } ]
            }
          }
        },
        startAt: 'Ingest',
        states: {
          [State.Ingest]: OpsTasks.ingest({
            flowName: FLOW_NAME,
            sourceId: SOURCE,
            ingestFunction: Samaritan.ingest,
            next: State.Success
          }),
          [State.Success]: succeed(),
        }
      }
    }
    else {
      console.log(`Source bucket required.`)
    }
  }
})
