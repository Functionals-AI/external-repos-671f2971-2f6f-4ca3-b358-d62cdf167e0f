import { DateTime } from 'luxon'

import { succeed, workflow } from '@mono/common-flows/lib/builder'
import SFTPTasks from '@mono/common-flows/lib/tasks/sftp'
import OpsTasks from '../tasks/ingest'
import { Umpqua } from '@mono/ops/lib/data' // This assumes Umpqua and Umpqua HMA care the same data.
import { sftpGetConfig } from '../sftp-helper'

const SOURCE = 'umpqua-hma'
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
        startAt: 'SFTPGet',
        states: {
          [State.SFTPGet]: SFTPTasks.mget({
            sftpConfig: sftpGetConfig(SOURCE),
            destBucket: dataBucket,
            destPrefix: `${SOURCE}/sftp/`,
            modifiedSince: DateTime.now().minus({ days: 30 }).toMillis(),
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
