import { Result, err, ok } from 'neverthrow'
import { DateTime, DurationLike } from 'luxon'
import { 
  DynamoDBServiceException, 
  GetItemCommand, 
  GetItemCommandOutput, 
  PutItemCommand, 
  PutItemCommandOutput, 
  UpdateItemCommand, 
  UpdateItemCommandInput, 
  UpdateItemCommandOutput 
} from "@aws-sdk/client-dynamodb"

import { IContext } from './context'
import { ErrCode } from './error'

const TABLE_NAME = 'common_ratelimit'
const DEFAULT_DURATION: DurationLike = { hours: 1 }
const DEFAULT_ATTEMPTS = 100

interface HasExceededLimitOptions {
  attempts: number,
  duration: DurationLike,
}

interface DynamoGetItemResult {
  dynamoResponseGet?: GetItemCommandOutput,
  dynamoExceptionGet?: DynamoDBServiceException | any,
}

interface DynamoPutItemResult {
  dynamoResponsePut?: PutItemCommandOutput,
  dynamoExceptionPut?: DynamoDBServiceException | any,
}

interface DynamoUpdateItemResult {
  dynamoResponseUpdate?: UpdateItemCommandOutput,
  dynamoExceptionUpdate?: DynamoDBServiceException | any,
}

/**
 * exceeded
 * @param context 
 * @param key 
 * @param options 
 * @returns true, if ratelimit exceeded
 */
export async function hasExceededLimit(context: IContext, key: string, options: HasExceededLimitOptions = { attempts: DEFAULT_ATTEMPTS, duration: DEFAULT_DURATION }): Promise<Result<boolean, ErrCode>> {
  const { logger, cache } = context

  const now = DateTime.now()

  const dynamoGetItemCommand = async (): Promise<DynamoGetItemResult> => {
    try {
      const input = {
        TableName: TABLE_NAME,
        Key: {
          'key': {
            S: key
          }
        }
      }
      const command = new GetItemCommand(input)
      const response = await cache.send(command)

      return { dynamoResponseGet: response }
    } catch (e) {
      return { dynamoExceptionGet: e }
    }
  }

  const dynamoPutItemCommand = async (): Promise<DynamoPutItemResult> => {
    try {
      const input = {
        TableName: TABLE_NAME,
        Item: { 
          key: { 
            S: key 
          }, 
          count: { 
            N: String(1) 
          }, 
          expires: { 
            N: String(now.plus(options.duration).toUnixInteger()) 
          } 
        }
      }
      const command = new PutItemCommand(input)
      const response = await cache.send(command)

      return { dynamoResponsePut: response }
    } catch (e) {
      return { dynamoExceptionPut: e }
    }
  }

  const dynamoUpdateItemCommand = async (input: UpdateItemCommandInput): Promise<DynamoUpdateItemResult> => {
    try {
      const command = new UpdateItemCommand(input)
      const response = await cache.send(command)

      return { dynamoResponseUpdate: response }
    } catch (e) {
      return { dynamoExceptionUpdate: e }
    }
  }

  try {
    // Check if there is an existing ratelimit record for the key
    const { dynamoResponseGet, dynamoExceptionGet } = await dynamoGetItemCommand()
    
    if (dynamoExceptionGet || dynamoResponseGet === undefined) {
      logger.error(
        context, 
        'hasExceededLimit', 
        `${dynamoExceptionGet?.$fault} error calling dynamodb GetItemCommand`, 
        { 
          error: { 
            code: dynamoExceptionGet?.$response?.statusCode, 
            message: dynamoExceptionGet?.message 
          }, 
          table: TABLE_NAME, 
          key: `key: ${key}` 
        }
      )
      
      return err(ErrCode.SERVICE)
    }

    const dynamoItem = dynamoResponseGet.Item

    // If there is not an existing ratelimit record, then create a new record
    if (dynamoItem === undefined) {
      const { dynamoResponsePut, dynamoExceptionPut } = await dynamoPutItemCommand()

      if (dynamoExceptionPut || dynamoResponsePut === undefined) {
        logger.error(
          context, 
          'hasExceededLimit', 
          `${dynamoExceptionPut?.$fault} error calling dynamodb PutItemCommand`, 
          { 
            error: { 
              code: dynamoExceptionPut?.$response?.statusCode, 
              message: dynamoExceptionPut?.message 
            }, 
            table: TABLE_NAME, key: `key: ${key}` 
          }
        )

        return err(ErrCode.SERVICE)
      }

      return ok(false)
    }

    const expires = dynamoItem.expires.N === undefined ? now.plus(options.duration).toUnixInteger() : parseInt(dynamoItem.expires.N, 10)
    const remaining = expires - now.toUnixInteger()

    // The ratelimit has expired, update the ratelimit for the next time window
    if (remaining < 0) {
      const dynamoPutInput = {
        TableName: TABLE_NAME,
        Key: { key: { S: key } },
        UpdateExpression: "SET #count = :amount, expires = :expires",
        ExpressionAttributeValues: {
          ':expires': {
            N: String(now.plus(options.duration).toUnixInteger())
          },
          ':amount': {
            N: String(1),
          }
        },
        ExpressionAttributeNames: {
          '#count': 'count'
        },
      }
      const { dynamoResponseUpdate, dynamoExceptionUpdate } = await dynamoUpdateItemCommand(dynamoPutInput)

      if (dynamoExceptionUpdate || dynamoResponseUpdate === undefined) {
        logger.error(
          context, 
          'hasExceededLimit', 
          `${dynamoExceptionUpdate?.$fault} error calling dynamodb UpdateItemCommand`, 
          { 
            error: { 
              code: dynamoExceptionUpdate?.$response?.statusCode, 
              message: dynamoExceptionUpdate?.message 
            }, 
            table: TABLE_NAME, 
            key: `key: ${key}` 
          }
        )

        return err(ErrCode.SERVICE)
      }

      return ok(false)
    }

    const count = dynamoItem.count.N === undefined ? 1 : parseInt(dynamoItem.count.N)

    // The count would exceed the number of attemps, return false
    if (count >= options.attempts) {
      return ok(true)
    }

    // Increment the ratelimit and return true
    const inputUpdateIncrement = {
      TableName: TABLE_NAME,
      Key: { key: { S: key } },
      UpdateExpression: "SET #count = #count + :amount",
      ExpressionAttributeNames: {
        '#count': 'count'
      },
      ExpressionAttributeValues: {
        ':amount': {
          N: String(1),
        }
      }
    }
    const { dynamoResponseUpdate, dynamoExceptionUpdate } = await dynamoUpdateItemCommand(inputUpdateIncrement)

    if (dynamoExceptionUpdate || dynamoResponseUpdate === undefined) {
      logger.error(
        context, 
        'hasExceededLimit', 
        `${dynamoExceptionUpdate?.$fault} error calling dynamodb UpdateItemCommand for rate limit increment`, 
        { 
          error: 
          { 
            code: dynamoExceptionUpdate?.$response?.statusCode, 
            message: dynamoExceptionUpdate?.message 
          }, 
          table: TABLE_NAME, 
          key: `key: ${key}` 
        }
      )

      return err(ErrCode.SERVICE)
    }

    return ok(false)
  } catch (e) {
    logger.exception(context, 'hasExceededLimit', e)
    return err(ErrCode.EXCEPTION)
  }
}

export default {
  hasExceededLimit
}