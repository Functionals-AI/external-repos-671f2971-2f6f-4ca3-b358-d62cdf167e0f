/**
  * Molina House data ingestion from their external SFTP.
  */
import { DateTime } from 'luxon'
 
import { WorkflowBuilder, succeed, workflow } from '@mono/common-flows/lib/builder'
import SFTPTasks from '@mono/common-flows/lib/tasks/sftp'
import { MolinaIL } from '@mono/ops/lib/data'
import OpsTasks from '../tasks/ingest'
import { sftpGetConfig } from '../sftp-helper'

const SOURCE = 'molina-il'
const FLOW_NAME = `data-ingest-${SOURCE}`
const MTAG = [ 'ops-flows', 'flows', FLOW_NAME ]

/*/
Separate states for pulling files from their SFTP server and ingesting into S3.
/*/
enum State {
  SFTPGet = 'SFTPGet',
  Ingest = 'Ingest',
  Success = 'Success',
}
export default workflow(function(config) {
  const dataBucket = config.ops_cdk?.data?.destBuckets?.externalData?.name
  
  if (dataBucket) {
    let builder: WorkflowBuilder | undefined 

    if (config.isProduction) {
      builder = {
       cron: '0 0 * * ? *',
        startAt: 'SFTPGet',
        states: {
          [State.SFTPGet]: SFTPTasks.mget({
            sftpConfig: sftpGetConfig(SOURCE),
            destBucket: dataBucket,
            destPrefix: 'molina/sftp/',
            noUpdateOnMatch: true,
            output: function(output, input) {
              return {
                ...input,
                ...output,
              }
            },
            next: State.Ingest,
          }),
          [State.Ingest]: OpsTasks.ingestFromSFTP({
            flowName: FLOW_NAME,
            sourceId: SOURCE,
            ingestFunction: MolinaIL.ingest,
            next: State.Success
          }),
          [State.Success]: succeed(),
        }
      }
    }
    else {
      //
      // Allow triggering in non-production via dropping to S3.
      // Need a different path for input vs ougtput to avoid
      // self-triggeering.
      //
      const FILE_PREFIX = 'molina/test/input/'

      builder = {
        event: {
          source: ['aws.s3'],
          detailType: [ 'Object Created' ],
          detail: {
            bucket: {
              name: [ dataBucket ],
            },
            object: {
              key: [ { prefix: `${FILE_PREFIX}` } ]
            }
          }
        },
        startAt: 'Ingest',
        states: {
          [State.Ingest]: OpsTasks.ingest({
            flowName: FLOW_NAME,
            sourceId: SOURCE,
            ingestFunction: MolinaIL.ingest,
            next: State.Success
          }),
          [State.Success]: succeed(),
        }
      }
    }

    return builder
  }
  else {
    console.log(`Client external SFTP config not defined.`)
  }
})
