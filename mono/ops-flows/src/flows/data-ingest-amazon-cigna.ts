import { succeed, workflow } from '@mono/common-flows/lib/builder'
import { AmazonCigna } from '@mono/ops/lib/data'
import OpsTasks from '../tasks/ingest'

const SOURCE = 'amazon-cigna'
const FLOW_NAME = `data-ingest-${SOURCE}`

const MTAG = [ 'ops-flows', 'flows', FLOW_NAME ]

const SRC_PREFIX = 'amazon-cigna/inbound/'
const FILE_PREFIX=''

enum State {
  Ingest = 'Ingest',
  Success = 'Success',
}

export default workflow(function(config) {
  if (config.isProduction) {
    const dataBucket = config.ops_cdk?.data?.destBuckets?.externalData?.name

    if (dataBucket) {
      return {
        event: {
          source: ['aws.s3'],
          detailType: [ 'Object Created' ],
          detail: {
            bucket: {
              name: [ dataBucket ],
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
            ingestFunction: AmazonCigna.ingest,
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
