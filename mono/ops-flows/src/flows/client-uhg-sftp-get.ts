/**
 * Get client data from their external SFTP servers. Note, some clients require our IPs to be
 * whitelisted. Hence, run a flow on a cadence in our VPC.
 */
import { DateTime } from 'luxon'

import { workflow } from '@mono/common-flows/lib/builder'
import SFTPTasks from '@mono/common-flows/lib/tasks/sftp'
import { sftpGetConfig } from '../sftp-helper'

const MTAG = [ 'opstst-flows', 'flows', 'client-uhg-sftp-get' ]

enum State {
  SFTPGet = 'SFTPGet',
  Success = 'Success',
}

const SOURCE = 'uhg'

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
            destPrefix: 'uhg/',
            modifiedSince: DateTime.now().minus(14 * 24 * 3600 * 1000).toMillis(),
          })
        }
      }
    }
    else {
      console.log(`Client external SFTP config not defined.`)
    }
  }
})
