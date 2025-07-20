import { Result, err, ok } from 'neverthrow'

import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import { FederationIdentityRecord, AppIdentityRecord, IdentityRecord, ProviderIdRecord, FederationSource, IdentityAttributes, EmployeeIdentityRecord } from '../types'
import { IdentityStoreRecord, createIdentity, selectIdentity, updateIdentity } from './store'
import { isFullyIdentified } from '../user/service'

export { IdentityStoreRecord, createIdentity, updateIdentity }

const MTAG = [ 'telenutrition', 'iam', 'identity', 'service' ]

export const FederationSourceName: {[k in FederationSource]: string} = {
  [FederationSource.Foodapp]: 'foodapp',
  [FederationSource.QcsLead]: 'qcs',
  [FederationSource.Referral]: 'referral',
  [FederationSource.Okta]: 'okta',
  [FederationSource.AthenaPatient]: 'athena-patient',
  [FederationSource.CallCenter]: 'cc',
  [FederationSource.CallCenterAgent]: 'cca',
  [FederationSource.CallCenterDial]: 'ccd',
  [FederationSource.Retool]: 'retool',
}

export function isFederationIdentity(identity: IdentityRecord): identity is FederationIdentityRecord {
  return 'fid' in identity
}

export function isAppIdentity(identity: IdentityRecord): identity is AppIdentityRecord {
  return 'uid' in identity
}

export function isProviderIdentity(identity: IdentityRecord): identity is ProviderIdRecord {
  return isFederationIdentity(identity) && identity.src === FederationSource.Okta
}

export function isEmployeeIdentity(identity: IdentityRecord): identity is EmployeeIdentityRecord {
  return 'fid' in identity && (identity.src === FederationSource.Okta || identity.src === FederationSource.CallCenterAgent || identity.src === FederationSource.CallCenterDial || identity.src === FederationSource.Retool)
}

export function formatFederationId(identity: FederationIdentityRecord): string {
  return `${FederationSourceName[identity.src]}:${identity.fid}`
}

export async function getIdentity(context: IContext, identity: IdentityAttributes): Promise<Result<IdentityStoreRecord, ErrCode>> {
  const { logger } = context
  const TAG = [ ...MTAG, 'getIdentity' ]

  try {
    const result = await selectIdentity(context, identity)

    if (result.isOk()) {
      return ok(result.value)
    }
    else {
      return err(result.error)
    }
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export default {
  isFederationIdentity,
  isAppIdentity,
  isProviderIdentity,
  getIdentity,
}