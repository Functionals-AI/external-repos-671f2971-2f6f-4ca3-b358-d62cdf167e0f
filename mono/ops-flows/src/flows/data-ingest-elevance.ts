/**
 * Elevance data ingestion from their external SFTP.
 */
import { DateTime } from 'luxon'

import { succeed, workflow } from '@mono/common-flows/lib/builder'
import SFTPTasks from '@mono/common-flows/lib/tasks/sftp'
import { Elevance } from '@mono/ops/lib/data'
import OpsTasks from '../tasks/ingest'
import { sftpGetConfig } from '../sftp-helper'

const SOURCE = 'elevance'
const FLOW_NAME = `data-ingest-${SOURCE}`
const MTAG = [ 'ops-flows', 'flows', FLOW_NAME ]

enum State {
  SFTPGet = 'SFTPGet',
  Ingest = 'Ingest',
  Success = 'Success',
}
export default workflow(function(config) {
    if (config.isProduction) {
      const dataBucket = config.ops_cdk?.data?.destBuckets?.externalData?.name
  
      if (dataBucket) {
        return {
          cron: '0 0 * * ? *',
          startAt: 'SFTPGet',
          states: {
            [State.SFTPGet]: SFTPTasks.mget({
              sftpConfig: sftpGetConfig(SOURCE),
              destBucket: dataBucket,
              destPrefix: 'elevance/sftp/',
              modifiedSince: DateTime.now().minus({ days: 2 }).toMillis(),
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
              ingestFunction: Elevance.ingest,
              next: State.Success
            }),
            [State.Success]: succeed(),
          }
        }
      }
      else {
        console.log(`Client external SFTP config not defined.`)
      }
    }
  })