import { err, ok, Result } from 'neverthrow'
import { ErrCode } from '@mono/common/lib/error'
import { IContext } from '@mono/common/lib/context'
import Logger from '@mono/common/lib/logger'
import { WAREHOUSE_STAGING_SCHEMA_NAME, STAGE_RAW_TABLE_SUFFIX, WAREHOUSE_SCHEMA_NAME, ISchemaConfig, ITableConfig, SCHEMAS_CONFIG } from './config'
import { publishWarehouseSyncCompletedEvent, WarehouseSyncCompletedEvent } from './events'

const MTAG = Logger.tag()

/**
 * Create an external schema in order to perform federated queries against the application DB.
 * 
 * IE:
 * 
 *  CREATE EXTERNAL SCHEMA fq_foodapp_common
 *  FROM MYSQL
 *  DATABASE 'common'
 *  URI 'dev-rds-aurora-1.clfse24y8e7x.us-west-2.rds.amazonaws.com'
 *  IAM_ROLE 'arn:aws:iam::914374131125:role/ZipongoRedshiftSpectrumMarekTest'
 *  SECRET_ARN 'arn:aws:secretsmanager:us-west-2:914374131125:secret:mono/foodapp/warehouse/fq_app-1210zm';
 * 
 * @param {IContext}      context - The context.
 * @param {ISchemaConfig} schemaConfig - Schema configuration which includes the name of the external schema to create,
 *                                       and the schema / database name of the application DB.
 * @param {string}   roleArn       - Required role granting permisions to access credentials in secrets manager.
 * @param {string}   appDBSecretArn - Arn of Secrets Manager secret containing username / password.
 * 
 */
