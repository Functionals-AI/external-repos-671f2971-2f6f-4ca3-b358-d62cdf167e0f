import Api, { isPatientEligible } from './api'
import Browser from './browser'
import Referral from './referral'

export { updateReferralStatus } from './referral'

export default {
  Api,
  Browser,
  Referral,
  isPatientEligible,
}
