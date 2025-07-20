import { err, ok, Result } from 'neverthrow'
import { ErrCode } from '../../error'
import { IContext } from '../../context'
import * as PhoneValidation from 'phone'
import * as _ from 'lodash'
import Api from './api'


const MTAG = [ 'common', 'integration', 'customerio', 'service' ]

export enum CioEventType {
  Page = 'page',
  Screen = 'screen',
  Event = 'event',
}

export interface EventRecord {
  type?: CioEventType,
  name: string,
  data?: Record<string, string | string[] | number | number[] | boolean | Record<string, string>>
}

export interface CustomerRecord {
  id: string;
  member_id?: string;
  eligible_id?: number,
  user_id?: number,
  identity_id?: number,
  email?: string;
  phone?: string;
  firstname?: string;
  lastname?: string;
  zip_code?: string;
  state?: string;
  account_id?: number;
  organization_id?: number;
  suborganization_id?: string;
  lang?: string;
  appointment_date?: Date,
  is_teleapp_user?: boolean,
  is_teleapp_patient?: boolean,
  last_appt_date?: number,
  next_appt_date?: number,
  enrollment_url?: string,
  programs?: string[],
}



export interface CustomerAttributes {
  email?: string;
  phone?: string;
  firstname?: string;
  lastname?: string;
  appointment_date?: number,
}

export function mapCustomerAttributes(customer: CustomerRecord): CustomerAttributes {
  return {
    ...(customer.email && {email: customer.email}),
    ...(customer.phone && {phone: customer.phone}),
    ...(customer.firstname && {firstname: customer.firstname}),
    ...(customer.lastname && {lastname: customer.lastname}),
    ...(customer.appointment_date && {appointment_date: customer.appointment_date.getTime()/1000|0}),
  }
}


export async function updateCustomer(context: IContext, identifier: string, customer: CustomerRecord): Promise<Result<void, ErrCode>> {
  const TAG = [...MTAG, 'updateCustomer']
  const {logger} = context

  try {
    if (customer.phone !== undefined) {
      const validation = PhoneValidation.phone(customer.phone as string, {country: 'USA'})

      customer.phone = validation.isValid ? validation.phoneNumber : undefined
    }

    const attributes = mapCustomerAttributes(customer);

    const customerResult = await Api.addOrUpdateCustomer(context, identifier,
      {
        _update: true,
        created_at: parseInt(String(Date.now() / 1000)),
      }, attributes)    

    if (customerResult.isErr()) {
      logger.error(context, TAG, 'Error updating customer.', {
        error: customerResult.error,
        customer,
        attributes,
      })

      return err(customerResult.error)
    }

    return ok(undefined)
  }
  catch (e) {
    logger.exception(context, TAG, e)

    return err(ErrCode.EXCEPTION)
  }
}

export interface SendEventOptions {
  event: EventRecord,
  customer: CustomerRecord,
}

async function sendEvent(context: IContext, identifier: string, options: SendEventOptions): Promise<Result<void, ErrCode>> {
  const TAG = [...MTAG, 'sendEvent']
  const {logger} = context

  try {
    const {event, customer} = options

    if (customer.phone !== undefined) {
      const validation = PhoneValidation.phone(customer.phone as string, {country: 'USA'})

      customer.phone = validation.isValid ? validation.phoneNumber : undefined
    }

    const attributes = mapCustomerAttributes(customer);

    const customerResult = await Api.addOrUpdateCustomer(context, identifier,
      {
        _update: true,
        created_at: parseInt(String(Date.now() / 1000)),
      }, attributes)    

    if (customerResult.isErr()) {
      logger.error(context, TAG, 'Error updating customer.', {
        error: customerResult.error,
        customer,
        attributes,
      })

      return err(customerResult.error)
    }

    const eventResult = await Api.createEvent(context, identifier, event)

    if (eventResult.isErr()) {
      logger.error(context, TAG, 'Error sending event.', {
        customer,
        identifier,
        event,
      })

      return err(eventResult.error)
    }

    return ok(undefined)
  } catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


export interface CustomerIdentifiers {
  eligibleId?: number,
  goUserId?: number,
  teleappUserId?: number,
  identityId?: number,
}

export function createCustomerIdentifer(context: IContext, identifiers: CustomerIdentifiers): Result<string, ErrCode> {
  const {logger} = context

  if (identifiers.identityId !== undefined) {
    return ok(`id:${identifiers.identityId}`)
  }

  if (identifiers.eligibleId !== undefined) {
    return ok(`eligible_id:${identifiers.eligibleId}`)
  }

  logger.error(context, 'createCustomerIdentifer', 'unable to create a unique cio identifer from record data', {identifiers})
  return err(ErrCode.INVALID_DATA)
}

async function updateCollection(context: IContext, name: string, data: object[]): Promise<Result<boolean, ErrCode>> {
  const TAG = [...MTAG, 'updateCollection']
  const {logger} = context

  const getResult = await Api.getCollections(context)
  if (getResult.isErr()) {
    return err(getResult.error)
  }

  const match = getResult.value.find(e => e.name == name)

  if (!match) {
    await Api.createCollection(context, name, data)
  } else {
    await Api.updateCollection(context, match.id, data)
  }

  return ok(true)
}


export default {
  updateCustomer,
  sendEvent,
  updateCollection,
  createCustomerIdentifer,
}
