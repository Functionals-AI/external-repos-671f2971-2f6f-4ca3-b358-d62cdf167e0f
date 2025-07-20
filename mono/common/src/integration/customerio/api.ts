import { err, ok, Result } from 'neverthrow'
import { ErrCode } from '../../error'
import { IContext } from '../../context'
import axios from 'axios'
import * as _ from 'lodash'
import { CioEventType, EventRecord } from './service'

const MTAG = ['common', 'integration', 'customerio', 'api']

const API_ENDPOINT = `https://api.customer.io/v1`
const BETA_ENDPOINT = `https://beta-api.customer.io/v1/api`
const TRACK_V1_ENDPOINT = `https://track.customer.io/api/v1`
const TRACK_V2_ENDPOINT = `https://track.customer.io/api/v2`

export interface SegmentApiRecord {
  id: number,
  name: string,
  description?: string,
}

export type NewSegmentApiRecord = Omit<SegmentApiRecord, 'id'>

export interface CollectionApiRecord {
  id: number,
  name: string,
}

export type SegmentIdType = 'email' | 'id' | 'cio_id'

async function createSegment(context: IContext, segment: NewSegmentApiRecord): Promise<Result<SegmentApiRecord, ErrCode>> {
  const TAG = [...MTAG, 'createSegment']
  const { logger, config } = context

  try {
    const { status, data } = await axios.post(`${API_ENDPOINT}/segments`, { segment }, { headers: { 'Authorization': `Bearer ${config.marketing.customerio.api_token}` } })

    if (status !== 200) {
      logger.error(context, TAG, `Error creating segment`, { httpCode: status })
      return err(ErrCode.SERVICE)
    }

    const record: SegmentApiRecord = {
      id: data.segment.id,
      name: data.segment.name,
      description: data.segment.description,
    }

    return ok(record)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

async function getSegment(context: IContext): Promise<Result<SegmentApiRecord[], ErrCode>> {
  const TAG = [...MTAG, 'getSegment']
  const { logger, config } = context

  try {
    const { status, data } = await axios.get(`${API_ENDPOINT}/segments`, { headers: { 'Authorization': `Bearer ${config.marketing.customerio.api_token}` } })
    if (status !== 200) {
      logger.error(context, TAG, `Error fetching segment`, { httpCode: status })
      return err(ErrCode.SERVICE)
    }
    const records: SegmentApiRecord[] = await data.segments.map((segment: any) => ({
      id: segment.id,
      name: segment.name,
      description: segment.description,
    }));
    return ok(records);
  }
  catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

async function listSegmentMembership(context: IContext, segmentId: number): Promise<Result<string[], ErrCode>> {
  const TAG = [...MTAG, 'listSegmentMembership']
  const { logger, config } = context

  try {
    let ids: string[] = []
    let start: number = 0

    do {
      const { status, data } = await axios.post(`${BETA_ENDPOINT}/segments/${segmentId}/membership&start=${start}&limit=30000`,
        { headers: { 'Authorization': `Bearer ${config.marketing.customerio.api_token}` } })

      if (status !== 200) {
        logger.error(context, TAG, `Error fetching segment members`, { segmentId, httpCode: status })
        return err(ErrCode.SERVICE)
      }

      ids = [ids, ...data.ids]
      start = data.next
    } while (start)

    return ok(ids)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export async function addSegmentMembers(context: IContext, segmentId: number, ids: string[], idType: SegmentIdType = 'id'): Promise<Result<void, ErrCode>> {
  const TAG = [...MTAG, 'addSegmentMembers']
  const { logger, config } = context

  try {
    const chunks = _.chunk(ids, 1000)

    for (let chunk of chunks) {
      const { status, data } = await axios.post(`${TRACK_V1_ENDPOINT}/segments/${segmentId}/add_customers`,
        { ids: chunk },
        { headers: { 'Authorization': `Basic ${config.marketing.customerio.tracking_token}` }, params: { id_type: idType } }
      )

      if (status !== 200) {
        logger.error(context, TAG, `Error adding segment members`, { segmentId, httpCode: status })
        return err(ErrCode.SERVICE)
      }
      logger.info(context, TAG, `Requested addition of ${chunk.length} id(s) to CIO segment ${segmentId}`, { response_data: data })
    }

    return ok(undefined)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

async function removeSegmentMembers(context: IContext, segmentId: number, ids: string[]): Promise<Result<void, ErrCode>> {
  const TAG = [...MTAG, 'removeSegmentMembers']
  const { logger, config } = context

  try {
    const chunks = _.chunk(ids, 1000)

    for (let chunk of chunks) {
      const { status, data } = await axios.post(`${TRACK_V1_ENDPOINT}/segments/${segmentId}/remove_customers`,
        { ids: chunk },
        { headers: { 'Authorization': `Basic ${config.marketing.customerio.tracking_token}` } }
      )

      if (status !== 200) {
        logger.error(context, TAG, `Error removing segment members`, { segmentId, httpCode: status })
        return err(ErrCode.SERVICE)
      }
      logger.info(context, TAG, `Requested removal of ${chunk.length} id(s) from CIO segment ${segmentId}`, { response_data: data })
    }

    return ok(undefined)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

export interface IAddOrUpdateCustomerOptions {
  id?: string,
  anonymous_id?: string,
  email?: string,
  created_at?: number,
  _update?: boolean,
}

export async function addOrUpdateCustomer(context: IContext, identifier: string, options: IAddOrUpdateCustomerOptions, attributes?: object): Promise<Result<void, ErrCode>> {
  const TAG = [...MTAG, 'addOrUpdateCustomer']
  const { logger, config } = context

  try {
    const payload = {
      ...options,
      ...attributes,
    }
    const uri = `${TRACK_V1_ENDPOINT}/customers/${identifier}`
    const { status, data } = await axios.put(
      uri,
      payload,
      { headers: { 'Authorization': `Basic ${config.marketing.customerio.tracking_token}` } }
    )

    logger.debug(context, TAG, `sent cio add or update api request`, { payload })

    if (status !== 200) {
      logger.error(context, TAG, `Error creating event`, { httpCode: status })
      return err(ErrCode.SERVICE)
    }

    return ok(undefined)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


async function createEvent(context: IContext, identifier: string, event: EventRecord): Promise<Result<void, ErrCode>> {
  const TAG = [...MTAG, 'createEvent']
  const { logger, config } = context

  try {
    if (event.type === undefined) {
      event.type = CioEventType.Event
    }

    const uri = `${TRACK_V1_ENDPOINT}/customers/${identifier}/events`
    const { status, data } = await axios.post(
      uri,
      event,
      { headers: { 'Authorization': `Basic ${config.marketing.customerio.tracking_token}` } }
    )

    if (status !== 200) {
      logger.error(context, TAG, `Error creating event`, { httpCode: status })
      return err(ErrCode.SERVICE)
    }

    logger.debug(context, TAG, 'sent cio event', { uri, event })

    return ok(undefined)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

async function updateCollection(context: IContext, id: number, data: object[]): Promise<Result<void, ErrCode>> {
  const TAG = [...MTAG, 'updateCollection']
  const { logger, config } = context

  try {
    const uri = `${BETA_ENDPOINT}/collections/${id}/content`
    const { status } = await axios.put(
      uri,
      data,
      {
        headers: { 'Authorization': `Bearer ${config.marketing.customerio.api_token}` },
        validateStatus: () => true,
      },
    )

    if (status !== 200) {
      logger.error(context, TAG, `Error updating cio collection`, { id, httpCode: status })
      return err(ErrCode.SERVICE)
    }

    logger.debug(context, TAG, 'updated cio collection', { uri, data })

    return ok(undefined)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


async function createCollection(context: IContext, name: string, data: object[]): Promise<Result<void, ErrCode>> {
  const TAG = [...MTAG, 'createCollection']
  const { logger, config } = context

  try {
    const payload = {
      name,
      data
    }
    const uri = `${BETA_ENDPOINT}/collections`
    const { status } = await axios.post(
      uri,
      payload,
      {
        headers: { 'Authorization': `Bearer ${config.marketing.customerio.api_token}` },
        validateStatus: () => true,
      },
    )

    if (status !== 200) {
      logger.error(context, TAG, `Error creating cio collection`, { name, httpCode: status })
      return err(ErrCode.SERVICE)
    }

    logger.debug(context, TAG, 'created cio collection', { uri, data })

    return ok(undefined)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

async function getCollections(context: IContext): Promise<Result<CollectionApiRecord[], ErrCode>> {
  const TAG = [...MTAG, 'getCollections']
  const { logger, config } = context

  try {
    const uri = `${BETA_ENDPOINT}/collections`
    const { status, data } = await axios.get(
      uri,
      {
        headers: { 'Authorization': `Bearer ${config.marketing.customerio.api_token}` },
        validateStatus: () => true,
      },
    )

    if (status !== 200) {
      logger.error(context, TAG, `Error getting cio collections`, { httpCode: status })
      return err(ErrCode.SERVICE)
    }

    return ok(data.collections || [])
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

type RawMessageOptions = {
  from: string,
  body: string,
  subject: string,
}

type TemplateMessageOptions = {
  transactional_message_id: number | string,
  message_data: Record<string, string>,
}

export type SendMessageOptions = {
  to: string,
  identifiers: { id: string } | { email: string } | { cio_id: string }
} & (RawMessageOptions | TemplateMessageOptions)

async function sendEmail(context: IContext, options: SendMessageOptions): Promise<Result<boolean, ErrCode>> {
  const TAG = [...MTAG, 'sendEmail']
  const { logger, config } = context
  try {
    const uri = `${API_ENDPOINT}/send/email`
    const { status } = await axios.post(
      uri,
      options,
      {
        headers: { 'Authorization': `Bearer ${config.marketing.customerio.api_token}` },
        validateStatus: () => true,
      },
    )

    if (status !== 200) {
      logger.error(context, TAG, `Error sending cio email`, { httpCode: status, options })
      return err(ErrCode.SERVICE)
    }

    return ok(true)
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


export type IdentifyPersonRequest = {
  type: 'person'
  identifiers: { id: string } | { email: string } | { cio_id: string }
  action: 'identify'
  attributes?: object
  cio_relationships?: Array<{
    identifiers: {
      object_type_id: string
      object_id: string
    }
  }>
}

export type BatchRequest = {
  batch: Array<IdentifyPersonRequest>
}

export type BatchResponse = {
  errors: Array<{
    reason: string
    field: string
    message: string
  }>
}

async function batch(context: IContext, request: BatchRequest): Promise<Result<BatchResponse, ErrCode>> {
  const TAG = [...MTAG, 'batch']
  const { logger, config } = context
  try {
    const uri = `${TRACK_V2_ENDPOINT}/batch`
    const { status, data } = await axios.post<BatchResponse>(
      uri,
      request,
      {
        headers: { 'Authorization': `Basic ${config.marketing.customerio.tracking_token}` },
        validateStatus: () => true,
      },
    )

    if (status !== 200 && status !== 207) {
      logger.error(context, TAG, `Error posting to customer io batch endpoint`, { status, request, data })
      return err(ErrCode.SERVICE)
    }

    return ok({
      errors: data?.errors ?? []
    })
  } catch (e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}


export default {
  createSegment,
  getSegment,
  listSegmentMembership,
  addSegmentMembers,
  removeSegmentMembers,
  createEvent,
  addOrUpdateCustomer,
  updateCollection,
  createCollection,
  getCollections,
  sendEmail,
  batch,
}