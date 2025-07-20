import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
DROP TABLE IF EXISTS public.all_user_health;

CREATE TABLE public.all_user_health AS 
    SELECT user_id,
        go_users.gender,
       CASE WHEN bmi < 18.5 THEN 'underweight'
            WHEN bmi >= 18.5 AND bmi < 25 THEN 'ideal_weight'
            WHEN bmi >= 25 AND bmi < 30 THEN 'overweight'
            WHEN bmi >= 30 THEN 'obese'
            ELSE 'no_bmi_data'
       END as bmi,
       CASE WHEN (waist <= 35 AND go_users.gender = 'FEMALE') OR (waist < 40 AND go_users.gender = 'MALE') THEN 'ideal'
            WHEN (waist > 35 AND go_users.gender = 'FEMALE') OR (waist > 40 AND go_users.gender = 'MALE') THEN 'high_risk'
            ELSE 'no_waist_data'
       END as waist,
       CASE WHEN blood_glucose < 100 AND fasting = 1 THEN 'ideal_fasting'
            WHEN blood_glucose >= 100 AND blood_glucose < 126 AND fasting = 1 THEN 'low_risk_fasting'
            WHEN blood_glucose >= 126 AND fasting = 1 THEN 'high_risk_fasting'
            WHEN blood_glucose < 200 AND (fasting IS NULL OR fasting = 0) THEN '<200_non_fasting'
            WHEN blood_glucose >= 200 AND (fasting IS NULL OR fasting = 0) THEN '>=200_non_fasting'
            ELSE 'no_glucose_data'
       END as glucose,
          CASE WHEN systolic < 120 THEN 'ideal'
            WHEN systolic >= 120 AND systolic < 140 THEN 'low_risk'
            WHEN systolic >= 140 THEN 'high_risk'
            ELSE 'no_sbp_data'
       END as systolic_bp,
       CASE WHEN diastolic < 80 THEN 'ideal'
            WHEN diastolic >= 80 AND diastolic < 90 THEN 'low_risk'
            WHEN diastolic >= 90 THEN 'high_risk'
            ELSE 'no_dbp_data'
       END as diastolic_bp,
       CASE WHEN diastolic < 80 AND systolic < 120 THEN 'ideal'
            WHEN (systolic >= 120 AND systolic < 140) OR (diastolic >= 80 AND diastolic < 90) THEN 'pre-hypertensive'
            WHEN diastolic >= 90 OR systolic >= 140  THEN 'hypertensive'
            ELSE 'no_hypertension_data'
       END as hypertension_status,
       CASE WHEN cholesterol < 200 THEN 'ideal'
            WHEN cholesterol >= 200 AND cholesterol < 240 THEN 'low_risk'
            WHEN cholesterol >= 240 THEN 'high_risk'
            ELSE 'no_tc_data'
       END as total_cholesterol,
       CASE WHEN hdl >= 60 THEN 'ideal'
            WHEN hdl >= 40 AND hdl < 60 THEN 'low_risk'
            WHEN hdl < 40 THEN 'high_risk'
            ELSE 'no_hdl_data'
       END as hdl_cholesterol,
       CASE WHEN ldl < 130 THEN 'ideal'
            WHEN ldl >= 130 AND ldl < 160 THEN 'low_risk'
            WHEN ldl >= 160 THEN 'high_risk'
            ELSE 'no_ldl_data'
       END as ldl_cholesterol,
       CASE WHEN triglycerides < 150 THEN 'ideal'
            WHEN triglycerides >= 150 AND triglycerides < 200 THEN 'low_risk'
            WHEN triglycerides >= 200 THEN 'high_risk'
            ELSE 'no_tri_data'
       END as triglycerides,
       CASE WHEN ha1c < 5.7 THEN 'ideal'
            WHEN ha1c >= 5.7 AND ha1c < 6.5 THEN 'low_risk'
            WHEN ha1c >= 6.5 THEN 'high_risk'
            ELSE 'no_a1c_data'
       END as a1c,
       date,
       import_id,
       biomarker_id
    FROM foodapp.hc_user_biomarkers, foodapp.go_users
    WHERE hc_user_biomarkers.user_id = go_users.id;
`
  })
}
