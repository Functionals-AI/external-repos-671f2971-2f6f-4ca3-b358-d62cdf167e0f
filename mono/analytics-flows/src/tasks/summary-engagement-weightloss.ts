import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
        drop table if exists analytics.summary_users_engagement_achieve_weight_loss;
        create table analytics.summary_users_engagement_achieve_weight_loss AS
            WITH events_external_reporting AS (SELECT * FROM public.mapped_events WHERE fs_product_category IS NOT NULL),
            --BASE TABLES with values filtering out outliers
            long_table as (
            SELECT *
            from(
              SELECT *,
                case 
                  when (biometric = 'bmi') and (value <50) then 1
                  when (biometric = 'weight') and (value > 60) and (value<400) then 1
                  when (biometric='triglycerides') and (value >10) and (value < 2000) then 1 
                  when (biometric='cholesterol') and (value >65) and (value < 750) then 1 
                  when (biometric='hdl') and (value > 10) and (value < 120) then 1 
                  when (biometric='ldl') and (value >30) and (value < 200) then 1 
                  when (biometric='systolic') and (value > 80) and (value < 300) then 1 
                  when (biometric='diastolic') and (value > 40) and (value < 200) then 1 
                  when (biometric='ha1c') and (value > 3) and (value < 15) then 1
                else NULL end as normal_value_flag,
                --take the first reported biometric on a given date if there are duplicates
                rank() over (partition by user_id, biometric,date(date) order by datepart(hour,date), datepart(minute,date), datepart(second,date) asc) as biometric_date_rank
              FROM foodapp.go_users
              LEFT JOIN biometrics_transform on go_users.id = biometrics_transform.user_id
              WHERE value is NOT NULL and
              normal_value_flag is NOT NULL
              )
              where biometric_date_rank=1
            ),

            biometrics_before_after as (select user_id, suborganization_id, organization_id, biometric, before, after, days_between, latest_record, record_number, disease_blood_pressure, disease_cholesterol, fasting, date(first_date) as first_date,date(last_date) as last_date
            from (
            select t0.user_id, 
            t0.suborganization_id, 
            t0.organization_id, 
            t0.biometric, 
            t0.value as "before",
            case when datediff('day', t0.date, t1.date)=0 then Null else t1.value end as "after",
            case when datediff('day', t0.date, t1.date)=0 then Null else datediff('day', t0.date, t1.date) end as "days_between",
            t0.date as "first_date",
            t1.date as "last_date",
            row_number() over (partition by t0.user_id, t0.biometric order by datediff('day', t0.date, t1.date) desc) as record_number,
            case when row_number() over (partition by t0.user_id, t0.biometric order by t0.date asc)  = count(1) over (partition by t0.user_id, t0.biometric) then 1 else 0 end as latest_record,
            t0.disease_blood_pressure, t0.disease_cholesterol, t0.fasting
            from long_table t0
            left join long_table t1
            on t0.user_id = t1.user_id
            where t0.biometric = t1.biometric
            and datediff('day', t0.date, t1.date)>=30
            )
            where record_number = 1 and after is not null
            ),
            
            --biometrics table but just for weight
            weight_table as (
              select * from biometrics_before_after where biometric='weight'
            ),
            
            --biometrics table but selecting baseline BMI
            first_bmi_table as (
              select user_id, suborganization_id, organization_id, biometric, before
              from biometrics_before_after
              where biometric='bmi'
            )
            
            SELECT
              summary_by_org.user_id,
              summary_by_org.organization_id,
              summary_by_org.ext_product,
              summary_by_org.ext_product_category,
              summary_by_org.events_count,
              summary_by_org.events_dates_count,
              summary_by_org.days_between,
              summary_by_org.months_between,
              summary_by_org.ceiling_months_count, --to account for when a user has more months than actual calculated months between
              first_bmi_table.before as first_bmi, 
              weight_table.before as first_weight,
              weight_table.after as last_weight,
              weight_table.after - weight_table.before as weight_change,
              case when (weight_change) <0 then 1 else 0 end as flagged_lost_weight,
              case when ((last_weight*1.0)/first_weight-1) <= (-0.05) then 1 else 0 end as flagged_5p_lost_weight
            from(
            SELECT 
              user_id,
              organization_id,
              ext_product,
              ext_product_category,
              count(distinct events_date) as events_dates_count,
              count(distinct event_month) as months_count,
              count(event) as events_count,
              min(first_date) as first_weight_date,
              max(last_date) as last_weight_date,
              DATEDIFF(day, first_weight_date, last_weight_date) AS days_between,
              DATEDIFF(month, first_weight_date, last_weight_date) AS months_between,
              case when months_count > months_between then months_between else months_count end as ceiling_months_count
            from(
              SELECT
                  events_external_reporting.user_id  AS "user_id",
                  "user".organization_id,
                  events_external_reporting.ext_product as "ext_product",
                  events_external_reporting.ext_fs_product_category as "ext_product_category",
                  (DATE(events_external_reporting.event_timestamp_pst)) AS "events_date",
                  last_day(events_date) AS event_month,  
                  events_external_reporting.event AS "event",
                  weight_table.first_date,
                  weight_table.last_date
              FROM foodapp.go_users  AS "user"
              LEFT JOIN foodapp.go_test_users  AS go_test_users ON ("user".id) = go_test_users.user_id
              LEFT JOIN events_external_reporting ON ("user".id) = events_external_reporting.user_id
              LEFT JOIN weight_table ON ("user".id) = weight_table.user_id
              WHERE ((go_test_users.user_id is not null) = false) and weight_table.last_date is not null
              and DATE(events_external_reporting.event_timestamp_pst) >= first_date and DATE(events_external_reporting.event_timestamp_pst) <= last_date
              and event is not null
            ) as events_count_table
            group by 1,2,3,4
            ) as summary_by_org
            LEFT JOIN weight_table ON summary_by_org.user_id = weight_table.user_id and summary_by_org.organization_id = weight_table.organization_id
            LEFT JOIN first_bmi_table ON summary_by_org.user_id = first_bmi_table.user_id and summary_by_org.organization_id = first_bmi_table.organization_id;
    
    `
  })
}
