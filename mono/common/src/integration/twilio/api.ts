import { Logger } from "../../"
import { IContext } from "../../context"
import { ErrCode } from "../../error"
import axios from "axios"
import { err, ok, Result } from "neverthrow"

const MTAG = Logger.tag()

export interface SendSMSOptions {
  from?: string,
  to: string,
  body: string,
}

export async function sendSMS(context: IContext, options: SendSMSOptions): Promise<Result<boolean, ErrCode>> {
  const TAG = [...MTAG, 'sendSMS']
  const { logger, config } = context

  try {
    if (!config.twilio.sid) {
      logger.error(context, TAG, 'Configuration missing for twilio')
      return err(ErrCode.NOT_FOUND)
    }

    const uri = `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountId}/Messages.json`

    const params = new URLSearchParams({
      From: options.from || config.twilio.senderNumber,
      To: options.to,
      Body: options.body
    })

    const { status, data } = await axios.post(uri,
      params,
      {
        auth: {
          username: config.twilio.accountId,
          password: config.twilio.authToken
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        validateStatus: () => true,
      },
    )

    if (status >= 300) {
      logger.error(context, TAG, `api call failed`, { status, data })
      return err(ErrCode.SERVICE)
    }

    return ok(true)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  sendSMS,
}