import { Result } from 'neverthrow'
import { ErrCode } from '../error'
import {IContext} from '../context'
import Store from './store'


async function fetchToken(context: IContext, name: string): Promise<Result<string, ErrCode>> {
  return Store.fetchSyncToken(context, name)
}

async function updateToken(context: IContext, name: string, token: string): Promise<Result<void, ErrCode>> {
  return Store.updateSyncToken(context, name, token)
}

export default {
  fetchToken,
  updateToken,
}