import { succeed, workflow } from '@mono/common-flows/lib/builder'
import { CalOptima } from '@mono/ops/lib/data'
import OpsTasks from '../tasks/ingest'

const SOURCE = 'caloptima'
const FLOW_NAME = `data-ingest-${SOURCE}`

const MTAG = [ 'ops-flows', 'flows', FLOW_NAME ]

enum State {
  Ingest = 'Ingest',
  Success = 'Success',
}

const SRC_PREFIX = 'caloptima/inbound/'

export default workflow(function(config) {
  if (!config.isProduction) {
    return
  }

  const srcBucket = config.ops_cdk?.sftp?.sftpArchiveBucket?.name
  
  if (!srcBucket) {
    console.log(`Source bucket required.`)
    return
  }

  return {
    event: {
      source: ['aws.s3'],
      detailType: [ 'Object Created' ],
      detail: {
        bucket: {
          name: [ srcBucket ],
        },
        object: {
          key: [ { prefix: `${SRC_PREFIX}` } ]
        }
      }
    },
    startAt: 'Ingest',
    states: {
      [State.Ingest]: OpsTasks.ingest({
        flowName: FLOW_NAME,
        sourceId: SOURCE,
        ingestFunction: CalOptima.ingest,
        next: State.Success
      }),
      [State.Success]: succeed(),
    }
  }
})
