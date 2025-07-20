import { err, ok, Result } from 'neverthrow'
import { ErrCode } from '../error'
import { IContext } from '../context'
import Logger from '../logger'
import { WAREHOUSE_STAGING_SCHEMA_NAME, STAGE_RAW_TABLE_SUFFIX, WAREHOUSE_SCHEMA_NAME, ISchemaConfig, ITableConfig, SCHEMAS_CONFIG } from './config'
import { publishWarehouseSyncCompletedEvent, WarehouseSyncCompletedEvent } from './events'

const MTAG = Logger.tag()

/**
 * Create an external schema in order to perform federated queries against the common store.
 * 
 * @param {IContext}      context - The context.
 * @param {ISchemaConfig} schemaConfig - Schema configuration which includes the name of the external schema to create,
 *                                       and the schema / database name of the common DB.
 * @param {string}   roleArn       - Required role granting permisions to access credentials in secrets manager.
 * @param {string}   dbSecretArn - Arn of Secrets Manager secret containing username / password.
 * 
 */
async function createExternalFqSchema(context: IContext, schemaConfig: ISchemaConfig, roleArn: string, dbSecretArn: string): Promise<Result<string, ErrCode>> {
  const TAG = [...MTAG, 'createExternalFqSchema']
  const {redshift, logger} = context
  const { dbSchemaName, fqSchemaName } = schemaConfig;

  try {
    const pool = await redshift()
    const query = `
      CREATE EXTERNAL SCHEMA IF NOT EXISTS ${fqSchemaName}
        FROM POSTGRES
		    DATABASE 'foodsmart' SCHEMA '${dbSchemaName}'
        URI '${context.config.common.store.reader.host}'
        IAM_ROLE '${roleArn}'
    		SECRET_ARN '${dbSecretArn}';
    `
    await pool.query(query)

    return ok(`Created external schema, external schema name - ${fqSchemaName}, common schema name - ${dbSchemaName}`)
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
 * @param {IContext}      context - The context.
 * @param {ISchemaConfig} schemaConfig - The db schema config.
 * @param {ITableConfig}  tableConfig - Table configuration.
 * 
 * @returns {Promise<Result<ISyncTableResult, ErrCode>>} Return promise resolved to an ISyncTableResult instance or error.
 */
async function syncTableToStagingSchema(context: IContext, schemaConfig: ISchemaConfig, tableConfig: ITableConfig): Promise<Result<ISyncTableResult, ErrCode>> {
  const TAG = [...MTAG, 'syncTableToStagingSchema']
  const {redshift, logger} = context

  try {
    logger.info(context, TAG, `Syncing table - ${tableConfig.name}...`, { table_name: tableConfig.name })

    const pool = await redshift()

    const warehouseTableName = `${schemaConfig.dbSchemaName}_${tableConfig.name}${STAGE_RAW_TABLE_SUFFIX}`

    let query = `
      DROP TABLE IF EXISTS ${WAREHOUSE_STAGING_SCHEMA_NAME}.${warehouseTableName};
    `
    await pool.query(query)
    logger.info(context, TAG, `Successfully dropped table - ${warehouseTableName}`, { table_name: warehouseTableName })

    query = `
      CREATE TABLE ${WAREHOUSE_STAGING_SCHEMA_NAME}.${warehouseTableName} as
        select ${tableConfig.staging_columns.join(',')} from ${schemaConfig.fqSchemaName}.${tableConfig.name};
    `
    logger.info(context, TAG, `Creating table - ${warehouseTableName}`, { table_name: warehouseTableName, query, })
    await pool.query(query)
    logger.info(context, TAG, `Successfully created table - ${warehouseTableName}`, { table_name: warehouseTableName })

    const {rows} = await pool.query(`select count(*) as count from ${WAREHOUSE_STAGING_SCHEMA_NAME}.${warehouseTableName};`)

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
 * @param {ISchemaConfig}    schemaConfig - Schema configuration.
 * @param {ITableConfig}     tableCOnfig - The table configuration.
 * 
 * @returns {Promise<Result<ISyncTableResult, ErrCode>>} Return promise resolved to a sync table result, or error.
 */
async function unstageTable(context: IContext, schemaConfig: ISchemaConfig, tableConfig: ITableConfig): Promise<Result<ISyncTableResult, ErrCode>> {
  const TAG = [...MTAG, 'unstageTable']
  const {redshift, logger} = context

  try {
    const pool = await redshift()

    if (tableConfig.columns.length) {
      const warehouseTableName = `${schemaConfig.dbSchemaName}_${tableConfig.name}`

      let query = `
        DROP TABLE IF EXISTS ${WAREHOUSE_SCHEMA_NAME}.${warehouseTableName};
      `
      await pool.query(query)

      query = `
      CREATE TABLE ${WAREHOUSE_SCHEMA_NAME}.${warehouseTableName} as
        select ${tableConfig.columns.join(',')} from ${WAREHOUSE_STAGING_SCHEMA_NAME}.${warehouseTableName}${STAGE_RAW_TABLE_SUFFIX};
      `
      await pool.query(query)

      const {rows} = await pool.query(`select count(*) as count from ${WAREHOUSE_SCHEMA_NAME}.${warehouseTableName};`)

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
  const roleArn = context.config.redshift.commonStore.fqRoleArn

  const event: WarehouseSyncCompletedEvent = {
    schema_name: WAREHOUSE_SCHEMA_NAME,
    synced_tables: []
  }

  for (let schemaConfig of SCHEMAS_CONFIG) {
    const createResult = await createExternalFqSchema(context, schemaConfig, roleArn, context.config.redshift.commonStore.fqSecretsmanagerArn)

    if (createResult.isOk()) {
      logger.info(context, TAG, createResult.value)
    }
    else {
      logger.error(context, TAG, `Failed to create external schema!`, schemaConfig)
      return createResult;
    }

    for (let tableConfig of schemaConfig.tables) {
      const syncTableResult = await syncTableToStagingSchema(context, schemaConfig, tableConfig)

      if (syncTableResult.isOk()) {
        logger.info(context, TAG, `Successfully synced table, table - ${tableConfig.name}, # rows - ${syncTableResult.value.rowCount}.`)
      }
      else {
        return err(syncTableResult.error)
      }

      const unstageTableResult = await unstageTable(context, schemaConfig, tableConfig)

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