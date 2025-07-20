import { PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { IContext } from "../context"

const MTAG = [ 'common', 'tasks', 'events' ]

export enum TaskScriptStatusEventType {
  Finish = 'finish',
  Start = 'start',
  Error = 'error',
}

async function publishScriptStatusEvent(context: IContext, eventType: TaskScriptStatusEventType) {
  const TAG = [...MTAG, 'publishScriptStatusEvent']
  const {
    aws: { eventBridgeClient },
    logger
  } = context

  const putEventsCommand = new PutEventsCommand({
    Entries: [
      { EventBusName: 'common', Source: 'common.tasks.script', DetailType: eventType, Detail: JSON.stringify({}) },
    ],
  })

  const putEventsResponse = await eventBridgeClient.send(putEventsCommand)

  if (putEventsResponse.FailedEntryCount !== undefined && putEventsResponse.FailedEntryCount > 0) {
    if (putEventsResponse.Entries !== undefined) {
      for (let entry of putEventsResponse.Entries) {
        if (entry.EventId === undefined) {
          logger.error(context, TAG, 'Failed to publish event', {code: entry.ErrorCode, message: entry.ErrorMessage})
        }
      }  
    }
  }
}

export default {
  publishScriptStatusEvent,
}
