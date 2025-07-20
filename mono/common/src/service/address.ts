import axios from 'axios'
import { err, ok, Result } from 'neverthrow'
import { IContext } from '../context'
import { ErrCode } from '../error'
import Logger from '../logger'

const MTAG = Logger.tag()

async function resolveState(context: IContext, postalCode: string): Promise<Result<string, ErrCode>> {
  const TAG = [...MTAG, 'resolveState']
  const { config, logger } = context
  try {
    const params = [
      `auth-id=${config.smartystreets.id}`,
      `auth-token=${config.smartystreets.token}`,
      `zipcode=${postalCode}`,
    ].join('&')
  
    const { status, data } = await axios.get(`https://${config.smartystreets.endpoint}/lookup?${params}`)
  
    if (data.length) {
      const response = data[0]
  
      if (response.status === 'invalid_zipcode') {
        return err(ErrCode.INVALID_DATA)
      }
  
      if ('city_states' in response) {
        const cities = response.city_states
        if (cities.length) {
          return ok(cities[0].state_abbreviation)
        }
  
      } else {
        return err(ErrCode.NOT_FOUND)
      }
    }
    return err(ErrCode.SERVICE)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  resolveState,
}