import { err, ok, Result } from 'neverthrow'
import { z } from 'zod'
import { phone } from 'phone'
import { Twilio } from 'twilio'

import { ErrCode } from '../../error'
import { IContext } from '../../context'
import Logger from '../../logger'

const MTAG = Logger.tag()

let client: Twilio | undefined

function getClient(context: IContext): Result<Twilio, ErrCode> {
  const { config: { common: { twilio }}, logger } = context
  const TAG = [ '...MTAG', 'getClient' ]

  if (client !== undefined) {
    return ok(client)
  }
  else {
    try {
      client = new Twilio(twilio?.sid, twilio?.authToken)

      return ok(client)
    }
    catch (e) {
      client = undefined
      logger.exception(context, TAG, e)

      return err(ErrCode.EXCEPTION)
    }
  }
}

//
// Twilio uses https://www.twilio.com/docs/glossary/what-e164.
// They provide an API endpoint to parse / validate endpoints.
// That's excessive. We use the 'phone' library for validation / formatting.
//

type APhoneNumber = string
type E164PhoneNumber = string

/**
 * Ensure 'number' is a US phone number in a flexible format, and return
 * it as an E164 to pass to the Twilio API. The 'phone' library is simply
 * used to validate and returns an E164 value if valid. Things are
 * limited to a valid US phone number.
 * 
 * @param context - App. context.
 * @param number - String that could be a phone number.
 * 
 * @returns {E164PhoneNumber} - Valid phone number in E164.
 */
function formatAndValidateNumber(context: IContext, number: string): Result<E164PhoneNumber, ErrCode> {
  try {
    const validation = phone(number, { country: 'USA' })

    if (validation.isValid) {
      return ok(validation.phoneNumber)
    }
    else {
      return err(ErrCode.INVALID_DATA)
    }
  }
  catch (e) {
    return err(ErrCode.EXCEPTION)
  }
}

export async function sendMessage(context: IContext, toNumber: APhoneNumber, body: string): Promise<Result<true, ErrCode>> {
  const { config: { common: { twilio }}, logger } = context
  const TAG = [ ...MTAG, 'sendMessage' ]

  try {
    const foodsmartPhoneNumber = twilio?.foodsmartPhoneNumber

    if (foodsmartPhoneNumber === undefined) {
      logger.error(context, TAG, 'Foodsmart phone number is not configured.')

      return err(ErrCode.NOT_FOUND) // Perhaps a better error code?
    }
    const formattedFoodsmartPhoneNumberResult = formatAndValidateNumber(context, foodsmartPhoneNumber as string)

    if (formattedFoodsmartPhoneNumberResult.isErr()) {
      logger.error(context, TAG, 'Foodsmart to E164 phone number conversion failure.', {
        foodsmartPhoneNumber,
      })

      return err(formattedFoodsmartPhoneNumberResult.error)
    }

    const formattedFoodsmartPhoneNumber = formattedFoodsmartPhoneNumberResult.value

    const formattedToNumberResult = formatAndValidateNumber(context, toNumber as string)

    if (formattedToNumberResult.isErr()) {
      logger.error(context, TAG, 'Validation and / or phone number format error. Must be valid US phone number.', {
        toNumber,
      })

      return err(formattedToNumberResult.error)
    }

    const formattedToNumber = formattedToNumberResult.value

    const clientResult = getClient(context)

    if (clientResult.isErr()) {
      logger.error(context, TAG, 'Error getting Twilio client.')

      return err(clientResult.error)
    }
    const client = clientResult.value

    const message = client.messages.create({
      from: formattedFoodsmartPhoneNumber,
      to: formattedToNumber,
      body,
    })

    return ok(true)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  sendMessage,
}