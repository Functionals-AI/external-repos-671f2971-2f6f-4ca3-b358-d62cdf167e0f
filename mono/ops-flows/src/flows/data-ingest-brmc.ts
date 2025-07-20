import { succeed, workflow } from '@mono/common-flows/lib/builder'
import { Brmc } from '@mono/ops/lib/data'
import OpsTasks from '../tasks/ingest'

const SOURCE = 'brmc'
const FLOW_NAME = `data-ingest-${SOURCE}`

const MTAG = [ 'ops-flows', 'flows', FLOW_NAME ]

enum State {
  Ingest = 'Ingest',
  Success = 'Success',
}

const SRC_PREFIX = 'brmc/inbound/'
const FILE_PREFIX = 'FoodSmart_Eligibility_BRMC'

export default workflow(function(config) {
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
          ingestFunction: Brmc.ingest,
          next: State.Success
        }),
        [State.Success]: succeed(),
      }
    }
  }
  else {
    console.log(`Source bucket required.`)
  }
})