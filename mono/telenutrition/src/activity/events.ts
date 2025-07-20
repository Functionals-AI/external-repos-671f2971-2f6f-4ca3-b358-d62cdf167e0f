import { inspect } from 'node:util'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { ok, err, Result  } from 'neverthrow'
import { PutEventsCommand } from '@aws-sdk/client-eventbridge'

export const eventBusName = 'default'

export enum EventTypes {
  UserActivitiesCreated = 'telenutrition.activity.user-activites.created'
}

const MTAG = [ 'telenutrition', 'athena', 'warehouse', 'events' ]

export interface UserActivitiesCreatedEvent {
  num_activities: number | null,
}

export async function publishUserActivitiesCreatedEvent(context: IContext, event: UserActivitiesCreatedEvent): Promise<Result<boolean, ErrCode>> {
  const TAG = [...MTAG, 'publishUserActivitiesCreatedEvent']
  const { logger, aws: { eventBridgeClient } } = context

  try {
    const entry = {
      EventBusName: eventBusName,
      Source: 'foodsmart',
      DetailType: EventTypes.UserActivitiesCreated,
      Detail: JSON.stringify(event),
    }

    const putEventsCommand = new PutEventsCommand({
      Entries: [entry]
    })

    const putEventsResponse = await eventBridgeClient.send(putEventsCommand)

    logger.info(context, TAG, 'Put event response.', {
      response: inspect(putEventsResponse, { depth: null } ),
    })
    
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

