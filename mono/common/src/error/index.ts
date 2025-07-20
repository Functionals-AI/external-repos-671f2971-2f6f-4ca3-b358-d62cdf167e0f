import { IContext } from '../context';

export enum ErrCode {
  AUTHENTICATION,
  ARGUMENT_ERROR,
  CANCELLED,
  ENVIRONMENT_NOT_SUPPORTED,
  EXCEPTION,
  EXPIRATION,
  FORBIDDEN,
  INVALID_CONFIG,
  INVALID_DATA,
  INVALID_PAYMENT,
  INVALID_S3_URI,
  ALREADY_EXISTS,
  NOT_FOUND,
  NOT_IMPLEMENTED,
  SERVICE,
  STATE_VIOLATION,
  SUBSCRIPTION_ERROR,
  SUBSCRIPTION_EXISTS,
  SUBSCRIPTION_RESUBSCRIBED,
  TIMEOUT,
  UPLOAD_TO_S3_ERROR,
  INVALID_AGE,
  PATIENT_NOT_FOUND,
  PAYMENT_LIMIT_REACHED,
  CONFLICT,
  SLOT_NOT_AVAILABLE_FOR_BOOKING,
  PROVIDER_NO_DEPARTMENT,
  INVALID_PHONE,
  VISIT_FREQUENCY_REACHED,
  INVENTORY_DEPLETED,
  INITIAL_CHECKIN_REQUIRED,
  SLOT_OUTSIDE_BOOKABLE_RANGE,
}

export function getErrorCodeMessage(context: IContext, err: ErrCode): string {
  const { i18n } = context;

  const errorCodeMessage: { [key in ErrCode]: string } = {
    [ErrCode.AUTHENTICATION]: i18n.__('Invalid authentication'),
    [ErrCode.ARGUMENT_ERROR]: i18n.__('Argument error'),
    [ErrCode.CANCELLED]: i18n.__('Cancelled'),
    [ErrCode.ENVIRONMENT_NOT_SUPPORTED]: i18n.__('Environment not supported'),
    [ErrCode.EXCEPTION]: i18n.__('Unknown exception'),
    [ErrCode.EXPIRATION]: i18n.__('Expiration exceeded'),
    [ErrCode.FORBIDDEN]: i18n.__('Forbidden'),
    [ErrCode.INVALID_CONFIG]: i18n.__('Invalid config'),
    [ErrCode.INVALID_DATA]: i18n.__('Invalid data'),
    [ErrCode.INVALID_PAYMENT]: i18n.__('Invalid payment'),
    [ErrCode.INVALID_S3_URI]: i18n.__('Invalid S3 URI'),
    [ErrCode.ALREADY_EXISTS]: i18n.__('Already exists'),
    [ErrCode.NOT_FOUND]: i18n.__('Not found'),
    [ErrCode.NOT_IMPLEMENTED]: i18n.__('Not implemented'),
    [ErrCode.SERVICE]: i18n.__('Unknown API error'),
    [ErrCode.STATE_VIOLATION]: i18n.__('State violation'),
    [ErrCode.SUBSCRIPTION_ERROR]: i18n.__('Subscription error'),
    [ErrCode.SUBSCRIPTION_EXISTS]: i18n.__('Subscription exists error'),
    [ErrCode.SUBSCRIPTION_RESUBSCRIBED]: i18n.__('Subscription resubscribe error'),
    [ErrCode.TIMEOUT]: i18n.__('Timeout'),
    [ErrCode.UPLOAD_TO_S3_ERROR]: i18n.__('Upload to S3 error'),
    [ErrCode.INVALID_AGE]: i18n.__('Invalid age'),
    [ErrCode.PATIENT_NOT_FOUND]: i18n.__('Patient not found'),
    [ErrCode.PAYMENT_LIMIT_REACHED]: i18n.__('Payment limit reached'),
    [ErrCode.CONFLICT]: i18n.__('Conflict'),
    [ErrCode.SLOT_NOT_AVAILABLE_FOR_BOOKING]: i18n.__('Slot not available for booking'),
    [ErrCode.PROVIDER_NO_DEPARTMENT]: i18n.__('You have not been assigned to a department yet. Please reach out to your coordinator.'),
    [ErrCode.INVALID_PHONE]: i18n.__('Invalid phone number'),
    [ErrCode.VISIT_FREQUENCY_REACHED]: i18n.__('Visit frequency reached'),
    [ErrCode.INVENTORY_DEPLETED]: i18n.__('No inventory remaining'),
    [ErrCode.INITIAL_CHECKIN_REQUIRED]: i18n.__('Members must complete their initial visit before scheduling a follow up. If you are trying to schedule a new initial visit, please cancel or reschedule the previously scheduled visit.'),
    [ErrCode.SLOT_OUTSIDE_BOOKABLE_RANGE]: i18n.__('The chosen date is outside the allowed scheduling timeframe. Please choose a date within the next 3 months.'),
  };

  return errorCodeMessage[err] ?? i18n.__('Unknown error');
}

export function toErrCodeKey(err: ErrCode): string {
  return Object.keys(ErrCode)[Object.values(ErrCode).indexOf(err)];
}

export class ErrCodeError extends Error {
  code: ErrCode;
  constructor(code: ErrCode) {
    super(`Error code: ${code}`);
    this.code = code;
  }
}
