import Address from './address'
import Google from './google'
import Slack from './slack'
import Twilio from './twilio'

export { default as Google } from './google'
export { default as Slack } from './slack'
export { default as Twilio } from './twilio'

export default {
  Address,
  Google,
  Slack,
  Twilio
}