async function createExternalFqSchema(context: IContext, schemaConfig: ISchemaConfig, roleArn: string, appDBSecretArn: string): Promise<Result<string, ErrCode>> {
  const TAG = [...MTAG, 'createExternalFqSchema']
  const {redshift, logger} = context
  const { appDBSchemaName, fqSchemaName } = schemaConfig;

  try {
    const pool = await redshift()
    const query = `
      CREATE EXTERNAL SCHEMA IF NOT EXISTS ${fqSchemaName}
        FROM MYSQL
        DATABASE '${appDBSchemaName}'
        URI '${context.config.mysql.reader.host}'
        IAM_ROLE '${roleArn}'
        SECRET_ARN '${appDBSecretArn}';
    `
    await pool.query(query)

    return ok(`Created external schema, external schema name - ${fqSchemaName}, foodapp schema name - ${appDBSchemaName}`)
  } 
  catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

interface ISyncTableResult {
    rowCount: number, // Number of rows synced.
}

/**
 * 
 * Sync an app. DB table using a 'create table as' query to the staging schema. 
 * For example:
 * 
 *  create table <warehouse schema name>.<table name> as select <columns> from <federated query schema name>.<table name>;
 * 
 * @param {IContext}     context - The context.
 * @param {ITableConfig} tableConfig - Table configuration.
 * @param {string}       fqSchemaName - Name of schema to perform federated queries against application DB.
 * 
 * @returns {Promise<Result<ISyncTableResult, ErrCode>>} Return promise resolved to an ISyncTableResult instance or error.
 */
async function syncTableToStagingSchema(context: IContext, tableConfig: ITableConfig, fqSchemaName: string): Promise<Result<ISyncTableResult, ErrCode>> {
  const TAG = [...MTAG, 'syncTableToStagingSchema']
  const {redshift, logger} = context

  try {
    logger.info(context, TAG, `Syncing table - ${tableConfig.name}...`, { table_name: tableConfig.name })

    const pool = await redshift()

    let query = `
      DROP TABLE IF EXISTS ${WAREHOUSE_STAGING_SCHEMA_NAME}.${tableConfig.name}${STAGE_RAW_TABLE_SUFFIX};
    `
    await pool.query(query)
    logger.info(context, TAG, `Successfully dropped table - ${tableConfig.name}`, { table_name: tableConfig.name })

    query = `
      CREATE TABLE ${WAREHOUSE_STAGING_SCHEMA_NAME}.${tableConfig.name}${STAGE_RAW_TABLE_SUFFIX} as
        select ${tableConfig.staging_columns.join(',')} from ${fqSchemaName}.${tableConfig.name};
    `
    logger.info(context, TAG, `Creating table - ${tableConfig.name}`, { table_name: tableConfig.name, query, })
    await pool.query(query)
    logger.info(context, TAG, `Successfully created table - ${tableConfig.name}`, { table_name: tableConfig.name })

    const {rows} = await pool.query(`select count(*) as count from ${WAREHOUSE_STAGING_SCHEMA_NAME}.${tableConfig.name}${STAGE_RAW_TABLE_SUFFIX};`)

    logger.info(context, TAG, `Sync. row count - ${rows[0].count}.`, { row_count: rows[0].count })

    return ok({rowCount: rows[0].count})
  }
  catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

/**
 * 
 * Copy table from staging to non-staging schema.
 * 
 * @param {IContext}         context - The context.
 * @param {ITableConfig}     tableCOnfig - The table configuration.
 * 
 * @returns {Promise<Result<ISyncTableResult, ErrCode>>} Return promise resolved to a sync table result, or error.
 */
async function unstageTable(context: IContext, tableConfig: ITableConfig): Promise<Result<ISyncTableResult, ErrCode>> {
  const TAG = [...MTAG, 'syncTableToStagingSchema']
  const {redshift, logger} = context

  try {
    const pool = await redshift()

    if (tableConfig.columns.length) {
      let query = `
        DROP TABLE IF EXISTS ${WAREHOUSE_SCHEMA_NAME}.${tableConfig.name};
      `
      await pool.query(query)

      query = `
      CREATE TABLE ${WAREHOUSE_SCHEMA_NAME}.${tableConfig.name} as
        select ${tableConfig.columns.join(',')} from ${WAREHOUSE_STAGING_SCHEMA_NAME}.${tableConfig.name}${STAGE_RAW_TABLE_SUFFIX};
      `
      await pool.query(query)

      const {rows} = await pool.query(`select count(*) as count from ${WAREHOUSE_SCHEMA_NAME}.${tableConfig.name};`)

      return ok({rowCount: rows[0].count})
    }
    else {
      logger.info(context, TAG, `Skipping unstaging of table - ${tableConfig.name}!`)

      return ok({rowCount: 0})
    }
  }
  catch(e) {
    logger.exception(context, TAG, e)
    return err(ErrCode.EXCEPTION)
  }
}

/**
 * Sync application store (RDS Aurora) to the data warehouse (Redshift).
 */
async function sync(context: IContext): Promise<Result<string, ErrCode>> {
  const TAG = [...MTAG, 'sync']
  const {logger} = context
  const roleArn = context.config.redshift.foodappStore.fqRoleArn

  const event: WarehouseSyncCompletedEvent = {
    schema_name: WAREHOUSE_SCHEMA_NAME,
    synced_tables: []
  }

  for (let schemaConfig of SCHEMAS_CONFIG) {
    const createResult = await createExternalFqSchema(context, schemaConfig, roleArn, context.config.redshift.foodappStore.fqSecretsmanagerArn)

    if (createResult.isOk()) {
      logger.info(context, TAG, createResult.value)
    }
    else {
      logger.error(context, TAG, `Failed to create external schema!`, schemaConfig)
      return createResult;
    }

    for (let tableConfig of schemaConfig.tables) {
      const syncTableResult = await syncTableToStagingSchema(context, tableConfig, schemaConfig.fqSchemaName)

      if (syncTableResult.isOk()) {
        logger.info(context, TAG, `Successfully synced table, table - ${tableConfig.name}, # rows - ${syncTableResult.value.rowCount}.`)
      }
      else {
        return err(syncTableResult.error)
      }

      const unstageTableResult = await unstageTable(context, tableConfig)

      if (unstageTableResult.isOk()) {
        logger.info(context, TAG, `Successfully unstaged table, table - ${tableConfig.name}, # rows - ${unstageTableResult.value.rowCount}.`)
        
        event.synced_tables.push({
          table_name: tableConfig.name,
          row_count: unstageTableResult.value.rowCount,
        })
      }
      else {
        return err(unstageTableResult.error)
      }
    }
  }
  try {
    await publishWarehouseSyncCompletedEvent(context, event)
  }
  catch (e) {
    //
    // Log, but let this succeed successfully.
    //
    logger.exception(context, TAG, e)
  }
  return ok('Synced application DB to warehouse.')
}

export default {
    sync,
}