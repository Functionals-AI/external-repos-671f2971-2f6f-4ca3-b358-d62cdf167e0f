import { succeed, workflow } from '@mono/common-flows/lib/builder'
import { Umpqua } from '@mono/ops/lib/data'
import OpsTasks from '../tasks/ingest'

const SOURCE = 'umpqua'
const FLOW_NAME = `data-ingest-${SOURCE}`

enum State {
  Ingest = 'Ingest',
  Success = 'Success',
}

const SFTP_ARCHIVE_PREFIX = 'umpqua/uploads/'
  
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
              key: [ { prefix: SFTP_ARCHIVE_PREFIX } ]
            }
          }
        },
        startAt: 'Ingest',
        states: {
          [State.Ingest]: OpsTasks.ingest({
            flowName: FLOW_NAME,
            sourceId: SOURCE,
            ingestFunction: Umpqua.ingest,
            next: State.Success
          }),
          [State.Success]: succeed(),
        }
      }
    }
    else {
      console.log(`Source bucket / prefix required.`)
    }
  }
})
