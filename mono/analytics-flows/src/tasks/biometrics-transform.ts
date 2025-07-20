import { TaskBuilder } from "@mono/common-flows/lib/builder"
import Redshift from '@mono/common-flows/lib/tasks/aws/redshift'

export type QueryOptions = Omit<TaskBuilder, 'handler' | 'type'>

export function query(options: QueryOptions): TaskBuilder {
  return Redshift.query({
    ...options,
    sql: `
    DROP TABLE IF EXISTS public.biometrics_transform;

    CREATE TABLE public.biometrics_transform AS
    SELECT user_id, 'bmi' as "biometric", bmi as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers WHERE bmi > 0 and bmi < 50
    UNION ALL
    SELECT user_id, 'body_fat' as "biometric", body_fat as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers WHERE body_fat > 0 and body_fat < 50
    UNION ALL
    SELECT user_id, 'cholesterol' as "biometric", cholesterol as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers WHERE cholesterol > 0 and cholesterol < 300
    UNION ALL
    SELECT user_id, 'hdl' as "biometric", hdl as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers WHERE hdl > 0 and hdl < 200
    UNION ALL
    SELECT user_id, 'ldl' as "biometric", ldl as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers WHERE ldl > 0 and ldl < 300
    UNION ALL
    SELECT user_id, 'diastolic' as "biometric", diastolic as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers WHERE systolic > 0 and systolic < 250
    UNION ALL
    SELECT user_id, 'systolic' as "biometric", systolic as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers WHERE systolic > 0 and systolic < 250
    UNION ALL
    SELECT user_id, 'waist' as "biometric", waist as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers
    UNION ALL
    SELECT user_id, 'weight' as "biometric", weight as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers
    UNION ALL
    SELECT user_id, 'triglycerides' as "biometric", triglycerides as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers WHERE triglycerides > 0 and triglycerides < 7000
    UNION ALL
    SELECT user_id, 'blood_glucose' as "biometric", blood_glucose as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers WHERE blood_glucose > 0 and blood_glucose < 150
    UNION ALL
    SELECT user_id, 'ha1c' as "biometric", ha1c as "value", date, disease_diabetes, disease_blood_pressure, disease_cholesterol, fasting
    FROM foodapp.hc_user_biomarkers WHERE ha1c > 0 and ha1c < 25;
    `
  })
}
