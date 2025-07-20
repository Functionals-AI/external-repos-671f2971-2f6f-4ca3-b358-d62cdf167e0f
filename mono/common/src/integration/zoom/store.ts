import { ErrCode } from '../../error'
import { IContext } from '../../context'
import * as _ from 'lodash'

import { Result, err, ok } from 'neverthrow'
import * as zs from 'zapatos/schema'
import * as db from 'zapatos/db'
import { Logger } from '../..'

export type MeetingParticipantRecord = {
  userId: string,
  meetingId: string,
  joinTime: Date,
  leaveTime: Date,
  duration: number,
  internalUser: boolean,
  rawData: string
}

const MTAG = Logger.tag()

export async function insertMeetingParticipantRecords(context: IContext, records: MeetingParticipantRecord[]): Promise<Result<MeetingParticipantRecord[], ErrCode>> {
  const { logger, store: { writer }} = context
  const TAG = [ ...MTAG, 'insertMeetingParticipantRecords']

  try {
    const pool = await writer()

    const insertables: zs.common.meeting_participant.Insertable[] = records.map(record => ({
      user_id: record.userId,
      meeting_id: record.meetingId,
      join_time: record.joinTime,
      leave_time: record.leaveTime,
      duration: record.duration,
      internal_user: record.internalUser,
      raw_data: record.rawData
    }))

    await db.upsert('common.meeting_participant', insertables, ['user_id','meeting_id','join_time']).run(pool)
    return ok(records)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  insertMeetingParticipantRecords
}