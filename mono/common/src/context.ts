import * as mysql from 'mysql2/promise'
import Config from './config'
import Logger from './logger'
import * as crypto from 'crypto'
import * as db from 'zapatos/db'

import { ECS, ECSClient } from '@aws-sdk/client-ecs'
import { CloudFormation, CloudFormationClient } from '@aws-sdk/client-cloudformation'
import { CloudWatchLogs, CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { FirehoseClient } from '@aws-sdk/client-firehose'
import { Kinesis } from '@aws-sdk/client-kinesis'
import { KMSClient } from '@aws-sdk/client-kms'
import { S3Client } from '@aws-sdk/client-s3'
import { SFN } from '@aws-sdk/client-sfn'
import { SNSClient } from '@aws-sdk/client-sns'
import { S3, EventBridge } from 'aws-sdk'
import { EventBridgeClient } from '@aws-sdk/client-eventbridge'
import * as pg from 'pg'
import { google } from 'googleapis'
import { drive_v3, sheets_v4} from 'googleapis'
import {IConfig} from './config'
import {ILogger} from './logger'
import {I18n} from 'i18n'
import * as path from 'path'
import {LocaleEnum} from './locale'

export interface ContextCreateOptions {
  config?: IConfig,
  locale?: LocaleEnum,
  domainConfig?: any,
  store?: {
    reader: pg.Pool,
    writer: pg.Pool,
  },
  mysql?: {
    reader: mysql.Pool,
    writer: mysql.Pool,
  },
}

export interface IContext {
  version: string,
  aws: {
    sfn: SFN
    eventBridgeClient: EventBridgeClient,
    s3: S3,
    s3Client: S3Client,
    cloudwatchlogs: CloudWatchLogs,
    cwLogsClient: CloudWatchLogsClient,
    snsClient: SNSClient,
    firehoseClient: FirehoseClient, // v3
    kinesis: Kinesis,
    ecs: ECS,
    ecsClient: ECSClient,
    cloudformation: CloudFormation,
    cfClient: CloudFormationClient,
    kms: KMSClient
  },
  google: {
    drive: drive_v3.Drive,
    sheets: sheets_v4.Sheets,
  },
  config: IConfig,
  domainConfig?: any,
  locale: string,
  i18n: I18n,
  logger: ILogger,
  trace: string,
  redshift: (credentials?: { user: string; password: string }) =>  Promise<pg.Pool>,
  mysql: {
    reader: () => Promise<mysql.Pool>,
    writer: () => Promise<mysql.Pool>,
  },
  store: {
    reader: () => Promise<pg.Pool>,
    writer: () => Promise<pg.Pool>,
  },
  cache: DynamoDBClient,
  _cache: ICache
}

type CacheKeys = 'store.reader' | 'store.writer' | 'mysql.reader' | 'mysql.writer' | 'redshift' | 'i18n' | 'cache'

interface ICache {
  'mysql.reader'?: mysql.Pool,
  'mysql.writer'?: mysql.Pool,
  'store.reader'?: pg.Pool,
  'store.writer'?: pg.Pool,
  'redshift'?: pg.Pool,
  'i18n'?: I18n,
  'cache'?: DynamoDBClient,
}

async function create(options: ContextCreateOptions = {}): Promise<IContext> {
  const config = options.config || await Config.from(Config.getEnvironment())
  const locale = options.locale || LocaleEnum.DEFAULT

  const logger = Logger.create()
  const _cache: ICache = {}

  function cacheAsync<T>(key: CacheKeys, fn: () => Promise<T>): () => Promise<T> {
    return async function() {
      if (!(key in _cache)) {
        cache[key] = await fn()
      }
      return cache[key]  
    }
  }

  function cache<T>(key: CacheKeys, fn: () => T): () => T {
    return function() {
      if (!(key in _cache)) {
        cache[key] = fn()
      }
      return cache[key]  
    }
  }

  return {
    version: process.env['APP_VERSION'] || '',
    aws: {
      cloudwatchlogs: new CloudWatchLogs({region: config.aws.region}),
      cwLogsClient: new CloudWatchLogsClient({region: config.aws.region}),
      eventBridgeClient: new EventBridgeClient({region: config.aws.region}),
      s3: new S3({ region: config.aws.region}),
      s3Client: new S3Client( { region: config.aws.region }),
      sfn: new SFN({region: config.aws.region}),
      snsClient: new SNSClient({region: config.aws.region}),
      firehoseClient: new FirehoseClient({region: config.aws.region}), // v3
      kinesis: new Kinesis({region: config.aws.region}),
      ecs: new ECS({region: config.aws.region}),
      ecsClient: new ECSClient( { region: config.aws.region }),
      cloudformation: new CloudFormation({region: config.aws.region}),
      cfClient:  new CloudFormationClient({region: config.aws.region}),
      kms: new KMSClient({region: config.aws.region})
    },
    google: {
      drive: google.drive({
        version: 'v3',
        auth: new google.auth.GoogleAuth({
          credentials: JSON.parse(config.common.googleapis.credentials),
          scopes: ['https://www.googleapis.com/auth/drive']
        }),
        retry: true,
      }),
      sheets: google.sheets({
        version: 'v4',
        auth: new google.auth.GoogleAuth({
          credentials: JSON.parse(config.telenutrition.googleapis.credentials),
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        })
      })
    },
    mysql: {
      reader: cacheAsync<mysql.Pool>('mysql.reader', async () => options.mysql?.reader ||  mysql.createPool(config.mysql.reader)),
      writer: cacheAsync<mysql.Pool>('mysql.writer', async () => options.mysql?.writer ||  mysql.createPool(config.mysql.writer)),
    },
    store: {
      reader: cacheAsync<pg.Pool>('store.reader', async () => options.store?.reader || new pg.Pool(config.common.store.reader)),
      writer: cacheAsync<pg.Pool>('store.writer', async () => options.store?.writer || new pg.Pool(config.common.store.writer)),
    },
    redshift: (credentials?: {user: string, password:string}) => {
      let key = 'redshift'
      let connection = config.redshift.connection

      if (credentials !== undefined) {
        key = `${key}:${credentials.user}`
        connection = {...connection, ...credentials}
      }

      return cacheAsync<pg.Pool>(key as CacheKeys, async () => new pg.Pool(connection))()
    },
    get cache() { 
      return cache<DynamoDBClient>('cache', () => new DynamoDBClient({
        region: config.aws.region,
      }))()
    },
    get i18n() {
      return cache<I18n>('i18n', () => {
        const i18n = new I18n({directory: path.join(__dirname, '..', 'locales')})
        i18n.setLocale(locale)
        return i18n  
      })()
    },
    locale,
    config,
    domainConfig: options.domainConfig,
    logger,
    trace: crypto.randomBytes(8).toString('hex').replace(/([0-9a-f]{4})/g, '$1-').slice(0,19),
    _cache,
  }
}

// Remove global references to allow for gcollection
async function destroy(context: IContext): Promise<void> {
  if (context != undefined) {
    // @ts-ignore
    context.config = undefined
    // @ts-ignore 
    context.logger = undefined

    if (context._cache['mysql.reader']) {
      await context._cache['mysql.reader'].end()
    }

    if (context._cache['mysql.writer']) {
      await context._cache['mysql.writer'].end()
    }

    // @ts-ignore
    context.mysql.reader = undefined
    // @ts-ignore
    context.mysql.writer = undefined

    if (context._cache['store.reader']) {
      await context._cache['store.reader'].end()
    }

    if (context._cache['store.writer']) {
      await context._cache['store.writer'].end()
    }

    // @ts-ignore
    context.store.reader = undefined
    // @ts-ignore
    context.store.writer = undefined    

    if (context._cache['redshift']) {
      await context._cache['redshift'].end()
    }

    // @ts-ignore
    context.redshift = undefined

    // clear all references in context cache
    for (let key in Object.keys(context._cache)) {
      context._cache[key] = undefined
    }
  }
}

export type DbTransaction = db.TxnClientForSerializable;

export default {
  create,
  destroy,
}