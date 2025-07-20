import { succeed, workflow } from '@mono/common-flows/lib/builder'
import { Quartz } from '@mono/ops/lib/data'
import { put as PutToGDriveTask } from '@mono/common-flows/lib/tasks/google/drive'
import { ingest as IngestTask } from '../tasks/ingest'

const SOURCE = 'quartz'
const FLOW_NAME = 'data-ingest-quartz' 

const MTAG = [ 'ops-flows', 'flows', FLOW_NAME ]

const SRC_PREFIX = 'quartz/'
const FILE_PREFIX='Quartz_Foodsmart_Eligibility_'

enum State {
  Ingest = 'Ingest',
  SyncToGDrive = 'SyncToGDrive',
  Success = 'Success',
}

export default workflow(function(config) {
  if (config.isProduction) {
    const srcBucket = config.ops_cdk?.sftp?.sftpArchiveBucket?.name
    const externalDataBucket = config.ops_cdk?.data?.destBuckets.externalData.name
    const gdriveConfig = config.foodapp?.eligibility.googleDrive

    if (!srcBucket) {
      console.error(`Source bucket is required.`)

      return
    }
    else if (!externalDataBucket) {
      console.error(`External data bucket is required.`)

      return
    }
    else if (!gdriveConfig) {
      console.error(`Google Drive config is required.`)

      return
    }
    else {
      const driveLocation = {
        sharedDriveFolderId: gdriveConfig.sharedDriveFolderId,
        folderId: gdriveConfig.folderId
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
              key: [ { prefix: `${SRC_PREFIX}${FILE_PREFIX}` } ]
            }
          }
        },
        startAt: 'Ingest',
        states: {
          [State.Ingest]: IngestTask({
            flowName: FLOW_NAME,
            sourceId: SOURCE,
            ingestFunction: Quartz.ingest,
            next: State.SyncToGDrive,
          }),
          [State.SyncToGDrive]: PutToGDriveTask({
            s3Bucket: externalDataBucket,
            s3Keys: (input) => {
              const uploadResults = input['uploadResults'] as any
              
              return uploadResults.filter(r => r.destBucket === externalDataBucket).map(r => r.destKey)
            },
            driveLocation,
            next: State.Success,
          }),
          [State.Success]: succeed(),
        }
      }
    }
  }
})
