import { Result } from 'neverthrow'
import { ErrCode } from '../error'
import {IContext} from '../context'
import Store from './store'


async function getToken(context: IContext, name: string): Promise<Result<string, ErrCode>> {
  return Store.getToken(context, name)
}

async function updateToken(context: IContext, name: string, token: string): Promise<Result<string, ErrCode>> {
  return Store.updateToken(context, name, token)
}

export default {
  getToken,
  updateToken,
}