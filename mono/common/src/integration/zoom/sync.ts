import { ErrCode } from '../../error'
import { IContext } from '../../context'

import { Result, ok } from 'neverthrow'
import { Logger } from '../..'

import Api from './api'
import Store, { MeetingParticipantRecord } from './store'
import { promiseMap } from '../../promise'

const MTAG = Logger.tag()

export async function syncMeetingParticipants(context: IContext, meetingIds: string[]): Promise<Result<MeetingParticipantRecord[], ErrCode>> {
  const TAG = [ ...MTAG, 'syncMeetingParticipants']
  const result = await promiseMap<MeetingParticipantRecord[], ErrCode>(meetingIds.map((meetingId) => {
    return async () => {
      const timer = new Promise(r => setTimeout(r, 1000))
      const participantsResult = await Api.getPastMeetingParticipants(context, meetingId)
      await timer
      return participantsResult
    }
  }), { concurrency: 20 })

  const updates: MeetingParticipantRecord[] = []
  for (const res of result) {
    if (res.isOk()) {
      updates.push(...res.value)
    }
  }
  await Store.insertMeetingParticipantRecords(context, updates)
  return ok(updates)
}

export default {
  syncMeetingParticipants
}