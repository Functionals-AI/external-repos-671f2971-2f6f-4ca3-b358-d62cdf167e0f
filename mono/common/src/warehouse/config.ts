//
// Staging and non-staging schemas:
//  * staging schema: Not visible to analytics / Looker. Contains raw tables, and any derived tables
//      which are not to be exposed to BI tools.
//  * non-staging schema: Contains copies of raw tables in staging schema with a subset of columns
//      to not leak PPI / PHI.
//
export const WAREHOUSE_STAGING_SCHEMA_NAME: string = 'common_stage'
export const WAREHOUSE_SCHEMA_NAME: string = 'common'
//
// Suffix to use for raw tables which are sync'ed from foodapp RDS DB to the Redshift data warehouse.
//
export const STAGE_RAW_TABLE_SUFFIX: string = '_raw'

export interface ITableConfig {
  name: string,
  staging_columns: string[],
  columns: string[],
}

export interface ISchemaConfig {
  dbSchemaName: string,
  fqSchemaName: string,
  tables: ITableConfig[],
}

export const SCHEMAS_CONFIG: ISchemaConfig[] = [
  {
    dbSchemaName: 'telenutrition',
    fqSchemaName: 'fq_common_telenutrition',
    tables: [
      {
        name: 'schedule_appointment',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_appointment_type',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_appointment_type_mapping',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_department',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_department_provider',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_employer',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_flow',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_insurance',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_patient_verification',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_patient_verification_method',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_provider',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_referral',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'schedule_referrer',
        staging_columns: [ '*' ],
        //
        // Don't want to expose the 'credentials' column to BI tools.
        //
        columns: [ 'referrer_id', 'first_name', 'last_name', 'email', 'organization', 'org_id' ],
      },
      {
        name: 'iam_user',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
    ]
  },
]