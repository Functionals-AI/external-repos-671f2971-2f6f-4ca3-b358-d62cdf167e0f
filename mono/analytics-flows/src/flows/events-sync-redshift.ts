import { err, ok } from 'neverthrow'

import { JsonObject, task, workflow } from '@mono/common-flows/lib/builder'
import { ErrCode } from '@mono/common/lib/error'
import { EventTypes, publishEvent as publishEventTask } from '@mono/common-flows/lib/tasks/aws/eventbridge'
import { GetObjectCommand } from '@aws-sdk/client-s3'

const _DOMAIN = 'analytics-flows'
const _FLOW_NAME = 'EventSyncRedshift'

export default workflow(function(config) {
  return {
    event: {
      source: ['aws.s3'],
      detailType: ['Object Created'],
      detail: {
        bucket: {
          name: [config.analytics_cdk.events.bucketName]
        }
      },
    },
    startAt: 'FetchEvents',
    states: {
      FetchEvents: task({
        handler: async (context, input) => {
          const { logger, aws: { s3Client }, redshift } = context

          try {
            const {detail} = input
          
            const bucket = input['detail']['bucket']['name']
            const key = input['detail']['object']['key']
  
            const params = {
              Bucket: bucket, 
              Key: key,
            }
  
            const s3GetCommand = new GetObjectCommand(params)
            const s3Item = await s3Client.send(s3GetCommand)
            const s3FileStream = s3Item.Body
  
            if (s3FileStream === undefined) {
              logger.error(context, `EventsSyncRedshift.FetchEvents`, `Failed to download object from s3`, {bucket, key})
              return err(ErrCode.NOT_FOUND)
            }

            const objectBody = await s3FileStream.transformToString()
            console.log('input', JSON.stringify(input))

            const body = objectBody
            const lines = body.split("\n")

            for (let line of lines) {
              logger.info(context, `EventsSyncRedshift.FetchEvents`, `event data`, {line: JSON.stringify(line)})
            }

            const pool = await redshift()
            const sql = `
              BEGIN;
              CREATE TEMP TABLE tmp_events (LIKE analytics.events);
              COPY tmp_events FROM 's3://${bucket}/${key}' REGION 'us-west-2' IAM_ROLE '${config.analytics_cdk.events.redshiftRole}' FORMAT JSON 'auto ignorecase';
              DELETE FROM analytics.events WHERE id IN (SELECT id FROM tmp_events);
              INSERT INTO analytics.events SELECT * FROM tmp_events;
              DROP TABLE tmp_events;
              COMMIT;            
            `
            logger.info(context, `EventsSyncRedshift.FetchEvents`, `running copy command`, {sql})

            const resultQuery = await pool.query(sql)

            console.log(resultQuery)
  
            return ok({} as JsonObject)
          } catch(e) {
            logger.exception(context, `EventsSyncRedshift.FetchEvents`, e)
            return err(ErrCode.EXCEPTION)
          }

        },
        next: 'PublishCompletedEvent'
      }),
      PublishCompletedEvent: publishEventTask({
        eventDetail: {
          type: EventTypes.FlowCompleted,
          domain: _DOMAIN,
          flowName: _FLOW_NAME,
        }
      })
    }
  }
})

