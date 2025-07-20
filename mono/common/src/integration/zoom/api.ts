import { Result, ok, err } from 'neverthrow'
import axios from 'axios'
import { DateTime } from 'luxon'

import { IContext } from '../../context'
import { ErrCode } from '../../error'
import { MeetingParticipantRecord } from './store'

const MTAG = [ 'common', 'service', 'zoom', 'api' ]

const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2/'

let accessToken: string | undefined = undefined

/**
 * Server -> Server access tokens are used, with an account_credentials grant type.
 * They are good for one hour. Cache them so we don't inadvertantly
 * keep requesting a new one which may invalidate one for a request that may have not
 * fired yet. On a 401, retry the request with a new token.
 * 
 * IE:
 * 
 * POST https://zoom.us/oauth/token?grant_type=account_credentials&account_id={accountId}
 * HTTP/1.1
 * Host: zoom.us
 * Authorization: Basic Base64Encoder(clientId:clientSecret)
 * 
 * See: https://developers.zoom.us/docs/internal-apps/s2s-oauth/
 * 
 * @param context 
 * @param getNew 
 */
async function getAccessToken(context: IContext, getNew: boolean = false): Promise<Result<string, ErrCode>> {
  const { config, logger } = context
  const TAG = [ ...MTAG, 'getAccessToken' ]

  try {
    if (accessToken === undefined || getNew) {
      if (config.common.zoom === undefined) {
        logger.error(context, TAG, 'Zoom config is not available.')

        return err(ErrCode.INVALID_CONFIG)
      }

      const tokenEndpoint = 'https://zoom.us/oauth/token'
      const tokenAuth = Buffer.from(`${config.common.zoom.clientId}:${config.common.zoom.clientSecret}`).toString('base64')
    
      const response = await axios.post(tokenEndpoint, null, {
        params: {
          grant_type: 'account_credentials',
          account_id: config.common.zoom.accountId,
        },
        headers: {
          'Authorization': `Basic ${tokenAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    
      accessToken = response.data.access_token
  
    }
    return ok(accessToken as string)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Helper to retry a request with a new access token on a 401.
 * 
 * @param context 
 * @param request 
 */
async function doRequest(context: IContext, request: (token) => Promise<any>): Promise<Result<any, ErrCode>> {
  const { logger } = context 
  const TAG = [ ...MTAG, 'doRequest' ]
  try {
    const tokenResult = await getAccessToken(context)

    if (tokenResult.isErr()) {
      return err(ErrCode.AUTHENTICATION)
    }

    const token = tokenResult.value

    const response = await request(token)

    return ok(response.data)
  }
  catch (e) {
    if (e.response?.status === 401) {
      try {
        const tokenResult = await getAccessToken(context, true)

        if (tokenResult.isErr()) {
          return err(ErrCode.AUTHENTICATION)
        }

        const token = tokenResult.value

        const response = await request(token)

        return ok(response.data)
      }
      catch (e) {
        logger.error(context, TAG, 'Error making request.', {
          status: e.response.status,
          data: e.response.data,
          headers: e.response.headers,
        })

        return err(ErrCode.EXCEPTION)        
      }
    } else if (e.response?.status === 404) {
      logger.error(context, TAG, 'Resource not found.', {
        status: e.response.status,
        data: e.response.data,
        headers: e.response.headers,
      })
      return err(ErrCode.NOT_FOUND)
    }

    if (e.response) {
      logger.error(context, TAG, 'Error making request.', {
        status: e.response.status,
        data: e.response.data,
        headers: e.response.headers,
      })
    } else {
      logger.exception(context, TAG, e)
    }
    return err(ErrCode.EXCEPTION)
  }
}

export interface Meeting {
  id: number,
  joinUrl: string,
}

/**
 * @typedef {Object} CreateMeetingOptions
 * 
 * @property {Date} startTime - Start date/time of meeting w/o timezone, ie: UTC timestamp.
 * @property {string} timezone - Timezone of meeting.
 * @property {string} topic - Meeting topic.
 */
export interface CreateMeetingOptions {
  duration: number,
  password: string,
  scheduleFor: string,
  startTime: Date,
  timezone: string,
  topic: string,
  tracking: Record<string, string>
}

export async function createMeeting(context: IContext, userId: string, options: CreateMeetingOptions): Promise<Result<Meeting, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'createMeeting' ]

  try {
    const { duration, password, startTime, timezone, topic, tracking } = options
    //
    // Format as yyyy-MM-ddTHH:mm:ss
    //
    const startTimeInTimezone = DateTime.fromJSDate(startTime).setZone(timezone).toFormat("yyyy-MM-dd'T'HH:mm:ss")

    const payload = {
      topic: topic, // 200 max chars
      schedule_for: userId,
      start_time: startTimeInTimezone,
      timezone: timezone,
      duration: duration, // Duration in minutes
      password: password,
      type: 2, // Scheduled meeting
      private_meeting: true,
      waiting_room: true,
      auto_recording: 'none', // In future, once there is consent, support - 'cloud'
      approval_type: 2, // No registration required.
      tracking_fields: Object.entries(tracking).map(([k, v]) => ({ field: k, value: v})),
    }

    async function request(token): Promise<any> {
      const response = await axios.post(`${ZOOM_API_BASE_URL}/users/${userId}/meetings`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
  
      return response
    }

    const requestResult = await doRequest(context, request)

    if (requestResult.isErr()) {
      logger.error(context, TAG, 'Error creating meeting.', {
        userId,
        options,
        payload,
      })

      return err(requestResult.error)
    }

    const zoomMeeting = requestResult.value

    return ok({
      id: zoomMeeting.id,
      joinUrl: zoomMeeting.join_url,
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function deleteMeeting(context: IContext, meetingId: string): Promise<Result<boolean, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'deleteMeeting' ]

  try {
    async function request(token): Promise<any> {
      const response = await axios.delete(`${ZOOM_API_BASE_URL}/meetings/${meetingId}`, {
        params: {
          schedule_for_reminder: false,
          cancel_meeting_reminder: false,
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      return response
    }

    const requestResult = await doRequest(context, request)

    if (requestResult.isErr()) {
      logger.error(context, TAG, 'Error deleting meeting.', {
        meetingId,
      })

      return err(requestResult.error)
    }

    return ok(true)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

// Note the API doesn't return results if there's only one participant in a meeting.
export async function getPastMeetingParticipants(context: IContext, meetingId: string): Promise<Result<MeetingParticipantRecord[], ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'createMeeting' ]

  try {
    async function request(token): Promise<any> {
      const response = await axios.get(`${ZOOM_API_BASE_URL}/past_meetings/${meetingId}/participants`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      return response
    }

    const requestResult = await doRequest(context, request)

    if (requestResult.isErr()) {
      logger.error(context, TAG, 'Error getting meeting participants.', {
        meetingId,
      })

      return err(requestResult.error)
    }

    const meeting = requestResult.value

    return ok(meeting.participants.map(participant => ({
      userId: participant.user_id,
      meetingId,
      joinTime: participant.join_time,
      leaveTime: participant.leave_time,
      duration: participant.duration,
      internalUser: participant.internal_user,
      rawData: JSON.stringify(participant)
    })))
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  createMeeting,
  deleteMeeting,
  getPastMeetingParticipants
}