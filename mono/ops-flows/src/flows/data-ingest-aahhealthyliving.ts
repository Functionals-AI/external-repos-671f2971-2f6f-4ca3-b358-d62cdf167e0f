import { succeed, workflow } from '@mono/common-flows/lib/builder'
import { AahHealthyLiving } from '@mono/ops/lib/data'
import OpsTasks from '../tasks/ingest'

const SOURCE = 'aahhealthyliving'
const FLOW_NAME = `data-ingest-${SOURCE}`

const MTAG = [ 'ops-flows', 'flows', FLOW_NAME ]

const SRC_PREFIX = 'aahhealthyliving/'
const FILE_PREFIX='Foodsmart_Eligibility_File_'

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
            ingestFunction: AahHealthyLiving.ingest,
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
