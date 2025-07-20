import { succeed, workflow } from '@mono/common-flows/lib/builder'
import { Uhcdsnp } from '@mono/ops/lib/data'
import OpsTasks from '../tasks/ingest'

const SOURCE = 'uhcdsnp'
const FLOW_NAME = `data-ingest-${SOURCE}`

const SRC_PREFIX = 'uhcdsnp/FromUHC/'
const FILE_PREFIX='DiabetesTargetPopulation'

enum State {
  Ingest = 'Ingest',
  Success = 'Success',
}

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
            ingestFunction: Uhcdsnp.ingest,
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
