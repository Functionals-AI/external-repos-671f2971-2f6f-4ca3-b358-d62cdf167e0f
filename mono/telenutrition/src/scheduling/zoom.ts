import { Result, err, ok } from 'neverthrow'
import { randomInt } from 'node:crypto'

import * as db from 'zapatos/db'
import '@mono/common/lib/zapatos/schema'
import * as zs from 'zapatos/schema'

import { IContext } from '@mono/common/lib/context'
import { ErrCode } from '@mono/common/lib/error'
import { Meeting } from '@mono/common/lib/integration/zoom/api'
import Api from '@mono/common/lib/integration/zoom/api'
import { shortenLink } from '@mono/common/lib/shortlink'
import { DateTime } from 'luxon'

const MTAG = [ 'telenutrition', 'scheduling', 'zoom' ]

const TOPIC = 'Foodsmart telenutrition visit.'

const dynamicZoomLinks = true

function generatePasscode(): string {
  const length = 6
  
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz'
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '123456789'

  const sequences = [
    lowerChars,
    digits,
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm'
  ]
  const characters = [lowerChars, upperChars, digits].join('') + '0'

  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = randomInt(0, characters.length);
    password += characters.charAt(randomIndex);
  }

  if (password.match(/[1-9]/) === null) {
    //
    // Need at least one digit 1-9.
    //
    const randomDigitIndex = randomInt(0, digits.length)
    const ch = digits.charAt(randomDigitIndex)
    const index = randomInt(0, password.length)

    password = `${password.substring(0,index)}${ch}${password.substring(index+1)}`
  }

  // Can't contain 4 consecutive characters
  if (/(.)\1{3}/.test(password)) {
    return generatePasscode() // try again
  }

  // Can't contain sequence of 4 characters
  const lowerPassword = password.toLowerCase()
  for (let i=0; i<lowerPassword.length-4; i++) {
    const seg = lowerPassword.substring(i, i+4)
    if (sequences.some(seq => seq.includes(seg))) {
      return generatePasscode() // try again
    }
  }
  
  return password;
}

export interface ZoomMeeting extends Meeting {
  shortJoinUrl: string,
  phone?: string
}

export type CreateMeetingOptions = {
  appointmentId: number,
  patientId: number,
  startTimestamp: Date,
  duration: number,
  code?: string
} & ({ providerId: number } | { email: string })

export async function createMeeting(context: IContext, options: CreateMeetingOptions): Promise<Result<ZoomMeeting, ErrCode>> {
  const { config, logger, store: { reader } } = context
  const TAG = [ ...MTAG, 'createMeeting' ]

  const shortenUrl = async (joinUrl: string) => {
    const shortenLinkResult = await shortenLink(context, joinUrl, {
      expires: DateTime.fromJSDate(options.startTimestamp).diffNow().plus({ days: 2 }),
      length: 16,
      code: options.code
    })
  
    if (shortenLinkResult.isErr()) {
      logger.error(context, TAG, 'Error shortening link.', {
        options,
        joinUrl,
        error: shortenLinkResult.error,
      })
      return joinUrl
    }
    return  shortenLinkResult.value.url
  }

  try {
    if (dynamicZoomLinks && config.common.zoom === undefined) {
      logger.error(context, TAG, 'Zoom configuration not found.', {
        options,
      })

      return err(ErrCode.INVALID_CONFIG)
    }

    const pool = await reader()
    const { appointmentId, duration, patientId, startTimestamp } = options

    let provider: zs.telenutrition.schedule_provider.JSONSelectable | undefined
    if ('providerId' in options) {

      provider = await db.selectOne('telenutrition.schedule_provider', {
        provider_id: options.providerId,
      }).run(pool)

      if (provider === undefined) {
        logger.error(context, TAG, 'Provider not found.', {
          options,
        })

        return err(ErrCode.STATE_VIOLATION)
      }

      if (!provider.zoom_uid) {
        logger.warn(context, TAG, 'Missing zoom uid for provider', { providerId: provider.provider_id })
        if (!config.isProduction) {
          return ok({
            id: 0,
            joinUrl: 'https://support.foodsmart.co/hc/en-us',
            shortJoinUrl: 'https://support.foodsmart.co/hc/en-us',
          })
        }
      }
    }

    const phone = provider?.zoom_phone ?? undefined

    if (!dynamicZoomLinks) {

      const pmi = provider?.zoom_pmi
      if (pmi) {
        const joinUrl = `https://zipongo.zoom.us/j/${pmi}`;
        // const shortJoinUrl = await shortenUrl(joinUrl)

        return ok({
          id: pmi,
          joinUrl: joinUrl,
          shortJoinUrl: joinUrl,
          phone
        })
      }
      logger.error(context, TAG, "missing pmi for provider", { providerId: provider?.provider_id })
      return err(ErrCode.STATE_VIOLATION)
    }

    let zoomUid = ('email' in options ? options.email : provider?.zoom_uid) || provider?.email || config.common.zoom.accountOwner
    if (config.isStaging) {
      zoomUid = config.common.zoom.accountOwner
    }

    const patient = await db.selectOne('telenutrition.schedule_patient', {
      patient_id: patientId,
    }).run(pool)

    if (patient === undefined) {
      logger.error(context, TAG, 'Patient not found.', {
        patientId,
        options,
      })

      return err(ErrCode.STATE_VIOLATION)
    }

    const apiCreateOptions = {
      duration,
      password: generatePasscode(),
      scheduleFor: zoomUid,
      startTime: startTimestamp,
      timezone: patient.timezone,
      topic: TOPIC,
      tracking: {
        appointment_id: String(appointmentId),
        ...(provider && { provider_id: String(provider.provider_id) }),
        patient_id: String(patientId),
      }
    }

    const result = await Api.createMeeting(context, zoomUid, apiCreateOptions)

    if (result.isErr()) {
      logger.error(context, TAG, 'Error creating zoom meeting.', {
        createMeetingOptions: options,
        apiCreateOptions,
      })

      return err(result.error)
    }

    const meeting = result.value

    logger.debug(context, TAG, 'Meeting created.', {
      createMeetingOptions: options,
      apiCreateOptions,
      meeting,
    })

    const shortJoinUrl = await shortenUrl(meeting.joinUrl)

    return ok({
      ...meeting,
      shortJoinUrl,
      phone
    })
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export async function deleteMeeting(context: IContext, meetingId: string): Promise<Result<boolean, ErrCode>> {
  if (!dynamicZoomLinks) {
    return ok(true)
  }
  return Api.deleteMeeting(context, meetingId)
}

export default {
  createMeeting,
  deleteMeeting
}
