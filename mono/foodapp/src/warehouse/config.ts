//
// Staging and non-staging schemas:
//  * staging schema: Not visible to analytics / Looker. Contains raw tables, and any derived tables
//      which are not to be exposed to BI tools.
//  * non-staging schema: Contains copies of raw tables in staging schema with a subset of columns
//      to not leak PPI / PHI.
//
export const WAREHOUSE_STAGING_SCHEMA_NAME: string = 'foodapp_stage'
export const WAREHOUSE_SCHEMA_NAME: string = 'foodapp'
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
  appDBSchemaName: string,
  fqSchemaName: string,
  tables: ITableConfig[],
}

export const SCHEMAS_CONFIG: ISchemaConfig[] = [
  {
    appDBSchemaName: 'common',
    fqSchemaName: 'fq_foodapp_common',
    tables: [
      {
        name: 'hp_ffq_target',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'meal_comments',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'mp_options',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'organizations',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'salesforce_mappings',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'suborganizations',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'tags',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'user_meal_favorites',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      }
    ]
  },
  {
    appDBSchemaName: 'tenants',
    fqSchemaName: 'fq_foodapp_tenants',
    tables: [
      //
      // Cafe coach tables are large, and not used by analytics.
      //
      /**
      {
        name: 'cafe_coach',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'cafe_coach_meals',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'cafe_coach_blacklist',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'cafe_coach_meal_tags',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'cafe_coach_feedback',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      */
      {
        name: 'flu_event_import',
        staging_columns: [ '*' ],
        columns: [
          'id',
          'person_id',
          'organization_id',
          'date_of_birth',
          'is_dependent',
          'event_code',
          'event_date',
          'create_date'
        ]
      },
      {
        name: 'go_test_users',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'go_user_infos',
        staging_columns: [ '*' ],
        columns: [
          'id',
          'user_id',
          `concat(left(lpad(zip, 5, '0'), 3), '01') as zip`,
          'mobile_phone',
          'has_biometrics',
          'has_ffq',
          'magic_used',
          'ffq_viewed',
          'thm_viewed',
          'zip_entered',
          'latest_timezone',
          'food_goal',
          'dinnerwell_enroll_date',
          'next_nps_send',
          'qualtrics_id',
          'number_in_household',
          'delivery_zip',
          'primary_retailer_id',
          'affordable_cost',
          'scheduled_telenutrition_appt',
          'disallow_external_tracking',
          'locale'
        ]
      },
      {
        name: 'go_users',
        staging_columns: [
          'id',
          'username',
          'public.aes_decrypt_mysql(to_hex(cast(username_crypt as varbyte)), \'complicatedkeyforAESencryption\', \'hex\') as email',
          'organization_id',
          'suborganization_id',
          'firstname',
          'lastname',
          'nickname',
          'birthday',
          'alias',
          'password_reset_time',
          'openId',
          'facebook_uid',
          'facebook_email',
          'preferred_unit_of_measure',
          'gender',
          'last_login_date',
          'last_mobile_login_date',
          'active',
          'version',
          'primary_office',
          'primary_cafe',
          'intro_ffq_status',
          'is_dependent',
          'trial_id',
          'eligible_id',
          'member_id',
          'member_id_2',
          'provider_id',
          'household_id',
          'public_username',
          'avatar_url',
          'create_date',
          'update_date',
          'enrolled',
          'last_enrolled_date',
          'ta_user_id',
          'ta_identity_id'
        ],
        columns: [
          'id',
          'username',
          'abs((DATEDIFF(\'year\',birthday,CURRENT_DATE)::int)) AS birthday',
          'organization_id',
          'suborganization_id',
          'preferred_unit_of_measure',
          'gender',
          'last_login_date',
          'last_mobile_login_date',
          'active',
          'version',
          'primary_office',
          'primary_cafe',
          'intro_ffq_status',
          'is_dependent',
          'trial_id',
          'eligible_id',
          'member_id',
          'member_id_2',
          'provider_id',
          'household_id',
          'create_date',
          'update_date',
          'enrolled',
          'last_enrolled_date',
          'ta_user_id',
          'ta_identity_id'
        ]
      },
      {
        name: 'go_users_eligible',
        staging_columns: [
          'id',
          'person_id',
          'subscriber_id',
          'person_id_old',
          'subscriber_id_old',
          'group_number',
          'public.aes_decrypt_mysql(to_hex(cast(email_crypt as varbyte)), \'complicatedkeyforAESencryption\', \'hex\') as email_decrypt',
          'email',
          'firstname',
          'lastname',
          'organization_id',
          'suborganization_id',
          'suborganization_name',
          'effective_date',
          'zip_code',
          'birthday',
          'gender',
          'office_location',
          'department',
          'building_code',
          'employment_status',
          'raw_data',
          'last_updated',
          'is_dependent',
          'member_id_2',
          'name_id',
          'number_in_household',
          'mobile_phone',
          'address',
          'city',
          'state',
          'country',
          'plan_type',
          'group_id',
          'lob',
          'language'
        ],
        columns: [
          'id',
          'person_id',
          'subscriber_id',
          'person_id_old',
          'subscriber_id_old',
          'group_number',
          'email',
          'organization_id',
          'suborganization_id',
          'suborganization_name',
          'effective_date',
          `concat(left(lpad(zip_code, 5, '0'), 3), '01') as zip_code`,
          'birthday',
          'gender',
          'office_location',
          'department',
          'building_code',
          'employment_status',
          'last_updated',
          'is_dependent',
          'member_id_2',
          'name_id',
          'number_in_household',
          'plan_type',
          'group_id',
          'lob',
          'language',
          `
          CASE IS_VALID_JSON(raw_data) 
            when true then NULLIF ( JSON_EXTRACT_PATH_TEXT(raw_data, 'pregnancy_due_date'), '' ) :: date 
            else NULL 
          END as pregnancy_due_date 
          `
        ]
      },
      {
        name: 'go_users_organization_log',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'go_users_roles',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      //
      // Note, the *_operator columns which are enum('<','=','>') produced an
      // unsupported error and have been removed.
      //
      {
        name: 'hc_user_biomarkers',
        staging_columns: [
          'biomarker_id',
          'user_id',
          'waist',
          'height',
          'weight',
          'activity_level',
          'bmi',
          'body_fat',
          'disease_diabetes',
          'ha1c',
          'blood_glucose',
          'fasting',
          'disease_blood_pressure',
          'systolic',
          'diastolic',
          'disease_cholesterol',
          'cholesterol',
          'hdl',
          'ldl',
          'triglycerides',
          'source',
          'import_id',
          'import_entry_id',
          'event_code',
          'date'
        ],
        columns: [
          'biomarker_id',
          'user_id',
          'waist',
          'height',
          'weight',
          'activity_level',
          'bmi',
          'body_fat',
          'disease_diabetes',
          'ha1c',
          'blood_glucose',
          'fasting',
          'disease_blood_pressure',
          'systolic',
          'diastolic',
          'disease_cholesterol',
          'cholesterol',
          'hdl',
          'ldl',
          'triglycerides',
          'source',
          'import_id',
          'import_entry_id',
          'event_code',
          'date'
        ]
      },
      {
        name: 'household_invites',
        staging_columns: [ '*' ],
        columns: [
          'id',
          'owner_id',
          'user_id',
          'email',
          'relationship',
          'invite_date',
          'active_date',
          'organization_id',
          'suborganization_id',
          'invitation_hash',
          'inactive_date',
          'action_id'
        ]
      },
      {
        name: 'hp_ffq_user',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'instacart_feedback',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'meal_feedback',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'mealkit_order_items',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'mealkit_orders',
        staging_columns: [ '*' ],
        columns: [
          'id',
          'user_id',
          'customer_id',
          'provider',
          'provider_name',
          'provider_order_id',
          'provider_order_status',
          'meal_kits',
          'prices',
          'shipping_address',
          'tracking_details',
          'order_date',
          'order_status',
          'delivery_date',
          'subsidies_redeemed',
          `cast(json_extract_path_text(prices, 'total_discounts') as decimal(6,2)) as total_discounts`,
          `cast(json_extract_path_text(prices, 'subtotal_price') as decimal(6,2)) as subtotal_price`,
          `cast(json_extract_path_text(prices, 'shipping_price') as decimal(6,2)) as shipping_price`,
          `cast(json_extract_path_text(prices, 'total_price') as decimal(6,2)) as total_price`,
          `cast(json_extract_path_text(prices, 'total_tax') as decimal(6,2)) as total_tax`,
          'created_at',
          'updated_at'
        ]
      },
      {
        name: 'mp_options_users',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'nutriscore',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'provider_meal_feedback',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'provider_orders',
        staging_columns: [ '*' ],
        columns: [
          'order_id',
          'user_id',
          'provider',
          'provider_merchant_id',
          'order_date',
          'fulfillment_date',
          'placement_date',
          'delivery_date',
          'order_type',
          'items',
          'instructions',
          'subtotal',
          'tip',
          'tax',
          'fees',
          'delivery_fee',
          'stripe_fee',
          'service_charge',
          'total',
          'charge_total',
          'agent_total',
          'estimated_total',
          'pre_auth_amount',
          'discount',
          'net_payment',
          'payment_method',
          'charge_status',
          'charge_info',
          'charge_amount',
          'location_id',
          'status',
          'success_notification_sent',
          'failure_notification_sent',
          'failure_reason',
          'refund_amount',
          'source'
        ]
      },
      {
        name: 'survey_meta',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'survey_response',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'user_addresses',
        staging_columns: [ '*' ],
        columns: [
          'location_id',
          'user_id',
          'city',
          'state',
          'zip_code',
          'first_name',
          'last_name'
        ]
      },
      {
        name: 'user_goal_checkins',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'user_goals',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      },
      {
        name: 'user_subscriptions',
        staging_columns: [ '*' ],
        columns: [ '*' ]
      }
    ]
  }
]
