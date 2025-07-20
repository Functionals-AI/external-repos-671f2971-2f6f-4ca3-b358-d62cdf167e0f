import { workflow } from '@mono/common-flows/lib/builder'
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export default workflow(function(config) {
  return {
    cron: '30 15 * * ? *',
    startAt: 'ReportingFoodInsecurityView',
    states: {
      ReportingFoodInsecurityView: Redshift.query({
        sql: `  -- Create events_emails_reporting table, only if it doesn't exist
            DROP TABLE IF EXISTS analytics.events_and_emails_reporting;

            CREATE TABLE analytics.events_and_emails_reporting AS 
            (
              SELECT a.user_id::varchar, a.event_timestamp_pst, a.event_type, a.event, a.event_id as identifier, 'app' as platform,
                     a.product , a.feature, a.newfeature_product,
                     CASE WHEN a.newfeature_product='Blog' THEN b.fs_product_category ELSE a.fs_product_category
                     END as fs_product_category,
                     CASE WHEN a.newfeature_product='Blog' THEN CONCAT(b.fs_product_category,' Related Content') ELSE a.newfeature_product
                     END as product_feature_category_rc,
                     CASE WHEN a.newfeature_product='Blog' THEN b.newfeature_product ELSE a.newfeature_product
                     END as "product_feature_2020",
                     CASE WHEN a.newfeature_product='Blog' THEN 'Nutrition Education' ELSE a.ext_product
                     END as "ext_product",
                     CASE WHEN a.newfeature_product='Blog' THEN 'FoodSmart' ELSE a.ext_fs_product_category
                     END as "ext_fs_product_category"
              FROM public.mapped_events a
              LEFT JOIN public.mapped_events_blog_clean_vw b ON a.event_id=b.event_id
              WHERE a.user_id NOT IN (SELECT user_id FROM public.go_test_users)
              UNION ALL
              ( SELECT user_id::varchar, event_timestamp as event_timestamp_pst, event_type, event_type as event, mailing_id as identifier, 'email' as platform, 'Email     Content' as product,
                      email_type as feature, 'Email Opens' as newfeature_product,
                      b.fs_product_category,
                      CONCAT(b.fs_product_category,' Related Content') as product_feature_category_rc,
                      a.product as "product_feature_2020", 'Nutrition Education' as ext_product, 'FoodSmart' as ext_fs_product_category
                FROM public.combined_emails_clean_vw a
                LEFT JOIN public.product_category_feature_mappings_vw b ON a.product=b.newfeature_product
                WHERE event IN ('Open', 'Click Through')
                AND user_id NOT IN (select user_id from public.go_test_users)
              )
              UNION ALL
              ( SELECT user_id::varchar, appointmentdate as event_timestamp_pst, NULL as event_type, 'Telenutrition - appointments' as event, appointmentid::varchar as identifier,
                      'Telenutrition' as platform, 'Telenutrition' as product,
                      'Appointment' as feature, 'Telenutrition' as newfeature_product,
                      'Health' as fs_product_category,
                      CONCAT('Health Coaching',' Related Content') as product_feature_category_rc,
                      'Telenutrition' as "product_feature_2020", 'Telenutrition' as ext_product, 'FoodSmart' as ext_fs_product_category
                FROM public.telenutrition_users_appointments
              )
            );
          `,
      }),
    }
  }
})
