import { Err, Result, err, ok } from 'neverthrow'
import {DateTime, DurationLike} from 'luxon'
import * as crypto from 'crypto'
import { DynamoDBServiceException, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb"

import { IContext } from './context'
import { ErrCode } from './error'

interface ShortenLinkOptions {
  expires?: DurationLike,
  length?: number,
  code?: string,
}

interface ShortenLinkResult {
  url: string,
  code: string,
}

// Alphabet of unambigous characters to reduce confusion between similar looking letters/numbers
const ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY34679'
const CODE_REGEX = new RegExp(`^[${ALPHABET}]{8,32}$`, 'i')
const TABLE_NAME = 'common_shortlink'

function encode(context: IContext, url: string): Result<string, ErrCode> {
  const {config, logger} = context

  try {
    const base = ALPHABET.length
    const hash32 = crypto.createHmac('sha256', config.common.shortlink.salt).update(url).digest('hex')
    const bignum = BigInt(`0x${hash32}`)
    const code = bignum.toString(base).split('').map(digit => ALPHABET[parseInt(digit, base)]).join('')

    return ok(code)
  } catch(e) {
    logger.exception(context, 'encode', e, {url})
    return err(ErrCode.EXCEPTION)
  }
}

export async function shortenLink(context: IContext, url: string, options: ShortenLinkOptions = {}): Promise<Result<ShortenLinkResult, ErrCode>> {
  const {config, logger, cache} = context

  const length = options.length === undefined ? 8 : Math.min(Math.max(8, options.length), 32)
  const expires = options.expires === undefined ? {years: 10} : options.expires

  try {
    let code = options.code
    if (!code) {
      const resultCode = encode(context, url)
      if (resultCode.isErr()) {
        logger.error(context, 'shortenLink', 'error encoding the shortlink url', {url})
        return err(resultCode.error)
      }

      code = resultCode.value.slice(0, length)
    }

    const dynamoPutCommand = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        'id': {S: code},
        'url': {S: url},
        'expires': {N: String(DateTime.now().plus(expires).toUnixInteger())}
      }
    })

    await cache.send(dynamoPutCommand)
    
    return ok({code, url: `${config.common_cdk.common_network.alb.protocol}://${config.common_cdk.common_network.alb.domain}/l/${code}`})
  } catch(e) {
    logger.exception(context, 'shortenLink', e, {url})
    return err(ErrCode.EXCEPTION)
  }
}

export async function resolveLink(context: IContext, code: string): Promise<Result<string, ErrCode>> {
  const {config, logger, cache} = context

  code = code.toUpperCase()

  try {
    const dynamoGetCommand = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: {'id': {S: code}},
      AttributesToGet: ['url'],
    })
    const response = await cache.send(dynamoGetCommand)

    console.log(response)

    const item = response.Item

    if (item === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    const url = item?.url?.S

    if (url === undefined) {
      return err(ErrCode.NOT_FOUND)
    }

    console.log(url)

    return ok(url)
  } catch(e) {
    if (e instanceof DynamoDBServiceException) {
      logger.error(context, 'resolveLink', `${e?.$fault} error calling dynamodb GetItemCommand`, { error: { code: e?.$response?.statusCode, message: e?.message }, table: TABLE_NAME, key: `id: ${code}`})
    }

    logger.exception(context, 'resolveLink', e, {id: code})
    
    return err(ErrCode.EXCEPTION)
  }
}

export function validateCode(code: string): boolean {
  return CODE_REGEX.test(code)
}

export default {
  shortenLink,
  resolveLink,
  validateCode,
}