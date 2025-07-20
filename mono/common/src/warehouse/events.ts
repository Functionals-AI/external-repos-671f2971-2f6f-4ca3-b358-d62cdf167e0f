import Logger from '../logger'
import { IContext } from '../context'
import { ErrCode } from '../error'
import { ok, err, Result  } from 'neverthrow'
import { PutEventsCommand } from '@aws-sdk/client-eventbridge'

export const eventBusName = 'common-warehouse'

export enum EventTypes {
  WarehouseSyncCompleted = 'warehouse.sync.completed'
}

const MTAG = Logger.tag()

export interface WarehouseSyncCompletedEvent {
  schema_name: string,
  synced_tables: {
    table_name: string,
    row_count: number,
  }[] 
}

export async function publishWarehouseSyncCompletedEvent(context: IContext, event: WarehouseSyncCompletedEvent): Promise<Result<boolean, ErrCode>> {
  const TAG = [...MTAG, 'publishWarehouseSyncCompletedEvent']
  const { logger, aws: { eventBridgeClient } } = context

  try {
    const entry = {
      EventBusName: eventBusName,
      Source: 'foodsmart',
      DetailType: EventTypes.WarehouseSyncCompleted,
      Detail: JSON.stringify(event)
    }

    const putEventsCommand = new PutEventsCommand({
      Entries: [entry]
    })
    
    const putEventsResponse = await eventBridgeClient.send(putEventsCommand)
    
    if (putEventsResponse.FailedEntryCount !== undefined && putEventsResponse.FailedEntryCount > 0) {
      if (putEventsResponse.Entries !== undefined) {
        for (let entry of putEventsResponse.Entries) {
          if (entry.EventId === undefined) {
            logger.fatal(context, TAG, 'Failed to publish event', {code: entry.ErrorCode, message: entry.ErrorMessage})
          }
        }  
      }
      return ok(false)
    }
    logger.info(context, TAG, `published event: ${entry.DetailType}`, {entry})
    
    return ok(true)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  eventBusName,
  EventTypes,
}

