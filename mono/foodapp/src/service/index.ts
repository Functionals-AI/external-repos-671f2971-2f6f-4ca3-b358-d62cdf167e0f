import Logger from '@mono/common/lib/logger'
import Api from '../api'
import { err, ok, Result } from 'neverthrow'
import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'

const MTAG = Logger.tag()

export interface RegisterUserOptions {
  username: string,
  password?: string,
  member_id: string,
  subdomain: string,
  is_password_hashed: boolean,
}

export async function registerUser(context: IContext, options: RegisterUserOptions): Promise<Result<number, ErrCode>> {
  const TAG = [...MTAG, 'registerUser']
  const {logger} = context

  try {
    const registerUserResult = await Api.registerUser(context, options)

    if (registerUserResult.isErr()) {
      return err(registerUserResult.error)
    }

    return ok(registerUserResult.value)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  registerUser,
}
