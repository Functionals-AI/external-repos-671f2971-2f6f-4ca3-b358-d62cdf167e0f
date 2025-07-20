import { ChartingV1Config } from 'api/types';
import { DateTime } from 'luxon';

const now = DateTime.fromFormat('05/13/2024', 'LL/dd/yyyy');

const chartingConfig: ChartingV1Config = {
  historicalEncounterValues: {
    main_reason: [
      {
        value: 'general_wellness',
        date: now.minus({ weeks: 3 }).toFormat('yyyy-LL-dd'),
        display: 'I want to improve my general wellness',
      },
    ],
    food_sensitivity_intolerance: [
      {
        value: ['non_celiac_gluten_sensitivity', 'histamine_intolerance'],
        date: now.minus({ weeks: 3 }).toFormat('yyyy-LL-dd'),
        display: 'Yes: Histamine Intolerance; Non-celiac Gluten Sensitivity',
      },
    ],
    grocery_payment_method: [
      {
        value: {
          cash: true,
          credit_card: true,
          check: true,
          debit_card: true,
        },
        date: now.minus({ weeks: 3 }).toFormat('yyyy-LL-dd'),
        display: 'Cash; Credit Card; Check; Debit Card',
      },
    ],
    household_food_adequacy_last_12_months: [
      {
        value: 'sometimes_not_enough',
        date: now.minus({ weeks: 3 }).toFormat('yyyy-LL-dd'),
        display: 'Sometimes not enough to eat',
      },
    ],
  },
  defaultValues: {},
  config: {
    chartingGroups: {
      key: 'charting',
      groups: [
        {
          type: 'group',
          title: 'Member Details',
          groupKey: 'member_details',
          widgets: [
            {
              type: 'group',
              groupKey: 'basic_details',
              title: 'Basic Details',
              widgets: [
                {
                  type: 'flex-row',
                  name: 'member_details_grid',
                  maxSize: 'xl',
                  widgets: [
                    {
                      widget: {
                        type: 'data-display',
                        name: 'first_name',
                        label: 'Legal first name',
                        content: 'Conner',
                      },
                      size: 'md',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'last_name',
                        label: 'Legal last name',
                        content: 'Novicki',
                      },
                      size: 'md',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'member_phone_number',
                        label: 'Member phone number',
                        content: '+15022253532',
                      },
                      size: 'md',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'member_email',
                        label: 'Member email',
                        content: 'conner.novicki+1@foodsmart.com',
                      },
                      size: 'md',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'account_phone_number',
                        label: 'Account phone number',
                        content: '-',
                      },
                      size: 'md',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'account_email',
                        label: 'Account email',
                        content: 'conner.novicki+1@foodsmart.com',
                      },
                      size: 'md',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'dob',
                        label: 'Birthday',
                        content: '1990-12-07',
                      },
                      size: 'md',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'sex',
                        label: 'Sex',
                        content: 'M',
                      },
                      size: 'md',
                    },
                    {
                      size: 'full',
                      widget: {
                        type: 'data-display',
                        name: 'address',
                        label: 'Street address',
                        content: 'ABC 123',
                      },
                    },
                    {
                      size: 'md',
                      widget: {
                        type: 'data-display',
                        name: 'city',
                        label: 'City',
                        content: 'Louisville',
                      },
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'state',
                        label: 'State',
                        content: 'CA',
                      },
                      size: 'sm',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'zipcode',
                        label: 'Postal code',
                        content: '12345',
                      },
                      size: 'sm',
                    },
                  ],
                },
                {
                  type: 'single-checkbox',
                  key: 'member_details_confirmed',
                  checkboxLabel:
                    'Confirm member name, date of birth, and state where they are currently located.',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          type: 'group',
          title: 'Assessment',
          groupKey: 'assessment',
          widgets: [
            {
              type: 'group',
              groupKey: 'general_questions_group',
              title: 'General questions',
              widgets: [
                {
                  type: 'input:time',
                  inputLabel: 'Start time',
                  key: 'start_time',
                  required: true,
                  description: 'Timezone: HST',
                  size: 'md',
                },
                {
                  type: 'input:textarea',
                  inputLabel: 'Stated member goals',
                  key: 'stated_member_goals',
                  size: 'xl',
                },
                {
                  type: 'input:radio-v2',
                  label: 'What is your main reason for using Foodsmart?',
                  key: 'main_reason',
                  required: true,
                  prevAnswerPrompt: 'fillable',
                  options: [
                    {
                      label: 'I want to improve my general wellness',
                      value: 'general_wellness',
                    },
                    {
                      label: 'I want to lose weight',
                      value: 'lose_weight',
                    },
                    {
                      label: 'I want to gain weight',
                      value: 'gain_weight',
                    },
                    {
                      label: 'I want to improve my physical fitness',
                      value: 'improve_physical_fitness',
                    },
                    {
                      label: 'I want to improve my mental health',
                      value: 'improve_mental_health',
                    },
                    {
                      label: 'I want help supporting my Pregnancy',
                      value: 'supporting_pregnancy',
                    },
                    {
                      label: 'I want help with a Food Allergy',
                      value: 'help_with_food_allergy',
                    },
                    {
                      type: 'combobox',
                      label: 'Manage condition...',
                      inputLabel: 'Select condition',
                      value: 'manage_condition',
                      options: [
                        {
                          label: 'Non-diabetic hyperglycemia (Prediabetes)',
                          value: 'prediabetes',
                        },
                        {
                          label: 'Type 1 Diabetes',
                          value: 'type_1_diabetes',
                        },
                        {
                          label: 'Type 2 Diabetes',
                          value: 'type_2_diabetes',
                        },
                        {
                          label: 'Hypertension',
                          value: 'hypertension',
                        },
                        {
                          label: 'Irritable bowel syndrome',
                          value: 'ibs',
                        },
                        {
                          label: 'Mental disorder',
                          value: 'mental_disorder',
                        },
                        {
                          label: 'Congestive heart failure',
                          value: 'congestive_heart_failure',
                        },
                        {
                          label: 'Malignant neoplastic disease',
                          value: 'malignant_neoplastic_disease',
                        },
                        {
                          label: "Crohn's disease",
                          value: 'crohns_disease',
                        },
                        {
                          label: 'Ulcerative Colitis',
                          value: 'ulcerative_colitis',
                        },
                        {
                          label: 'Rheumatoid arthritis',
                          value: 'rheumatoid_arthritis',
                        },
                        {
                          label: 'Osteoarthritis',
                          value: 'osteoarthritis',
                        },
                        {
                          label: 'Cerebrovascular accident',
                          value: 'cerebrovascular_accident',
                        },
                        {
                          label: 'Phenylketonuria',
                          value: 'phenylketonuria',
                        },
                        {
                          label: 'Dementia',
                          value: 'dementia',
                        },
                        {
                          label: 'Disorder of liver',
                          value: 'disorder_of_liver',
                        },
                        {
                          label: 'Gallbladder calculus',
                          value: 'gallbladder_calculus',
                        },
                        {
                          label: 'Sleep apnea',
                          value: 'sleep_apnea',
                        },
                        {
                          label: 'Gastritis',
                          value: 'gastritis',
                        },
                        {
                          label: "Alzheimer's disease",
                          value: 'alzheimers_disease',
                        },
                        {
                          label: 'Chronic obstructive pulmonary disease',
                          value: 'copd',
                        },
                        {
                          label: 'Heart disease',
                          value: 'heart_disease',
                        },
                        {
                          label: 'Hypercholesterolemia',
                          value: 'hypercholesterolemia',
                        },
                        {
                          label: 'Disorder of Thyroid Gland',
                          value: 'disorder_of_thyroid_gland',
                        },
                        {
                          label: 'Chronic kidney disease',
                          value: 'chronic_kidney_disease',
                        },
                        {
                          label: 'End-stage renal disease',
                          value: 'end_stage_renal_disease',
                        },
                        {
                          label: 'Celiac disease',
                          value: 'celiac_disease',
                        },
                        {
                          label: 'Gestational diabetes mellitus',
                          value: 'gestational_diabetes_mellitus',
                        },
                        {
                          label: 'Pregnancy-induced hypertension',
                          value: 'pregnancy_induced_hypertension',
                        },
                        {
                          label: 'Pre-eclampsia',
                          value: 'pre_eclampsia',
                        },
                        {
                          label: 'Autoimmune disease',
                          value: 'autoimmune_disease',
                        },
                        {
                          label: 'Eating disorder',
                          value: 'eating_disorder',
                        },
                      ],
                    },
                    {
                      label: 'I want help getting & cooking healthy food',
                      value: 'help_getting_cooking_food',
                    },
                    {
                      label: 'I want help affording healthy food',
                      value: 'help_affording_food',
                    },
                  ],
                },
                {
                  type: 'conditional-tag-input',
                  label: 'Do you have any medical conditions?',
                  key: 'medical_conditions',
                  prevAnswerPrompt: 'fillable',
                  required: true,
                  inputLabel: 'Medical conditions',
                  options: [
                    {
                      label: 'Non-diabetic hyperglycemia (Prediabetes)',
                      value: 'prediabetes',
                    },
                    {
                      label: 'Type 1 Diabetes',
                      value: 'type_1_diabetes',
                    },
                    {
                      label: 'Type 2 Diabetes',
                      value: 'type_2_diabetes',
                    },
                    {
                      label: 'Hypertension',
                      value: 'hypertension',
                    },
                    {
                      label: 'IBS',
                      value: 'ibs',
                    },
                    {
                      label: 'Mental health condition (depression, anxiety, other)',
                      value: 'mental_health_condition',
                    },
                    {
                      label: 'Congestive Heart Failure',
                      value: 'congestive_heart_failure',
                    },
                    {
                      label: 'Cancer',
                      value: 'cancer',
                    },
                    {
                      label: "Crohn's Disease",
                      value: 'crohns_disease',
                    },
                    {
                      label: 'Ulcerative Colitis',
                      value: 'ulcerative_colitis',
                    },
                    {
                      label: 'Rheumatoid Arthritis',
                      value: 'rheumatoid_arthritis',
                    },
                    {
                      label: 'Osteoarthritis',
                      value: 'osteoarthritis',
                    },
                    {
                      label: 'Stroke',
                      value: 'stroke',
                    },
                    {
                      label: 'PKU',
                      value: 'pku',
                    },
                    {
                      label: 'Dementia',
                      value: 'dementia',
                    },
                    {
                      label: 'Liver Disease',
                      value: 'liver_disease',
                    },
                    {
                      label: 'Gallbladder Stones',
                      value: 'gallbladder_stones',
                    },
                    {
                      label: 'Sleep Apnea',
                      value: 'sleep_apnea',
                    },
                    {
                      label: 'Gastritis',
                      value: 'gastritis',
                    },
                    {
                      label: "Alzheimer's Disease",
                      value: 'alzheimers_disease',
                    },
                    {
                      label: 'COPD',
                      value: 'copd',
                    },
                    {
                      label: 'Heart disease',
                      value: 'heart_disease',
                    },
                    {
                      label: 'High cholesterol',
                      value: 'high_cholesterol',
                    },
                    {
                      label: 'Thyroid issues',
                      value: 'thyroid_issues',
                    },
                    {
                      label: 'Chronic kidney disease (CKD)',
                      value: 'chronic_kidney_disease',
                    },
                    {
                      label: 'End-stage renal disease (ESRD) or dialysis',
                      value: 'esrd',
                    },
                    {
                      label: 'Celiac disease',
                      value: 'celiac_disease',
                    },
                    {
                      label: 'Gestational diabetes',
                      value: 'gestational_diabetes',
                    },
                    {
                      label: 'Pregnancy Induced Hypertension',
                      value: 'pregnancy_induced_hypertension',
                    },
                    {
                      label: 'Preeclampsia',
                      value: 'preeclampsia',
                    },
                    {
                      label: 'Autoimmune Disease',
                      value: 'autoimmune_disease',
                    },
                    {
                      label: 'Eating disorders',
                      value: 'eating_disorders',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label: 'Do you smoke?',
                  key: 'member_is_smoker',
                  options: [
                    {
                      label: 'Yes',
                      value: 'smoker',
                    },
                    {
                      label: 'No',
                      value: 'non_smoker',
                    },
                  ],
                },
                {
                  type: 'single-checkbox',
                  checkboxLabel: 'The member is pregnant',
                  key: 'pregnancy',
                },
                {
                  type: 'conditional',
                  name: 'pregnancy_conditional_widgets',
                  conditions: [['booleanEquals', 'pregnancy', true]],
                  widgets: [
                    {
                      type: 'input:date',
                      key: 'pregnancy_due_date',
                      inputLabel: 'Due date',
                      size: 'md',
                    },
                    {
                      type: 'input:radio-v2',
                      label: 'High risk pregnancy',
                      sublabel:
                        'Has member been told by a provider that they are at high risk, are not currently receiving any prenatal care, or are high risk due to gestational diabetes, pregnancy-induced hypertension, history of SGA?',
                      size: 'xl',
                      key: 'pregnancy_risk',
                      options: [
                        {
                          label: 'No (Normal Pregnancy)',
                          value: 'normal_pregnancy',
                        },
                        {
                          label: 'Yes (High Risk Pregnancy)',
                          value: 'high_risk_pregnancy',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'single-checkbox',
                  checkboxLabel: 'The member is breast/chestfeeding',
                  key: 'is_breastfeeding',
                },
                {
                  type: 'conditional-tag-input',
                  label: 'Do you take any of the following medications?',
                  inputLabel: 'Medications',
                  required: true,
                  key: 'medications_list',
                  options: [
                    {
                      label: 'Appetite Suppressants (e.g., Contrave)',
                      value: 'appetite_suppressants',
                    },
                    {
                      label: 'GLP-1 Medications (e.g., WeGovy, Ozempic, Mounjaro, Zepbound)',
                      value: 'glp1_medications',
                    },
                    {
                      label: 'Lipase Inhibitors (e.g., Orlistat)',
                      value: 'lipase_inhibitors',
                    },
                    {
                      label:
                        'Phentermine Medications (e.g., Adipex, Atti-Plex P, Fastin, Ionamin, Lomaira, Phentercot, Phentride, Pro-Fast)',
                      value: 'phentermine_medications',
                    },
                    {
                      label: 'Blood Pressure Medications',
                      value: 'blood_pressure_medications',
                    },
                    {
                      label:
                        'Diabetes Medications (e.g., Metformin, Insulin, SLGT2 Inhibitor, DPP4-inhibitor)',
                      value: 'diabetes_medications',
                    },
                    {
                      label: 'Mental Health Medications (e.g., Anxiety, Depression)',
                      value: 'mental_health_medications',
                    },
                    {
                      label: 'Thyroid Medications',
                      value: 'thyroid_medications',
                    },
                    {
                      label: 'Cholesterol Medications (e.g., Statins)',
                      value: 'cholesterol_medications',
                    },
                    {
                      label: 'Diuretic Medications (e.g., Lasix)',
                      value: 'diuretic_medications',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label:
                    'Have you been in a medical facility for inpatient treatment in the last 90 days?',
                  key: 'inpatient_visit_last_90_days',
                  prevAnswerPrompt: 'fillable',
                  options: [
                    {
                      label: 'Yes - Inpatient Treatment in the last 90 days',
                      value: 'inpatient_treatment_last_90_days',
                    },
                    {
                      label: 'No inpatient care in the last 90 days',
                      value: 'no_inpatient_care_last_90_days',
                    },
                  ],
                },
                {
                  type: 'conditional',
                  conditions: [
                    [
                      'stringEquals',
                      'inpatient_visit_last_90_days',
                      'inpatient_treatment_last_90_days',
                    ],
                  ],
                  name: 'conditional_inpatient_treatment_questions',
                  widgets: [
                    {
                      type: 'input:date',
                      key: 'inpatient_discharge_date',
                      prevAnswerPrompt: 'fillable',
                      size: 'md',
                      inputLabel: 'Discharge date',
                      max: '2024-10-08T18:56:39.056Z',
                    },
                    {
                      type: 'multi-select',
                      key: 'inpatient_visit_facility',
                      prevAnswerPrompt: 'fillable',
                      size: 'md',
                      label: 'Facility',
                      sublabel: 'Leave unselected of member chooses to not disclose',
                      options: [
                        {
                          label: 'Long-term Acute Care',
                          value: 'long_term_acute_care',
                        },
                        {
                          label: 'Hospital',
                          value: 'hospital',
                        },
                        {
                          label: 'Skilled Nursing Facility',
                          value: 'skilled_nursing_facility',
                        },
                      ],
                    },
                    {
                      type: 'input:combobox',
                      key: 'reason_for_inpatient_visit',
                      size: 'md',
                      prevAnswerPrompt: 'fillable',
                      inputLabel: 'Reason for admission',
                      options: [
                        {
                          label: 'Sepsis',
                          value: 'sepsis',
                        },
                        {
                          label: 'Pneumonia',
                          value: 'pneumonia',
                        },
                        {
                          label: 'Heart Failure',
                          value: 'heart_failure',
                        },
                        {
                          label: 'Acute Myocardial Infarction',
                          value: 'acute_myocardial_infarction',
                        },
                        {
                          label: 'Cardiac Arrhythmia',
                          value: 'cardiac_arrhythmia',
                        },
                        {
                          label: 'Cerebral Infarction',
                          value: 'cerebral_infarction',
                        },
                        {
                          label: 'Drug Overdose',
                          value: 'drug_overdose',
                        },
                        {
                          label: 'Food Poisoning',
                          value: 'food_poisoning',
                        },
                        {
                          label: 'Gastrointestinal Tract Disorder',
                          value: 'gastrointestinal_tract_disorder',
                        },
                        {
                          label: 'Cardiovascular Disease',
                          value: 'cardiovascular_disease',
                        },
                        {
                          label: 'Osteoarthritis',
                          value: 'osteoarthritis',
                        },
                        {
                          label: 'Diabetes',
                          value: 'diabetes',
                        },
                        {
                          label: 'Acute and Unspecified Renal Failure',
                          value: 'acute_and_unspecified_renal_failure',
                        },
                        {
                          label: 'COPD',
                          value: 'copd',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'conditional-tag-input',
                  label: 'Do you have any of the following GI Symptoms?',
                  key: 'gi_symptoms',
                  inputLabel: 'GI Symptoms',
                  options: [
                    {
                      label: 'Abdominal Bloating',
                      value: 'gi_symptoms_bloating',
                    },
                    {
                      label: 'Gaseous substance',
                      value: 'gi_symptoms_gas',
                    },
                    {
                      label: 'Diarrhea',
                      value: 'gi_symptoms_diarrhea',
                    },
                    {
                      label: 'Heartburn',
                      value: 'gi_symptoms_heartburn',
                    },
                    {
                      label: 'Constipation',
                      value: 'gi_symptoms_constipation',
                    },
                    {
                      label: 'Nausea',
                      value: 'gi_symptoms_nausea',
                    },
                    {
                      label: 'Vomiting',
                      value: 'gi_symptoms_vomiting',
                    },
                    {
                      label: 'Difficulty chewing',
                      value: 'gi_symptoms_chewing_difficulty',
                    },
                    {
                      label: 'Difficulty swallowing',
                      value: 'gi_symptoms_swallowing_difficulty',
                    },
                    {
                      label: 'Gastrointestinal Pain',
                      value: 'gi_symptoms_pain',
                    },
                  ],
                },
              ],
            },
            {
              type: 'group',
              groupKey: 'biometrics_questions_group',
              title: 'Biometrics',
              widgets: [
                {
                  type: 'flex-row',
                  name: 'height_grid',
                  title: 'Height',
                  maxSize: 'xl',
                  widgets: [
                    {
                      size: 'sm',
                      widget: {
                        type: 'input:number',
                        inputLabel: 'Feet',
                        key: 'height_feet',
                        prevAnswerPrompt: 'fillable',
                        min: 0,
                        max: 10,
                      },
                    },
                    {
                      size: 'sm',
                      widget: {
                        type: 'input:number',
                        inputLabel: 'Inches',
                        key: 'height_inches',
                        prevAnswerPrompt: 'fillable',
                        min: 0,
                        max: 11,
                        decimalScale: 1,
                      },
                    },
                  ],
                },
                {
                  type: 'questions-with-date',
                  key: 'weight',
                  dateInputLabel: 'Date recorded',
                  maxDate: '2024-10-08T18:56:39.064Z',
                  question: {
                    type: 'input:number',
                    size: 'md',
                    prevAnswerPrompt: 'fillable',
                    inputLabel: 'Weight (lbs)',
                    min: 0,
                    max: 1000,
                    decimalScale: 1,
                  },
                },
                {
                  type: 'group',
                  groupKey: 'blood_pressure_group',
                  title: 'Blood pressure (mmHg)',
                  widgets: [
                    {
                      type: 'questions-with-date',
                      size: 'xl',
                      key: 'blood_pressure_systolic',
                      dateInputLabel: 'Date recorded',
                      maxDate: '2024-10-08T18:56:39.068Z',
                      question: {
                        type: 'input:number',
                        size: 'sm',
                        prevAnswerPrompt: 'fillable',
                        inputLabel: 'Systolic',
                        min: 1,
                        max: 1000,
                      },
                    },
                    {
                      type: 'questions-with-date',
                      size: 'xl',
                      key: 'blood_pressure_diastolic',
                      dateInputLabel: 'Date recorded',
                      maxDate: '2024-10-08T18:56:39.071Z',
                      question: {
                        type: 'input:number',
                        size: 'sm',
                        prevAnswerPrompt: 'fillable',
                        inputLabel: 'Diastolic',
                        min: 1,
                        max: 1000,
                      },
                    },
                    {
                      type: 'questions-with-date',
                      key: 'a1c',
                      size: 'xl',
                      dateInputLabel: 'Date recorded',
                      maxDate: '2024-10-08T18:56:39.075Z',
                      question: {
                        type: 'input:number',
                        size: 'md',
                        prevAnswerPrompt: 'fillable',
                        inputLabel: 'A1c lab results (%)',
                        min: 0,
                        max: 1000,
                        decimalScale: 1,
                      },
                    },
                  ],
                },
                {
                  type: 'group',
                  groupKey: 'lipids_group',
                  title: 'Most recent lipids measurements',
                  widgets: [
                    {
                      type: 'questions-with-date',
                      key: 'hdl',
                      size: 'xl',
                      dateInputLabel: 'Date recorded',
                      maxDate: '2024-10-08T18:56:39.078Z',
                      question: {
                        size: 'md',
                        type: 'input:number',
                        prevAnswerPrompt: 'fillable',
                        inputLabel: 'HDL (mg/DL)',
                        min: 0,
                        max: 1000,
                        decimalScale: 1,
                      },
                    },
                    {
                      type: 'questions-with-date',
                      key: 'ldl',
                      size: 'xl',
                      dateInputLabel: 'Date recorded',
                      maxDate: '2024-10-08T18:56:39.083Z',
                      question: {
                        type: 'input:number',
                        size: 'md',
                        prevAnswerPrompt: 'fillable',
                        inputLabel: 'LDL (mg/DL)',
                        min: 0,
                        max: 1000,
                        decimalScale: 1,
                      },
                    },
                    {
                      type: 'questions-with-date',
                      key: 'triglycerides',
                      size: 'xl',
                      dateInputLabel: 'Date recorded',
                      maxDate: '2024-10-08T18:56:39.086Z',
                      question: {
                        type: 'input:number',
                        size: 'md',
                        prevAnswerPrompt: 'fillable',
                        inputLabel: 'Triglycerides (mg/DL)',
                        min: 0,
                        max: 5000,
                        decimalScale: 1,
                      },
                    },
                    {
                      type: 'questions-with-date',
                      key: 'total_cholesterol',
                      size: 'xl',
                      dateInputLabel: 'Date recorded',
                      maxDate: '2024-10-08T18:56:39.092Z',
                      question: {
                        type: 'input:number',
                        size: 'md',
                        prevAnswerPrompt: 'fillable',
                        inputLabel: 'Total Cholesterol (mg/DL)',
                        min: 0,
                        max: 1000,
                        decimalScale: 1,
                      },
                    },
                  ],
                },
              ],
            },
            {
              type: 'group',
              groupKey: 'diet_type_group',
              title: 'Diet type',
              widgets: [
                {
                  type: 'conditional-tag-input',
                  label: 'Are you on a specialized diet?',
                  key: 'specialized_diet_type',
                  size: 'xl',
                  inputLabel: 'Diet type',
                  placeholder: 'Select diet',
                  options: [
                    {
                      label: 'Vegetarian',
                      value: 'vegetarian',
                    },
                    {
                      label: 'Vegan',
                      value: 'vegan',
                    },
                    {
                      label: 'Pescatarian',
                      value: 'pescatarian',
                    },
                    {
                      label: 'Halal',
                      value: 'halal',
                    },
                    {
                      label: 'Kosher',
                      value: 'kosher',
                    },
                    {
                      label: 'High Protein',
                      value: 'high_protein',
                    },
                    {
                      label: 'Low Carb Diet',
                      value: 'low_carb',
                    },
                    {
                      label: 'Atkins Diet',
                      value: 'atkins',
                    },
                    {
                      label: 'Keto',
                      value: 'keto',
                    },
                    {
                      label: 'Intermittent Fasting',
                      value: 'intermittent_fasting',
                    },
                    {
                      label: 'Low Fat Diet',
                      value: 'low_fat',
                    },
                    {
                      label: 'Low Sodium',
                      value: 'low_sodium',
                    },
                    {
                      label: 'Pureed or Soft Diet',
                      value: 'pureed_soft',
                    },
                    {
                      label: 'Low FODMAP Diet',
                      value: 'low_fodmap',
                    },
                    {
                      label: 'Pregnancy Diet',
                      value: 'pregnancy_diet',
                    },
                    {
                      label: 'AIP (Autoimmune Protocol) Diet',
                      value: 'aip_diet',
                    },
                  ],
                },
                {
                  type: 'conditional-tag-input',
                  label: 'Do you have any of the following sensitivities or intolerences?',
                  key: 'food_sensitivity_intolerance',
                  size: 'xl',
                  inputLabel: 'Sensitivities',
                  placeholder: 'Select sensitivities or intolerances',
                  prevAnswerPrompt: 'fillable',
                  options: [
                    {
                      label: 'Intolerance to Lactose',
                      value: 'lactose_intolerance',
                    },
                    {
                      label: 'Intolerance to Milk',
                      value: 'milk_intolerance',
                    },
                    {
                      label: 'Gluten Intolerance',
                      value: 'gluten_intolerance',
                    },
                    {
                      label: 'Non-celiac Gluten Sensitivity',
                      value: 'non_celiac_gluten_sensitivity',
                    },
                    {
                      label: 'Intolerance to Wheat',
                      value: 'wheat_intolerance',
                    },
                    {
                      label: 'Intolerance to Monosodium Glutamate',
                      value: 'monosodium_glutamate_intolerance',
                    },
                    {
                      label: 'Histamine Intolerance',
                      value: 'histamine_intolerance',
                    },
                    {
                      label: 'FODMAP Intolerance',
                      value: 'fodmap_intolerance',
                    },
                    {
                      label: 'Nightshades Intolerance',
                      value: 'nightshades_intolerance',
                    },
                  ],
                },
                {
                  type: 'conditional-tag-input',
                  label: 'Do you have any of the following food allergies?',
                  key: 'food_allergy',
                  size: 'xl',
                  inputLabel: 'Allergies',
                  placeholder: 'Select allergies',
                  options: [
                    {
                      label: 'Milk or Dairy',
                      value: 'milk_dairy_allergy',
                    },
                    {
                      label: 'Egg',
                      value: 'egg_allergy',
                    },
                    {
                      label: 'Fish (e.g., bass, flounder, cod)',
                      value: 'fish_allergy',
                    },
                    {
                      label: 'Shellfish (e.g., crab, lobster, shrimp)',
                      value: 'shellfish_allergy',
                    },
                    {
                      label:
                        'Tree nut (e.g., almonds, walnuts, pecans, cashew, hazelnut, macadamia)',
                      value: 'tree_nut_allergy',
                    },
                    {
                      label: 'Peanut',
                      value: 'peanut_allergy',
                    },
                    {
                      label: 'Wheat',
                      value: 'wheat_allergy',
                    },
                    {
                      label: 'Soy',
                      value: 'soy_allergy',
                    },
                    {
                      label: 'Sesame',
                      value: 'sesame_allergy',
                    },
                    {
                      label: 'Poppy Seed',
                      value: 'poppy_seed_allergy',
                    },
                    {
                      label: 'Gluten',
                      value: 'gluten_allergy',
                    },
                    {
                      label: 'Red Meat',
                      value: 'red_meat_allergy',
                    },
                    {
                      label: 'Corn',
                      value: 'corn_allergy',
                    },
                    {
                      label: 'Fruit',
                      value: 'fruit_allergy',
                    },
                    {
                      label: 'Tryptophan',
                      value: 'tryptophan_allergy',
                    },
                    {
                      label: 'Alcohol',
                      value: 'alcohol_allergy',
                    },
                  ],
                },
                {
                  type: 'conditional-tag-input',
                  label: 'Do you take any of the following vitamins and or supplements?',
                  key: 'vitamin_supplements',
                  size: 'xl',
                  inputLabel: 'Supplements or vitamins',
                  placeholder: 'Select supplements or vitamins',
                  options: [
                    {
                      label: 'Vitamin A',
                      value: 'vitamin_a',
                    },
                    {
                      label: 'Vitamin B6',
                      value: 'vitamin_b6',
                    },
                    {
                      label: 'Vitamin B12',
                      value: 'vitamin_b12',
                    },
                    {
                      label: 'Vitamin C',
                      value: 'vitamin_c',
                    },
                    {
                      label: 'Vitamin D',
                      value: 'vitamin_d',
                    },
                    {
                      label: 'Vitamin E',
                      value: 'vitamin_e',
                    },
                    {
                      label: 'Omega-3 fatty acids',
                      value: 'omega_3_fatty_acids',
                    },
                    {
                      label: 'Folate',
                      value: 'folate',
                    },
                    {
                      label: 'Biotin',
                      value: 'biotin',
                    },
                    {
                      label: 'Niacin',
                      value: 'niacin',
                    },
                    {
                      label: 'Magnesium',
                      value: 'magnesium',
                    },
                    {
                      label: 'Iron',
                      value: 'iron',
                    },
                    {
                      label: 'Pantoethenic Acid',
                      value: 'pantoethenic_acid',
                    },
                    {
                      label: 'Riboflavin',
                      value: 'riboflavin',
                    },
                    {
                      label: 'Thiamine',
                      value: 'thiamine',
                    },
                    {
                      label: 'Calcium',
                      value: 'calcium',
                    },
                    {
                      label: 'Multivitamin',
                      value: 'multivitamin',
                    },
                  ],
                },
                {
                  type: 'input:number',
                  min: 0,
                  max: 10,
                  label: 'How many meals do you eat per day?',
                  key: 'meals_per_day',
                  inputLabel: 'Meals',
                  size: 'sm',
                },
                {
                  type: 'input:time',
                  label: 'On average, what time is your first meal?',
                  inputLabel: 'First meal',
                  key: 'first_meal_of_day_time',
                  size: 'sm',
                },
                {
                  type: 'input:time',
                  label: 'On average, what time is your last meal?',
                  inputLabel: 'Last meal',
                  key: 'last_meal_of_day_time',
                  size: 'sm',
                },
                {
                  type: 'input:textarea',
                  key: 'diet_recall',
                  inputLabel: 'Diet recall',
                },
              ],
            },
            {
              type: 'group',
              title: 'Lifestyle',
              groupKey: 'lifestyle_group',
              widgets: [
                {
                  type: 'input:combobox',
                  label: "What's your current working situation?",
                  key: 'current_work_situation',
                  inputLabel: 'Working situation',
                  size: 'lg',
                  options: [
                    {
                      type: 'group',
                      groupLabel: 'Employed',
                      options: [
                        {
                          label: 'Full-time',
                          value: 'full_time',
                        },
                        {
                          label: 'Part-time',
                          value: 'part_time',
                        },
                        {
                          label: 'Seasonal or temporary',
                          value: 'seasonal_or_temp',
                        },
                      ],
                    },
                    {
                      value: 'unemployed',
                      label: 'Unemployed',
                    },
                    {
                      value: 'retired',
                      label: 'Retired',
                    },
                    {
                      value: 'student',
                      label: 'Student',
                    },
                    {
                      value: 'caretaker_for_family_members',
                      label: 'Caretaker for family members',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label: "What's your current activity level?",
                  key: 'activity_level',
                  options: [
                    {
                      type: 'basic',
                      label: 'Low',
                      sublabel: 'Only the physical activity of independent living.',
                      value: 'low',
                    },
                    {
                      type: 'basic',
                      label: 'Medium',
                      sublabel: 'Equivalent to walking about 1.5-3 miles per day at 3-4 mph.',
                      value: 'medium',
                    },
                    {
                      type: 'basic',
                      label: 'High',
                      sublabel: 'Equivalent to walking 3+ miles per day at 3-4 mph.',
                      value: 'high',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label:
                    'For the past 6 months, to what extent have you been limited because of a health problem in activities people usually do?',
                  key: 'health_related_activity_limitations',
                  options: [
                    {
                      label: 'Not limited at all',
                      value: 'not_limited_at_all',
                    },
                    {
                      label: 'Somewhat limited',
                      value: 'somewhat_limited',
                    },
                    {
                      label: 'Severely limited',
                      value: 'severely_limited',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label:
                    'If you were in trouble, do you have relatives or friends you can count on to help you whenever you need them?',
                  key: 'social_support',
                  options: [
                    {
                      label: 'Always',
                      value: 'always',
                    },
                    {
                      label: 'Sometimes',
                      value: 'sometimes',
                    },
                    {
                      label: 'Never',
                      value: 'never',
                    },
                  ],
                },
                {
                  type: 'input:number',
                  label:
                    'How many hours of sleep do you get a night on average over the past 6 months?',
                  min: 1,
                  max: 14,
                  key: 'average_sleep_duration',
                  inputLabel: 'Hours',
                  size: 'sm',
                },
              ],
            },
            {
              type: 'group',
              title: 'Cooking habits',
              groupKey: 'cooking_habits_group',
              widgets: [
                {
                  type: 'input:radio-v2',
                  label: 'Who does most of the cooking in your household?',
                  key: 'cooking_responsibility',
                  options: [
                    {
                      label: 'I do most of the cooking',
                      value: 'most_cooking_me',
                    },
                    {
                      label: 'Other household members do most of the cooking',
                      value: 'most_cooking_others',
                    },
                    {
                      label: 'Cooking is shared between me and other household members',
                      value: 'cooking_shared',
                    },
                    {
                      label: 'No one cooks in my household',
                      value: 'no_one_cooks',
                    },
                    {
                      label: 'Other',
                      value: 'other',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label:
                    'How often do you cook meals at home or have them cooked by a household member?',
                  key: 'cooking_frequency_at_home',
                  options: [
                    {
                      label: 'Never or rarely (<1 time per month)',
                      value: 'never_rarely',
                    },
                    {
                      label: 'Monthly (1-3 times per month)',
                      value: 'monthly',
                    },
                    {
                      label: 'Weekly (1-6 times per week)',
                      value: 'weekly',
                    },
                    {
                      label: 'Daily',
                      value: 'daily',
                    },
                  ],
                },
                {
                  type: 'multi-select',
                  label: 'For what reason(s) were meals made in other ways?',
                  key: 'meal_preparation_reason',
                  options: [
                    {
                      label: 'I don’t know how to cook',
                      value: 'dont_know_how_to_cook',
                    },
                    {
                      label: 'I’m not interested in cooking',
                      value: 'not_interested_in_cooking',
                    },
                    {
                      label: 'I don’t have the time to cook',
                      value: 'dont_have_time_to_cook',
                    },
                    {
                      label: 'Cooking is too expensive',
                      value: 'cooking_is_too_expensive',
                    },
                    {
                      label: 'Other',
                      value: 'other',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label: 'How often do you purchase groceries?',
                  sublabel: 'Skip if member does not buy groceries',
                  key: 'grocery_purchasing_frequency',
                  options: [
                    {
                      label: 'Never or rarely (<1 time per month)',
                      value: 'never_rarely',
                    },
                    {
                      label: 'Monthly (1-3 times per month)',
                      value: 'monthly',
                    },
                    {
                      label: 'Weekly (1-6 times per week)',
                      value: 'weekly',
                    },
                    {
                      label: 'Daily',
                      value: 'daily',
                    },
                  ],
                },
                {
                  type: 'multi-select',
                  label: 'How do you typically get your groceries?',
                  key: 'grocery_acquisition_method',
                  options: [
                    {
                      label: 'Walk to the store',
                      value: 'walk_to_store',
                    },
                    {
                      label: 'Drive to the store',
                      value: 'drive_to_store',
                    },
                    {
                      label: 'Public transit (bus, subway, train) to the store',
                      value: 'public_transit_to_store',
                    },
                    {
                      label: 'Other mode of transportation',
                      value: 'other_transportation',
                    },
                    {
                      label: 'Ask a friend to buy',
                      value: 'ask_friend_to_buy',
                    },
                    {
                      label: 'Order online for delivery',
                      value: 'order_online_for_delivery',
                    },
                    {
                      label: "I don't buy groceries for my household",
                      value: 'dont_buy_groceries',
                    },
                    {
                      label: 'Other',
                      value: 'other',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label:
                    'How often do you order take out or visit a restaurant/fast food establishment?',
                  key: 'takeout_restaurant_frequency',
                  options: [
                    {
                      label: 'Never or rarely (<1 time per month)',
                      value: 'never_rarely',
                    },
                    {
                      label: 'Monthly (1-3 times per month)',
                      value: 'monthly',
                    },
                    {
                      label: 'Weekly (1-6 times per week)',
                      value: 'weekly',
                    },
                    {
                      label: 'Daily',
                      value: 'daily',
                    },
                  ],
                },
              ],
            },
            {
              type: 'group',
              title: 'Food security',
              groupKey: 'food_security_group',
              widgets: [
                {
                  type: 'multi-select',
                  label: 'How do you typically pay for your groceries?',
                  key: 'grocery_payment_method',
                  sublabel: 'Skip if member does not buy groceries',
                  prevAnswerPrompt: 'fillable',
                  options: [
                    {
                      label: 'Cash',
                      value: 'cash',
                    },
                    {
                      label: 'Check',
                      value: 'check',
                    },
                    {
                      label: 'Credit card',
                      value: 'credit_card',
                    },
                    {
                      label: 'Debit card',
                      value: 'debit_card',
                    },
                    {
                      label: 'EBT Card',
                      value: 'ebt_card',
                    },
                    {
                      label: "I have an EBT card, but don't use it",
                      value: 'ebt_card_but_dont_use',
                    },
                    {
                      label: "I don't buy groceries for my household",
                      value: 'dont_buy_groceries_for_household',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label:
                    'In the last 12 months, how often were you worried that food would run out before you got money to buy more?',
                  key: 'food_shortage_worry_frequency',
                  options: [
                    {
                      label: 'Often',
                      value: 'often',
                    },
                    {
                      label: 'Sometimes',
                      value: 'sometimes',
                    },
                    {
                      label: 'Never',
                      value: 'never',
                    },
                    {
                      label: "Don't Know or I'd prefer not to say",
                      value: 'dont_know_prefer_not_to_say',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label:
                    'In the last 12 months, how often did the food you buy not last, and you didn’t have money to get more?',
                  key: 'food_security_last_12_months',
                  options: [
                    {
                      label: 'Often',
                      value: 'often',
                    },
                    {
                      label: 'Sometimes',
                      value: 'sometimes',
                    },
                    {
                      label: 'Never',
                      value: 'never',
                    },
                    {
                      label: "Don't Know or I'd prefer not to say",
                      value: 'dont_know_prefer_not_to_say',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label:
                    'Select which of these statements best describes the food eaten in your household in the last 12 months.',
                  key: 'household_food_adequacy_last_12_months',
                  prevAnswerPrompt: 'fillable',
                  options: [
                    {
                      label: 'Enough of the kinds of food we want to eat',
                      value: 'enough_food_we_want',
                    },
                    {
                      label: 'Enough but not always the kinds of food we want',
                      value: 'enough_but_not_always_wanted',
                    },
                    {
                      label: 'Sometimes not enough to eat',
                      value: 'sometimes_not_enough',
                    },
                    {
                      label: 'Often not enough to eat',
                      value: 'often_not_enough',
                    },
                    {
                      label: "Don't Know or I'd prefer not to say",
                      value: 'dont_know_prefer_not_to_say',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  key: 'difficulty_getting_eating_healthy_foods',
                  label:
                    'Thinking about the last 12 months, how hard was it for you or your household to regularly get and eat healthy foods?',
                  options: [
                    {
                      label: 'Very hard',
                      value: 'very_hard',
                    },
                    {
                      label: 'Hard',
                      value: 'hard',
                    },
                    {
                      label: 'Somewhat hard',
                      value: 'somewhat_hard',
                    },
                    {
                      label: 'Not very hard',
                      value: 'not_very_hard',
                    },
                    {
                      label: 'Not hard at all',
                      value: 'not_hard_at_all',
                    },
                    {
                      label: "Don't know or I'd prefer not to say",
                      value: 'dont_know_prefer_not_to_say',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  key: 'snap_ebt_assistance_interest',
                  label: 'Are you interested in having Foodsmart help you with SNAP/EBT benefits?',
                  sublabel:
                    'Unsure about eligibility? Use the &lt;a href&#x3D;&quot;https:&#x2F;&#x2F;www.snapscreener.com&#x2F;screener&quot; target&#x3D;&quot;_blank&quot;&gt;SNAP screening tool&lt;&#x2F;a&gt;',
                  options: [
                    {
                      label:
                        'Yes, I’m interested and would like help applying for SNAP or EBT benefits.',
                      value: 'interested_applying_snap_ebt',
                    },
                    {
                      label: 'Yes, My SNAP/EBT benefits will expire soon or have already expired, and I would like help with reapplying.',
                      value: 'interested_reapplying_snap_ebt',
                    },
                    {
                      label: 'No, I have my EBT card.',
                      value: 'already_have_ebt_card',
                    },
                    {
                      label:
                        'No, I have already applied for SNAP or EBT benefits and it is pending.',
                      value: 'applied_pending',
                    },
                    {
                      label: 'No I applied and benefits were denied.',
                      value: 'applied_denied',
                    },
                    {
                      label: 'No, I’m not interested.',
                      value: 'not_interested_snap_ebt',
                    },
                  ],
                },
                {
                  type: 'input:number',
                  key: 'weekly_food_budget',
                  label: 'What is your weekly food budget?',
                  inputLabel: 'Budget',
                  decimalScale: 2,
                  size: 'sm',
                },
                {
                  type: 'input:radio-v2',
                  label: 'About how far do you live from your nearest grocery store?',
                  key: 'distance_from_grocery',
                  options: [
                    {
                      label: '<1 mile',
                      value: 'less_than_1_mile',
                    },
                    {
                      label: '1-5 miles',
                      value: '1-5_miles',
                    },
                    {
                      label: '5-10 miles',
                      value: '5-10_miles',
                    },
                    {
                      label: '10-25 miles',
                      value: '10-25_miles',
                    },
                    {
                      label: '25+ miles',
                      value: '25+_miles',
                    },
                  ],
                },
                {
                  type: 'multi-select',
                  label: '"I am confident in my abilities to..."',
                  key: 'confidence_in_food_abilities',
                  options: [
                    {
                      label: 'wash food',
                      value: 'wash_food',
                    },
                    {
                      label: 'cut up food',
                      value: 'cut_up_food',
                    },
                    {
                      label: 'heat up food',
                      value: 'heat_up_food',
                    },
                    {
                      label: 'cook food in an oven, stovetop, or hot plate',
                      value: 'cook_food_in_oven_stovetop_hot_plate',
                    },
                    {
                      label: 'store my food in the refrigerator',
                      value: 'store_food_in_refrigerator',
                    },
                    {
                      label: 'save my food in the freezer',
                      value: 'save_food_in_freezer',
                    },
                  ],
                },
                {
                  type: 'multi-select',
                  label: '"When I think about food, I feel that food..."',
                  key: 'emotional_response_to_food',
                  options: [
                    {
                      label: 'Food stresses me out',
                      value: 'food_stresses_me_out',
                    },
                    {
                      label: 'Food feels like a chore',
                      value: 'food_feels_like_a_chore',
                    },
                    {
                      label: 'Food brings me joy',
                      value: 'food_brings_me_joy',
                    },
                    {
                      label: 'Food brings me closer to the people I care about',
                      value: 'food_brings_me_closer_to_people',
                    },
                    {
                      label: 'None',
                      value: 'none',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'group',
          title: 'Treatment plan',
          groupKey: 'treatment_plan',
          widgets: [
            {
              type: 'group',
              title: 'PES statement',
              groupKey: 'pes_statement',
              widgets: [
                {
                  type: 'tiered-inputs',
                  key: 'pes_statement',
                  size: 'xl',
                  inputs: [
                    {
                      type: 'tiered-combobox',
                      key: 'nutrition_diagnosis',
                      inputLabel: 'Member with...',
                      required: true,
                      props: [
                        {
                          then: {
                            options: [
                              {
                                label: 'Increased energy expenditure',
                                value: 'increased_energy_expenditure',
                              },
                              {
                                label: 'Inadequate (suboptimal) energy intake',
                                value: 'inadequate_energy_intake',
                              },
                              {
                                label: 'Excessive energy intake',
                                value: 'excessive_energy_intake',
                              },
                              {
                                label: 'Inadequate (suboptimal) oral intake',
                                value: 'inadequate_oral_intake',
                              },
                              {
                                label: 'Excessive oral intake',
                                value: 'excessive_oral_intake',
                              },
                              {
                                label: 'Limited food acceptance',
                                value: 'limited_food_acceptance',
                              },
                              {
                                label: 'Inadequate EN infusion',
                                value: 'inadequate_en_infusion',
                              },
                              {
                                label: 'Excessive EN infusion',
                                value: 'excessive_en_infusion',
                              },
                              {
                                label: 'EN composition inconsistent with needs',
                                value: 'en_composition_inconsistent_with_needs',
                              },
                              {
                                label: 'EN administration inconsistent with needs',
                                value: 'en_administration_inconsistent_with_needs',
                              },
                              {
                                label: 'Inadequate PN infusion',
                                value: 'inadequate_pn_infusion',
                              },
                              {
                                label: 'Excessive PN infusion',
                                value: 'excessive_pn_infusion',
                              },
                              {
                                label: 'PN composition inconsistent with needs',
                                value: 'pn_composition_inconsistent_with_needs',
                              },
                              {
                                label: 'PN administration inconsistent with needs',
                                value: 'pn_administration_inconsistent_with_needs',
                              },
                              {
                                label: 'Inadequate fluid intake',
                                value: 'inadequate_fluid_intake',
                              },
                              {
                                label: 'Excessive fluid intake',
                                value: 'excessive_fluid_intake',
                              },
                              {
                                label: 'Inadequate bioactive substance intake',
                                value: 'inadequate_bioactive_substance_intake',
                              },
                              {
                                label: 'Excessive bioactive substance intake',
                                value: 'excessive_bioactive_substance_intake',
                              },
                              {
                                label: 'Increased nutrient needs',
                                value: 'increased_nutrient_needs',
                              },
                              {
                                label: 'Decreased nutrient needs',
                                value: 'decreased_nutrient_needs',
                              },
                              {
                                label: 'Imbalance of nutrients',
                                value: 'imbalance_of_nutrients',
                              },
                              {
                                label: 'Inadequate (suboptimal) protein-energy intake',
                                value: 'inadequate_protein_energy_intake',
                              },
                              {
                                label: 'Inadequate fat intake',
                                value: 'inadequate_fat_intake',
                              },
                              {
                                label: 'Excessive fat intake',
                                value: 'excessive_fat_intake',
                              },
                              {
                                label: 'Intake of types of fats inconsistent with needs',
                                value: 'intake_of_types_of_fats_inconsistent_with_needs',
                              },
                              {
                                label: 'Inadequate protein intake',
                                value: 'inadequate_protein_intake',
                              },
                              {
                                label: 'Excessive protein intake',
                                value: 'excessive_protein_intake',
                              },
                              {
                                label:
                                  'Intake of types of proteins or amino acids inconsistent with needs',
                                value: 'intake_of_proteins_inconsistent_with_needs',
                              },
                              {
                                label: 'Inadequate carbohydrate intake',
                                value: 'inadequate_carbohydrate_intake',
                              },
                              {
                                label: 'Excessive carbohydrate intake',
                                value: 'excessive_carbohydrate_intake',
                              },
                              {
                                label: 'Intake of types of carbohydrates inconsistent with needs',
                                value: 'intake_of_carbs_inconsistent_with_needs',
                              },
                              {
                                label: 'Inconsistent carbohydrates',
                                value: 'inconsistent_carbohydrates',
                              },
                              {
                                label: 'Inadequate fiber intake',
                                value: 'inadequate_fiber_intake',
                              },
                              {
                                label: 'Excessive fiber intake',
                                value: 'excessive_fiber_intake',
                              },
                              {
                                label: 'Inadequate intake of vitamin or mineral',
                                value: 'inadequate_vitamin_mineral_intake',
                              },
                              {
                                label: 'Excessive intake of vitamin or mineral',
                                value: 'excessive_vitamin_mineral_intake',
                              },
                              {
                                label: 'Swallowing difficulty',
                                value: 'swallowing_difficulty',
                              },
                              {
                                label: 'Biting or chewing difficulty',
                                value: 'biting_chewing_difficulty',
                              },
                              {
                                label: 'Breastfeeding difficulty',
                                value: 'breastfeeding_difficulty',
                              },
                              {
                                label: 'Altered GI function',
                                value: 'altered_gi_function',
                              },
                              {
                                label: 'Impaired nutrient utilization',
                                value: 'impaired_nutrient_utilization',
                              },
                              {
                                label: 'Altered nutrition-related laboratory values',
                                value: 'altered_nutrition_related_lab_values',
                              },
                              {
                                label: 'Food-medication interaction',
                                value: 'food_medication_interaction',
                              },
                              {
                                label: 'Underweight',
                                value: 'underweight',
                              },
                              {
                                label: 'Unintended weight loss',
                                value: 'unintended_weight_loss',
                              },
                              {
                                label: 'Overweight or Obesity',
                                value: 'overweight_obesity',
                              },
                              {
                                label: 'Unintended weight gain',
                                value: 'unintended_weight_gain',
                              },
                              {
                                label: 'Growth rate below expected',
                                value: 'growth_rate_below_expected',
                              },
                              {
                                label:
                                  'Chronic disease or condition-related malnutrition (undernutrition)',
                                value: 'chronic_disease_malnutrition',
                              },
                              {
                                label: 'Acute disease or injury-related malnutrition',
                                value: 'acute_disease_malnutrition',
                              },
                              {
                                label: 'Non illness-related pediatric malnutrition',
                                value: 'non_illness_pediatric_malnutrition',
                              },
                              {
                                label: 'Illness-related pediatric malnutrition',
                                value: 'illness_related_pediatric_malnutrition',
                              },
                              {
                                label: 'Food- and nutrition-related knowledge deficit',
                                value: 'food_nutrition_knowledge_deficit',
                              },
                              {
                                label: 'Not ready for diet or lifestyle change',
                                value: 'not_ready_for_diet_lifestyle_change',
                              },
                              {
                                label: 'Disordered eating pattern',
                                value: 'disordered_eating_pattern',
                              },
                              {
                                label: 'Limited adherence to nutrition-related recommendations',
                                value: 'limited_adherence_nutrition_recommendations',
                              },
                              {
                                label: 'Undesirable food choices',
                                value: 'undesirable_food_choices',
                              },
                              {
                                label: 'Physical inactivity',
                                value: 'physical_inactivity',
                              },
                              {
                                label: 'Excessive physical activity',
                                value: 'excessive_physical_activity',
                              },
                              {
                                label: 'Intake of unsafe food',
                                value: 'intake_of_unsafe_food',
                              },
                              {
                                label: 'Limited access to food',
                                value: 'limited_access_to_food',
                              },
                            ],
                          },
                        },
                      ],
                    },
                    {
                      type: 'tiered-combobox',
                      key: 'related_to',
                      inputLabel: '...related to...',
                      required: true,
                      props: [
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'increased_energy_expenditure',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Wound healing',
                                value: 'wound_healing',
                              },
                              {
                                label: 'Fever',
                                value: 'fever',
                              },
                              {
                                label: 'Cancer',
                                value: 'cancer',
                              },
                              {
                                label: 'COPD',
                                value: 'copd',
                              },
                              {
                                label: 'Cerebral palsy',
                                value: 'cerebral_palsy',
                              },
                              {
                                label: 'Cystic fibrosis',
                                value: 'cystic_fibrosis',
                              },
                              {
                                label: 'Physical activity',
                                value: 'physical_activity',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_energy_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Catabolism energy increases',
                                value: 'catabolism_energy_increases',
                              },
                              {
                                label: 'Poor intake',
                                value: 'poor_intake',
                              },
                              {
                                label: 'Chewing or swallowing issues',
                                value: 'chewing_swallowing_issues',
                              },
                              {
                                label: 'Taste changes',
                                value: 'taste_changes',
                              },
                              {
                                label: 'Limited access to food',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_energy_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Limited access to healthy food',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Bingeing or disordered eating',
                                value: 'bingeing_disordered_eating',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Lack of value to change',
                                value: 'lack_of_value_to_change',
                              },
                              {
                                label: 'Appetite stimulants',
                                value: 'appetite_stimulants',
                              },
                              {
                                label: 'Decreased metabolism or needs',
                                value: 'decreased_metabolism_needs',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_oral_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Poor intake',
                                value: 'poor_intake',
                              },
                              {
                                label: 'Catabolism energy increases',
                                value: 'catabolism_energy_increases',
                              },
                              {
                                label: 'Chewing or swallowing issues',
                                value: 'chewing_swallowing_issues',
                              },
                              {
                                label: 'Taste changes',
                                value: 'taste_changes',
                              },
                              {
                                label: 'Limited access to food',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Depression or disordered eating',
                                value: 'depression_disordered_eating',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_oral_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Bingeing or disordered eating',
                                value: 'bingeing_disordered_eating',
                              },
                              {
                                label: 'Limited access to healthy food',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Poor satiety cues',
                                value: 'poor_satiety_cues',
                              },
                              {
                                label: 'Appetite stimulants',
                                value: 'appetite_stimulants',
                              },
                              {
                                label: 'Unwilling to reduce intake',
                                value: 'unwilling_to_reduce_intake',
                              },
                              {
                                label: 'Lack of value to change',
                                value: 'lack_of_value_to_change',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'limited_food_acceptance',
                          ],
                          then: {
                            options: [
                              {
                                label: 'GI pain or discomfort',
                                value: 'gi_pain_or_discomfort',
                              },
                              {
                                label: 'Neurological disorders',
                                value: 'neurological_disorders',
                              },
                              {
                                label: 'Food aversions',
                                value: 'food_aversions',
                              },
                              {
                                label: 'Self-limitations',
                                value: 'self_limitations',
                              },
                              {
                                label: 'Behavioral issues',
                                value: 'behavioral_issues',
                              },
                              {
                                label: 'Unsupported beliefs or attitudes',
                                value: 'unsupported_beliefs_attitudes',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_en_infusion',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Altered nutrient absorption',
                                value: 'altered_nutrient_absorption',
                              },
                              {
                                label: 'Inappropriate formula',
                                value: 'inappropriate_formula',
                              },
                              {
                                label: 'Formula or rate intolerance',
                                value: 'formula_or_rate_intolerance',
                              },
                              {
                                label: 'Inadequate rate',
                                value: 'inadequate_rate',
                              },
                              {
                                label: 'Infusion schedule interrupted',
                                value: 'infusion_schedule_interrupted',
                              },
                              {
                                label: 'NPO',
                                value: 'npo',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_en_infusion',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Decreased energy needs',
                                value: 'decreased_energy_needs',
                              },
                              {
                                label: 'Excessive rate',
                                value: 'excessive_rate',
                              },
                              {
                                label: 'Pump malfunction',
                                value: 'pump_malfunction',
                              },
                              {
                                label: 'Rate setting error',
                                value: 'rate_setting_error',
                              },
                              {
                                label: 'Overfeeding',
                                value: 'overfeeding',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'en_composition_inconsistent_with_needs',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Needs different than estimate',
                                value: 'needs_different_than_estimate',
                              },
                              {
                                label: 'Excessive GI losses',
                                value: 'excessive_gi_losses',
                              },
                              {
                                label: 'End of life',
                                value: 'end_of_life',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'en_administration_inconsistent_with_needs',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Inadequate or excessive rate',
                                value: 'inadequate_excessive_rate',
                              },
                              {
                                label: 'Infusion schedule interrupted',
                                value: 'infusion_schedule_interrupted',
                              },
                              {
                                label: 'End of life',
                                value: 'end_of_life',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_pn_infusion',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Altered nutrient absorption',
                                value: 'altered_nutrient_absorption',
                              },
                              {
                                label: 'Pump malfunction',
                                value: 'pump_malfunction',
                              },
                              {
                                label: 'Inadequate rate',
                                value: 'inadequate_rate',
                              },
                              {
                                label: 'Awaiting PN access',
                                value: 'awaiting_pn_access',
                              },
                              {
                                label: 'Infusion schedule interrupted',
                                value: 'infusion_schedule_interrupted',
                              },
                              {
                                label: 'PN intolerance',
                                value: 'pn_intolerance',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_pn_infusion',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Decreased energy needs',
                                value: 'decreased_energy_needs',
                              },
                              {
                                label: 'Excessive rate',
                                value: 'excessive_rate',
                              },
                              {
                                label: 'Pump malfunction',
                                value: 'pump_malfunction',
                              },
                              {
                                label: 'Rate setting error',
                                value: 'rate_setting_error',
                              },
                              {
                                label: 'Overfeeding',
                                value: 'overfeeding',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'pn_composition_inconsistent_with_needs',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Needs different than estimate',
                                value: 'needs_different_than_estimate',
                              },
                              {
                                label: 'End of life',
                                value: 'end_of_life',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'pn_administration_inconsistent_with_needs',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Inadequate or excessive rate',
                                value: 'inadequate_excessive_rate',
                              },
                              {
                                label: 'Infusion schedule interrupted',
                                value: 'infusion_schedule_interrupted',
                              },
                              {
                                label: 'End of life',
                                value: 'end_of_life',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_fluid_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Chewing or swallowing issues',
                                value: 'chewing_swallowing_issues',
                              },
                              {
                                label: 'Need for thickened fluids',
                                value: 'need_for_thickened_fluids',
                              },
                              {
                                label: 'Excess fluid losses',
                                value: 'excess_fluid_losses',
                              },
                              {
                                label: 'Increased exercise',
                                value: 'increased_exercise',
                              },
                              {
                                label: 'Decreased thirst cues',
                                value: 'decreased_thirst_cues',
                              },
                              {
                                label: 'Limited access to fluid',
                                value: 'limited_access_to_fluid',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Impaired cognition',
                                value: 'impaired_cognition',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_fluid_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'End-stage renal disease',
                                value: 'end_stage_renal_disease',
                              },
                              {
                                label: 'Nephrotic syndrome',
                                value: 'nephrotic_syndrome',
                              },
                              {
                                label: 'Heart failure',
                                value: 'heart_failure',
                              },
                              {
                                label: 'SIADH',
                                value: 'siadh',
                              },
                              {
                                label: 'Increased thirst cues',
                                value: 'increased_thirst_cues',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_bioactive_substance_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Altered GI function',
                                value: 'altered_gi_function',
                              },
                              {
                                label: 'Limited access to bioactive foods',
                                value: 'limited_access_to_bioactive_foods',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_bioactive_substance_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Altered GI function',
                                value: 'altered_gi_function',
                              },
                              {
                                label: 'Misuse of a substance',
                                value: 'misuse_of_a_substance',
                              },
                              {
                                label: 'Alcohol or caffeine addiction',
                                value: 'alcohol_or_caffeine_addiction',
                              },
                              {
                                label: 'Lack of value for change',
                                value: 'lack_of_value_for_change',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'increased_nutrient_needs',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Altered absorption or metabolism',
                                value: 'altered_absorption_metabolism',
                              },
                              {
                                label: 'Pancreas or liver issues',
                                value: 'pancreas_liver_issues',
                              },
                              {
                                label: 'Short bowel syndrome',
                                value: 'short_bowel_syndrome',
                              },
                              {
                                label: 'Celiac disease',
                                value: 'celiac_disease',
                              },
                              {
                                label: 'Crohn’s disease',
                                value: 'crohns_disease',
                              },
                              {
                                label: 'Wound healing',
                                value: 'wound_healing',
                              },
                              {
                                label: 'Infection',
                                value: 'infection',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'decreased_nutrient_needs',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Liver disease',
                                value: 'liver_disease',
                              },
                              {
                                label: 'Renal disease',
                                value: 'renal_disease',
                              },
                              {
                                label: 'Altered cholesterol regulation',
                                value: 'altered_cholesterol_regulation',
                              },
                              {
                                label: 'IBD flare-up',
                                value: 'ibd_flare_up',
                              },
                              {
                                label: 'Heart failure',
                                value: 'heart_failure',
                              },
                              {
                                label: 'IBS food intolerances',
                                value: 'ibs_food_intolerances',
                              },
                              {
                                label: 'Desired weight loss',
                                value: 'desired_weight_loss',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'imbalance_of_nutrients',
                          ],
                          then: {
                            options: [
                              {
                                label: 'High dose supplements',
                                value: 'high_dose_supplements',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Food faddism',
                                value: 'food_faddism',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_protein_energy_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Catabolism energy increases',
                                value: 'catabolism_energy_increases',
                              },
                              {
                                label: 'Wound healing',
                                value: 'wound_healing',
                              },
                              {
                                label: 'Malabsorption',
                                value: 'malabsorption',
                              },
                              {
                                label: 'Limited access to food',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_fat_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Catabolism energy increases',
                                value: 'catabolism_energy_increases',
                              },
                              {
                                label: 'Fat malabsorption',
                                value: 'fat_malabsorption',
                              },
                              {
                                label: 'Altered GI function',
                                value: 'altered_gi_function',
                              },
                              {
                                label: 'Less than optimal food choices',
                                value: 'less_than_optimal_food_choices',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_fat_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Limited access to healthy foods',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Lack of value for change',
                                value: 'lack_of_value_for_change',
                              },
                              {
                                label: 'Disordered eating',
                                value: 'disordered_eating',
                              },
                              {
                                label: 'Intake of high-fat foods',
                                value: 'intake_of_high_fat_foods',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'intake_of_types_of_fats_inconsistent_with_needs',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Limited access to healthy foods',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Lack of value for change',
                                value: 'lack_of_value_for_change',
                              },
                              {
                                label: 'Physiological altered fat needs',
                                value: 'physiological_altered_fat_needs',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_protein_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Catabolism energy increases',
                                value: 'catabolism_energy_increases',
                              },
                              {
                                label: 'Malabsorption',
                                value: 'malabsorption',
                              },
                              {
                                label: 'Need dependent on age',
                                value: 'need_dependent_on_age',
                              },
                              {
                                label: 'Wound healing',
                                value: 'wound_healing',
                              },
                              {
                                label: 'Burn healing',
                                value: 'burn_healing',
                              },
                              {
                                label: 'Self-feeding barriers',
                                value: 'self_feeding_barriers',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Disordered eating',
                                value: 'disordered_eating',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_protein_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Liver disease',
                                value: 'liver_disease',
                              },
                              {
                                label: 'Renal disease',
                                value: 'renal_disease',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Metabolic abnormalities',
                                value: 'metabolic_abnormalities',
                              },
                              {
                                label: 'Food faddism',
                                value: 'food_faddism',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'intake_of_proteins_inconsistent_with_needs',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Liver disease',
                                value: 'liver_disease',
                              },
                              {
                                label: 'Renal disease',
                                value: 'renal_disease',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Misused specialized products',
                                value: 'misused_specialized_products',
                              },
                              {
                                label: 'Food faddism',
                                value: 'food_faddism',
                              },
                              {
                                label: 'PKU',
                                value: 'pku',
                              },
                              {
                                label: 'Celiac disease',
                                value: 'celiac_disease',
                              },
                              {
                                label: 'Limited protein access',
                                value: 'limited_protein_access',
                              },
                              {
                                label: 'Lack of willingness to modify protein or amino acid intake',
                                value: 'lack_of_willingness_to_modify_protein_or_amino_acid_intake',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_carbohydrate_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Increased activity level',
                                value: 'increased_activity_level',
                              },
                              {
                                label: 'Malabsorption',
                                value: 'malabsorption',
                              },
                              {
                                label: 'Metabolic changes',
                                value: 'metabolic_changes',
                              },
                              {
                                label: 'Limited access to food',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Self-feeding barriers',
                                value: 'self_feeding_barriers',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_carbohydrate_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Diabetes',
                                value: 'diabetes',
                              },
                              {
                                label: 'Lactase deficiency',
                                value: 'lactase_deficiency',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Lack of willingness to modify carb intake',
                                value: 'lack_of_willingness_to_modify_carb_intake',
                              },
                              {
                                label: 'Disordered eating',
                                value: 'disordered_eating',
                              },
                              {
                                label: 'Meds causing hyperglycemia',
                                value: 'meds_causing_hyperglycemia',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'intake_of_carbs_inconsistent_with_needs',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Altered carb needs d/t disease',
                                value: 'altered_carb_needs_disease',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Disordered eating',
                                value: 'disordered_eating',
                              },
                              {
                                label: 'Lack of willingness to modify carb intake',
                                value: 'lack_of_willingness_to_modify_carb_intake',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inconsistent_carbohydrates',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Need for carb timing',
                                value: 'need_for_carb_timing',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Disordered eating',
                                value: 'disordered_eating',
                              },
                              {
                                label: 'Lack of willingness to modify carb timing',
                                value: 'lack_of_willingness_to_modify_carb_timing',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_fiber_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Limited access to fibrous foods',
                                value: 'limited_access_to_fibrous_foods',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Prolonged low fiber diet',
                                value: 'prolonged_low_fiber_diet',
                              },
                              {
                                label: 'Non optimal food prep practices',
                                value: 'non_optimal_food_prep_practices',
                              },
                              {
                                label: 'Lack of willingness to consume fibrous foods',
                                value: 'lack_of_willingness_to_consume_fibrous_foods',
                              },
                              {
                                label: 'IBD',
                                value: 'ibd',
                              },
                              {
                                label: 'Short bowel syndrome',
                                value: 'short_bowel_syndrome',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_fiber_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Obsession with bowel frequency',
                                value: 'obsession_bowel_frequency',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Need for low fiber diet',
                                value: 'need_for_low_fiber_diet',
                              },
                              {
                                label: 'IBS',
                                value: 'ibs',
                              },
                              {
                                label: 'Short bowel syndrome',
                                value: 'short_bowel_syndrome',
                              },
                              {
                                label: 'Bowel obstruction',
                                value: 'bowel_obstruction',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'inadequate_vitamin_mineral_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Increased needs d/t disease',
                                value: 'increased_needs_disease',
                              },
                              {
                                label: 'Malabsorption',
                                value: 'malabsorption',
                              },
                              {
                                label: 'Med-related alterations',
                                value: 'med_related_alterations',
                              },
                              {
                                label: 'Limited access to food',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Geography or season',
                                value: 'geography_season',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Depression or disordered eating',
                                value: 'depression_disordered_eating',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_vitamin_mineral_intake',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Decreased needs d/t disease',
                                value: 'decreased_needs_disease',
                              },
                              {
                                label: 'Foods or supplements in excess',
                                value: 'foods_supplements_excess',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Accidental overdose',
                                value: 'accidental_overdose',
                              },
                              {
                                label: 'Depression or disordered eating',
                                value: 'depression_disordered_eating',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'swallowing_difficulty',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Inflammation',
                                value: 'inflammation',
                              },
                              {
                                label: 'Surgery',
                                value: 'surgery',
                              },
                              {
                                label: 'Tumors',
                                value: 'tumors',
                              },
                              {
                                label: 'Prior ventilation',
                                value: 'prior_ventilation',
                              },
                              {
                                label: 'Cerebral palsy',
                                value: 'cerebral_palsy',
                              },
                              {
                                label: 'Multiple sclerosis',
                                value: 'multiple_sclerosis',
                              },
                              {
                                label: 'Stroke',
                                value: 'stroke',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'biting_chewing_difficulty',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Oral or facial dysfunction',
                                value: 'oral_facial_dysfunction',
                              },
                              {
                                label: 'Oral surgery',
                                value: 'oral_surgery',
                              },
                              {
                                label: 'Poor dentition',
                                value: 'poor_dentition',
                              },
                              {
                                label: 'Tooth pain',
                                value: 'tooth_pain',
                              },
                              {
                                label: 'Jaw pain',
                                value: 'jaw_pain',
                              },
                              {
                                label: 'Xerostomia',
                                value: 'xerostomia',
                              },
                              {
                                label: 'Side effects of chemo or radiation',
                                value: 'side_effects_chemo_radiation',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'breastfeeding_difficulty',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Infant: Latching or sucking difficulty',
                                value: 'infant_latching_sucking_difficulty',
                              },
                              {
                                label: 'Infant: Lethargy',
                                value: 'infant_lethargy',
                              },
                              {
                                label: 'Infant: Sleepiness',
                                value: 'infant_sleepiness',
                              },
                              {
                                label: 'Infant: Swallowing difficulty',
                                value: 'infant_swallowing_difficulty',
                              },
                              {
                                label: 'Infant: Alternate route of feeding',
                                value: 'infant_alternate_route_feeding',
                              },
                              {
                                label: 'Mother: Breast pain',
                                value: 'mother_breast_pain',
                              },
                              {
                                label: 'Mother: Nipple abnormality',
                                value: 'mother_nipple_abnormality',
                              },
                              {
                                label: 'Mother: Mastitis',
                                value: 'mother_mastitis',
                              },
                              {
                                label: 'Mother: Inadequate milk supply',
                                value: 'mother_inadequate_milk_supply',
                              },
                              {
                                label: 'Mother: Lack of support',
                                value: 'mother_lack_of_support',
                              },
                            ],
                          },
                        },
                        {
                          condition: ['stringEquals', 'nutrition_diagnosis', 'altered_gi_function'],
                          then: {
                            options: [
                              {
                                label: 'Bowel resection',
                                value: 'bowel_resection',
                              },
                              {
                                label: 'Pancreas or liver issues',
                                value: 'pancreas_liver_issues',
                              },
                              {
                                label: 'Short bowel syndrome',
                                value: 'short_bowel_syndrome',
                              },
                              {
                                label: 'IBD',
                                value: 'ibd',
                              },
                              {
                                label: 'Celiac disease',
                                value: 'celiac_disease',
                              },
                              {
                                label: 'Cystic fibrosis',
                                value: 'cystic_fibrosis',
                              },
                              {
                                label: 'GI cancer',
                                value: 'gi_cancer',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'impaired_nutrient_utilization',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Altered GI function',
                                value: 'altered_gi_function',
                              },
                              {
                                label: 'Malabsorption',
                                value: 'malabsorption',
                              },
                              {
                                label: 'Metabolic disorders',
                                value: 'metabolic_disorders',
                              },
                              {
                                label: 'Medications',
                                value: 'medications',
                              },
                              {
                                label: 'Alcohol or drug addiction',
                                value: 'alcohol_drug_addiction',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'altered_nutrition_related_lab_values',
                          ],
                          then: {
                            options: [
                              {
                                label:
                                  'Kidney, liver, cardiac, endocrine, neurological or pulmonary dysfunction',
                                value: 'kidney_liver_dysfunction',
                              },
                              {
                                label: 'Metabolic disorders',
                                value: 'metabolic_disorders',
                              },
                              {
                                label: 'Overhydration',
                                value: 'overhydration',
                              },
                              {
                                label: 'Refeeding syndrome',
                                value: 'refeeding_syndrome',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'food_medication_interaction',
                          ],
                          then: {
                            options: [
                              {
                                label:
                                  'Ingestion or administration of medication or food resulting in a harmful reaction',
                                value: 'harmful_reaction_food_medication',
                              },
                            ],
                          },
                        },
                        {
                          condition: ['stringEquals', 'nutrition_diagnosis', 'underweight'],
                          then: {
                            options: [
                              {
                                label: 'Disordered eating',
                                value: 'disordered_eating',
                              },
                              {
                                label: 'Excessive physical activity',
                                value: 'excessive_physical_activity',
                              },
                              {
                                label: 'Inadequate energy intake',
                                value: 'inadequate_energy_intake',
                              },
                              {
                                label: 'Limited access to food',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'unintended_weight_loss',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Increased nutrient needs',
                                value: 'increased_nutrient_needs',
                              },
                              {
                                label: 'Chewing or swallowing issues',
                                value: 'chewing_swallowing_issues',
                              },
                              {
                                label: 'Functional decline',
                                value: 'functional_decline',
                              },
                              {
                                label: 'Limited access to food',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Prolonged hospitalization',
                                value: 'prolonged_hospitalization',
                              },
                              {
                                label: 'Depression or disordered eating',
                                value: 'depression_disordered_eating',
                              },
                              {
                                label: 'Cancer',
                                value: 'cancer',
                              },
                            ],
                          },
                        },
                        {
                          condition: ['stringEquals', 'nutrition_diagnosis', 'overweight_obesity'],
                          then: {
                            options: [
                              {
                                label: 'Decreased nutrient needs',
                                value: 'decreased_nutrient_needs',
                              },
                              {
                                label: 'Excessive energy intake',
                                value: 'excessive_energy_intake',
                              },
                              {
                                label: 'Depression or disordered eating',
                                value: 'depression_disordered_eating',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Not ready for lifestyle change',
                                value: 'not_ready_lifestyle_change',
                              },
                              {
                                label: 'Physical inactivity',
                                value: 'physical_inactivity',
                              },
                              {
                                label: 'Increased stress',
                                value: 'increased_stress',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'unintended_weight_gain',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Physical immobility or trauma',
                                value: 'physical_immobility_trauma',
                              },
                              {
                                label: 'Hypothyroidism',
                                value: 'hypothyroidism',
                              },
                              {
                                label: 'Cushing’s syndrome',
                                value: 'cushings_syndrome',
                              },
                              {
                                label: 'Antidepressants',
                                value: 'antidepressants',
                              },
                              {
                                label: 'Antipsychotics',
                                value: 'antipsychotics',
                              },
                              {
                                label: 'Steroids',
                                value: 'steroids',
                              },
                              {
                                label: 'Edema',
                                value: 'edema',
                              },
                              {
                                label: 'Not ready for lifestyle change',
                                value: 'not_ready_for_lifestyle_change',
                              },
                              {
                                label: 'Excess energy intake',
                                value: 'excess_energy_intake',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'growth_rate_below_expected',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Critical illness',
                                value: 'critical_illness',
                              },
                              {
                                label: 'Type 1 diabetes',
                                value: 'type_1_diabetes',
                              },
                              {
                                label: 'Nutrient malabsorption',
                                value: 'nutrient_malabsorption',
                              },
                              {
                                label: 'Feeding barriers',
                                value: 'feeding_barriers',
                              },
                              {
                                label: 'Limited access to food',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Limited food acceptance',
                                value: 'limited_food_acceptance',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'chronic_disease_malnutrition',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Altered GI function',
                                value: 'altered_gi_function',
                              },
                              {
                                label: 'Increased energy needs',
                                value: 'increased_energy_needs',
                              },
                              {
                                label: 'Organ failure',
                                value: 'organ_failure',
                              },
                              {
                                label: 'Cancer',
                                value: 'cancer',
                              },
                              {
                                label: 'Malabsorption',
                                value: 'malabsorption',
                              },
                              {
                                label: 'CKD',
                                value: 'ckd',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'acute_disease_malnutrition',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Altered GI function',
                                value: 'altered_gi_function',
                              },
                              {
                                label: 'Sepsis',
                                value: 'sepsis',
                              },
                              {
                                label: 'Pneumonia',
                                value: 'pneumonia',
                              },
                              {
                                label: 'Wounds or burns',
                                value: 'wounds_burns',
                              },
                              {
                                label: 'Major surgeries',
                                value: 'major_surgeries',
                              },
                              {
                                label: 'Increased energy needs',
                                value: 'increased_energy_needs',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'non_illness_pediatric_malnutrition',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Limited access to food',
                                value: 'limited_access_to_food',
                              },
                              {
                                label: 'Feeding intolerances',
                                value: 'feeding_intolerances',
                              },
                              {
                                label: 'Neglect or poverty',
                                value: 'neglect_poverty',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'illness_related_pediatric_malnutrition',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Catabolism energy increases',
                                value: 'catabolism_energy_increases',
                              },
                              {
                                label: 'Altered nutrient utilization',
                                value: 'altered_nutrient_utilization',
                              },
                              {
                                label: 'Depression or disordered eating',
                                value: 'depression_disordered_eating',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'food_nutrition_knowledge_deficit',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Unsupported nutrition beliefs or attitudes',
                                value: 'unsupported_nutrition_beliefs_attitudes',
                              },
                              {
                                label: 'Lack of prior education',
                                value: 'lack_prior_education',
                              },
                              {
                                label: 'Impaired cognition',
                                value: 'impaired_cognition',
                              },
                              {
                                label: 'Prior incorrect knowledge',
                                value: 'prior_incorrect_knowledge',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'not_ready_for_diet_lifestyle_change',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Unsupported nutrition beliefs',
                                value: 'unsupported_nutrition_beliefs',
                              },
                              {
                                label: 'Impaired cognition',
                                value: 'impaired_cognition',
                              },
                              {
                                label: 'Lack of social support',
                                value: 'lack_of_social_support',
                              },
                              {
                                label: 'Denial of need to change',
                                value: 'denial_of_need_to_change',
                              },
                              {
                                label: 'Limited financial resources',
                                value: 'limited_financial_resources',
                              },
                              {
                                label: 'Lack of self-efficacy',
                                value: 'lack_of_self_efficacy',
                              },
                              {
                                label: 'Specify diet or lifestyle change',
                                value: 'specify_diet_lifestyle_change',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'disordered_eating_pattern',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Obsession to be thin',
                                value: 'obsession_to_be_thin',
                              },
                              {
                                label: 'Low self-esteem',
                                value: 'low_self_esteem',
                              },
                              {
                                label: 'Anorexia nervosa',
                                value: 'anorexia_nervosa',
                              },
                              {
                                label: 'Bulimia nervosa',
                                value: 'bulimia_nervosa',
                              },
                              {
                                label: 'PICA',
                                value: 'pica',
                              },
                              {
                                label: 'Other eating disorders',
                                value: 'other_eating_disorders',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'limited_adherence_nutrition_recommendations',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Specific diet education',
                                value: 'specific_diet_education',
                              },
                              {
                                label: 'Lack of social support',
                                value: 'lack_social_support',
                              },
                              {
                                label: 'Lack of value for change',
                                value: 'lack_value_for_change',
                              },
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Unwilling to apply info',
                                value: 'unwilling_to_apply_info',
                              },
                              {
                                label: 'Unsupported nutrition beliefs',
                                value: 'unsupported_nutrition_beliefs',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'undesirable_food_choices',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Diet requirements',
                                value: 'diet_requirements',
                              },
                              {
                                label: 'Impaired cognition',
                                value: 'impaired_cognition',
                              },
                              {
                                label: 'Limited financial resources',
                                value: 'limited_financial_resources',
                              },
                              {
                                label: 'Disinterest in diet intervention',
                                value: 'disinterest_diet_intervention',
                              },
                              {
                                label: 'Allergies or aversions',
                                value: 'allergies_aversions',
                              },
                              {
                                label: 'Other aversions',
                                value: 'other_aversions',
                              },
                            ],
                          },
                        },
                        {
                          condition: ['stringEquals', 'nutrition_diagnosis', 'physical_inactivity'],
                          then: {
                            options: [
                              {
                                label: 'Lifestyle',
                                value: 'lifestyle',
                              },
                              {
                                label: 'Functional or physical inability',
                                value: 'functional_or_physical_inability',
                              },
                              {
                                label: 'Cognitive impairment',
                                value: 'cognitive_impairment',
                              },
                              {
                                label: 'Lack of social support',
                                value: 'lack_social_support',
                              },
                              {
                                label: 'Limited access to equipment',
                                value: 'limited_access_to_equipment',
                              },
                              {
                                label: 'Time constraints',
                                value: 'time_constraints',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'excessive_physical_activity',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Lifestyle',
                                value: 'lifestyle',
                              },
                              {
                                label: 'Disordered eating',
                                value: 'disordered_eating',
                              },
                              {
                                label: 'Body dysmorphia',
                                value: 'body_dysmorphia',
                              },
                              {
                                label: 'Irrational nutrition beliefs',
                                value: 'irrational_nutrition_beliefs',
                              },
                              {
                                label: 'Addictive personality',
                                value: 'addictive_personality',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'intake_of_unsafe_food',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Knowledge deficit',
                                value: 'knowledge_deficit',
                              },
                              {
                                label: 'Exposure to contaminated food',
                                value: 'exposure_to_contaminated_food',
                              },
                              {
                                label: 'Foodborne illness',
                                value: 'foodborne_illness',
                              },
                              {
                                label: 'Poisoning',
                                value: 'poisoning',
                              },
                              {
                                label: 'Impaired cognition',
                                value: 'impaired_cognition',
                              },
                              {
                                label: 'Limited access to safe food',
                                value: 'limited_access_to_safe_food',
                              },
                              {
                                label: 'Limited safe food storage or prep',
                                value: 'limited_safe_food_storage_prep',
                              },
                            ],
                          },
                        },
                        {
                          condition: [
                            'stringEquals',
                            'nutrition_diagnosis',
                            'limited_access_to_food',
                          ],
                          then: {
                            options: [
                              {
                                label: 'Poor housing condition',
                                value: 'poor_housing_condition',
                              },
                              {
                                label: 'No running water',
                                value: 'no_running_water',
                              },
                              {
                                label: 'Limited financial resources',
                                value: 'limited_financial_resources',
                              },
                              {
                                label: 'Accessibility barriers',
                                value: 'accessibility_barriers',
                              },
                              {
                                label: 'Caregiver neglect or abuse',
                                value: 'caregiver_neglect_abuse',
                              },
                              {
                                label: 'Lack of food planning, purchasing, and preparation skills',
                                value: 'lack_food_planning_skills',
                              },
                              {
                                label: 'Lack of community support',
                                value: 'lack_community_support',
                              },
                              {
                                label: 'Mental illness',
                                value: 'mental_illness',
                              },
                              {
                                label: 'Condition of home',
                                value: 'condition_of_home',
                              },
                              {
                                label: 'Inability to pay water bill',
                                value: 'inability_pay_water_bill',
                              },
                              {
                                label: 'No finances for food',
                                value: 'no_finances_for_food',
                              },
                            ],
                          },
                        },
                      ],
                    },
                    {
                      type: 'tiered-textarea',
                      key: 'signs_and_symptoms',
                      inputLabel: 'as evidenced by...',
                      required: true,
                      props: [
                        {
                          then: {
                            label:
                              'Please add signs (objective data like anthropmetrics, lab values and test results) and symptoms (subjective data reported by the member) that are specific to the patient.',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: 'group',
              title: 'Intervention',
              subtitle: 'You must enter at least one intervention below, or add custom notes.',
              groupKey: 'intervention_group',
              widgets: [
                {
                  type: 'entry-editor',
                  key: 'interventions',
                  addButtonText: 'Add intervention',
                  inputLabel: 'Intervention',
                  prevAnswerPrompt: 'readonly',
                  options: [
                    {
                      label:
                        'Educated about alcohol consumption’s impact on nutrient absorption and health.',
                      value: 'alcohol_consumption',
                    },
                    {
                      label:
                        'Discussed the role healthy kidneys play in your body and the basics of a healthy kidney diet.',
                      value: 'ckd_healthy_kidney',
                    },
                    {
                      label: 'Reviewed labs that can be affected by kidney disease.',
                      value: 'ckd_review_labs',
                    },
                    {
                      label: 'Learned about protein needs with kidney disease.',
                      value: 'ckd_protein_needs',
                    },
                    {
                      label: 'Discussed limiting potassium intake with declining kidney function.',
                      value: 'ckd_limiting_potassium',
                    },
                    {
                      label: 'Discussed limiting phosphorus intake with declining kidney function.',
                      value: 'ckd_limiting_phosphorus',
                    },
                    {
                      label:
                        'Reviewed how managing your blood pressure can help prevent further kidney damage.',
                      value: 'ckd_blood_pressure',
                    },
                    {
                      label: 'Discussed managing heart disease and diabetes with kidney disease.',
                      value: 'ckd_heart_disease',
                    },
                    {
                      label: 'Reviewed safe supplementation with chronic kidney disease.',
                      value: 'ckd_safe_supplementation',
                    },
                    {
                      label: 'Educated on shopping smartly with chronic kidney disease.',
                      value: 'ckd_shopping_smart',
                    },
                    {
                      label:
                        'Educated on adopting a whole food plant based diet with chronic kidney disease.',
                      value: 'ckd_whole_food_diet',
                    },
                    {
                      label:
                        'Provided education about diabetes and provided overview of Foodsmart diabetes program.',
                      value: 'diabetes_program_overview',
                    },
                    {
                      label:
                        'Provided education about carbohydrates and impact on blood sugar; reviewed types of carbohydrates.',
                      value: 'diabetes_carbohydrate_overview',
                    },
                    {
                      label:
                        'Provided education about how sugar and sugar sweeteners impact blood sugar.',
                      value: 'diabetes_sugar',
                    },
                    {
                      label:
                        'Provided education on how protein helps with satiety, improves blood sugar levels, and how to incorporate plant-based protein.',
                      value: 'diabetes_protein',
                    },
                    {
                      label:
                        'Provided education on how fats impact blood sugar and which fats can improve blood sugar balance.',
                      value: 'diabetes_fats',
                    },
                    {
                      label:
                        'Provided education on how fiber impacts blood sugar and energy levels.',
                      value: 'diabetes_fiber',
                    },
                    {
                      label:
                        'Provided education related to timing and balance of meals, focusing on eating more calories in the morning.',
                      value: 'diabetes_meal_timing',
                    },
                    {
                      label:
                        'Provided education about how cortisol from high stress levels can increase blood sugar and reviewed strategies to reduce everyday stress.',
                      value: 'diabetes_stress',
                    },
                    {
                      label: 'Provided education about how moving helps balance blood sugar.',
                      value: 'diabetes_movement',
                    },
                    {
                      label:
                        'Provided education about how consistent meal planning can help improve diabetes outcomes.',
                      value: 'diabetes_meal_planning',
                    },
                    {
                      label:
                        'Reviewed checking blood sugar if experiencing symptoms of low blood sugar and follow the 15-15 rule if levels are <70 mg/dl.',
                      value: 'diabetes_blood_sugar',
                    },
                    {
                      label:
                        'Provided education on carbohydrate counting for managing blood glucose levels. Aim for a set number of carbohydrate choices per meal.',
                      value: 'diabetes_carbohydrate_counting',
                    },
                    {
                      label:
                        'Provided education on managing diabetes with balanced meals, portion control, and healthy carbohydrate choices.',
                      value: 'diabetes_management',
                    },
                    {
                      label:
                        'Provided guidelines on consistent carbohydrate intake, shopping and cooking support to improve overall diet quality and save money.',
                      value: 'diabetes_guidelines',
                    },
                    {
                      label:
                        'Reviewed foods that impact blood sugar, including carb type, carb amounts, and fiber.',
                      value: 'diabetes_food_overview',
                    },
                    {
                      label:
                        'Advised on dining out strategies, like using to-go containers, sharing an entree and ordering smaller portion sizes.',
                      value: 'dining_out_strategies',
                    },
                    {
                      label: 'Suggested navigating special occasions with a healthy eating plan.',
                      value: 'dining_out_special_occasions',
                    },
                    {
                      label:
                        'Suggested healthier restaurant choices and limiting how often dining out occurs.',
                      value: 'dining_out_restaurants',
                    },
                    {
                      label:
                        'Discussed holiday celebration strategies with family for maintaining healthy habits.',
                      value: 'dining_out_holidays',
                    },
                    {
                      label:
                        'Discussed signs of emotional eating and how to differentiate with true hunger.',
                      value: 'emotional_eating_signs',
                    },
                    {
                      label: 'Reviewed introduction to ESRD and common causes of kidney disease.',
                      value: 'esrd_introduction',
                    },
                    {
                      label: 'Discussed lab results associated with ESRD.',
                      value: 'esrd_lab_results',
                    },
                    {
                      label: 'Reviewed sodium and fluid management with ESRD.',
                      value: 'esrd_sodium_fluid',
                    },
                    {
                      label: 'Reviewed potassium intake with ESRD while on dialysis.',
                      value: 'esrd_potassium',
                    },
                    {
                      label: 'Discussed mineral bone disorder with ESRD.',
                      value: 'esrd_mineral_bone',
                    },
                    {
                      label: 'Educated on phosphorus intake with ESRD.',
                      value: 'esrd_phosphorus',
                    },
                    {
                      label:
                        'Discussed how ESRD affects albumin, protein, infection and inflammation.',
                      value: 'esrd_protein_infection',
                    },
                    {
                      label: 'Discussed how to stay active while on dialysis.',
                      value: 'esrd_activity',
                    },
                    {
                      label: 'Educated on smart shopping with ESRD.',
                      value: 'esrd_shopping',
                    },
                    {
                      label: 'Discussed managing blood sugar with ESRD.',
                      value: 'esrd_blood_sugar',
                    },
                    {
                      label: 'Educated on safe supplementation for ESRD.',
                      value: 'esrd_supplementation',
                    },
                    {
                      label: 'Educated on adopting a whole food plant based diet with ESRD.',
                      value: 'esrd_whole_food_diet',
                    },
                    {
                      label:
                        'Reviewed your fiber daily goal from a variety of non-starchy vegetables, whole grains, beans, legumes, and fruits.',
                      value: 'fiber_goal',
                    },
                    {
                      label:
                        'Provided education on dealing with constipation through increased fiber intake, hydration, and physical activity.',
                      value: 'fiber_constipation',
                    },
                    {
                      label:
                        'Advised continuing low-FODMAP elimination diet and starting FODMAP challenges.',
                      value: 'fodmap_continuation',
                    },
                    {
                      label:
                        'Discussed careful reintroduction of high-FODMAP foods to test tolerance.',
                      value: 'fodmap_reintroduction',
                    },
                    {
                      label: 'Eliminated high-FODMAP foods to manage symptoms of IBS or IBD.',
                      value: 'fodmap_ibs',
                    },
                    {
                      label:
                        'Provided education on the gut microbiome and the health benefits of probiotics and prebiotics.',
                      value: 'fodmap_microbiome',
                    },
                    {
                      label:
                        'Discussed and reviewed food incentives and how to redeem them and use to shop online.',
                      value: 'food_bucks_overview',
                    },
                    {
                      label:
                        'Provided education on reading a nutrition label focusing on ingredients and macro and micronutrients.',
                      value: 'food_label_education',
                    },
                    {
                      label:
                        'Built 3 balanced meals per day and utilized resources like the Foodsmart website for meal planning.',
                      value: 'foodsmart_website_meal_planning',
                    },
                    {
                      label:
                        'Encouraged exploring features in the Foodsmart website for meal planning, recipes, and grocery shopping or delivery.',
                      value: 'foodsmart_website_features',
                    },
                    {
                      label: 'Educated on adding fruit to meals consistently throughout the day.',
                      value: 'fruit_adding',
                    },
                    {
                      label: 'Reviewed your goal servings of fruit per meal.',
                      value: 'fruit_goal',
                    },
                    {
                      label:
                        'Reviewed individual symptoms, discussed the purpose of elimination diets with reintroduction, and assessed appropriateness of an elimination diet versus alternative nutritional interventions.',
                      value: 'good_gut_overview',
                    },
                    {
                      label:
                        'Discussed structure of and approach to individualized elimination diet, including: length, approach, and symptom monitoring. Reviewed tips and resources for success, including label reading and use of Foodsmart resources for meal selection or menu planning.',
                      value: 'good_gut_diet_structure',
                    },
                    {
                      label:
                        'Reviewed individual experience during initial diet implementation with focus on troubleshooting issues, identified potential adjustments to foods eliminated, and reinforced availability of Foodsmart resources for meal selection or menu planning.',
                      value: 'good_gut_initial_implementation',
                    },
                    {
                      label:
                        'Outlined principles related to digestive and microbiome health, including nutritional strategies to support a diverse microbiome, and identified individualized strategies to promote efficient digestion.',
                      value: 'good_gut_principles_microbiome',
                    },
                    {
                      label:
                        'Assessed adherence to nutritional protocol, reviewed adequacy of nutritional intake and relevance of lifestyle factors for individual goals, reviewed strategies for designing nutritional adequate meals during an elimination diet, and reinforced availability of Foodsmart resources for meal selection or menu planning.',
                      value: 'good_gut_strategies_adherence',
                    },
                    {
                      label:
                        'Reviewed symptom changes and progress in relationship to nutritional protocol, encouraged diverse sources of fiber and protein to support microbiome diversity, and discussed individualized nutrition and lifestyle strategies to reduce stress to manage current or future stress-related digestive symptoms.',
                      value: 'good_gut_symptom_stress',
                    },
                    {
                      label:
                        'Reviewed symptom changes and progress in relationship to nutritional protocol and identified protocol-specific guidelines for choosing and consuming foods prepared by others.',
                      value: 'good_gut_outside_preparation',
                    },
                    {
                      label:
                        'Reviewed symptom changes and progress in relationship to nutritional protocol and discussed strategies for navigating holidays, parties, and special events while on an elimination diet.',
                      value: 'good_gut_social_events',
                    },
                    {
                      label:
                        'Reviewed symptom changes and progress in relationship to nutritional protocol, reinforced principles of diverse nutritional intake to support digestive health, and reviewed process of food reintroduction (including timeline and approach to symptom monitoring).',
                      value: 'good_gut_reintroduction_process',
                    },
                    {
                      label:
                        'Discussed current symptom response to food reintroduction(s), identified nutritional intake gaps and priorities based on current food intake and discussed opportunities for lifestyle or additional medical interventions as deemed appropriate.',
                      value: 'good_gut_reintroduction_symptoms',
                    },
                    {
                      label:
                        'Discussed recent changes in symptom frequency or intensity, as related to reintroduced foods and current nutritional intake. Discussed food substitutions for long-term symptom management, based on identified trigger foods.',
                      value: 'good_gut_symptom_changes',
                    },
                    {
                      label:
                        'Reviewed overall progress toward health and nutrition goals during 12-week program, identified specific achievements relevant to goals, and offered ongoing accountability and support through additional MNT sessions.',
                      value: 'good_gut_progress_review',
                    },
                    {
                      label: 'Provided an overview of the principles of intuitive eating.',
                      value: 'healthy_mind_healthy_body_overview',
                    },
                    {
                      label:
                        'Encouraged patient to let go of restrictive dieting patterns and focus on long-term wellness.',
                      value: 'healthy_mind_healthy_body_wellness',
                    },
                    {
                      label: "Taught patient to recognize and respond to their body's hunger cue.",
                      value: 'healthy_mind_healthy_body_hunger_cue',
                    },
                    {
                      label: 'Guided patient in removing the good and bad labels from foods.',
                      value: 'healthy_mind_healthy_body_labels',
                    },
                    {
                      label:
                        'Reviewed how to reframe internal or external judgments about food choices.',
                      value: 'healthy_mind_healthy_body_judgments',
                    },
                    {
                      label: 'Educated the patient on the principles of mindful eating.',
                      value: 'healthy_mind_healthy_body_mindful_eating',
                    },
                    {
                      label: 'Discussed how to reconnect with the joy of eating.',
                      value: 'healthy_mind_healthy_body_joy',
                    },
                    {
                      label:
                        'Provided strategies to help differentiate between physical hunger and emotional needs.',
                      value: 'healthy_mind_healthy_body_emotion_hunger',
                    },
                    {
                      label: 'Discussed the importance of positive body image.',
                      value: 'healthy_mind_healthy_body_body_image',
                    },
                    {
                      label:
                        'Emphasized the importance of finding physical activities that are enjoyable.',
                      value: 'healthy_mind_healthy_body_physical_activity',
                    },
                    {
                      label:
                        'Reviewed how to choose foods that both satisfy their taste buds and nourish their bodies.',
                      value: 'healthy_mind_healthy_body_satisfaction',
                    },
                    {
                      label:
                        'Reinforced the key principles of intuitive eating and helped patient create a personalized plan.',
                      value: 'healthy_mind_healthy_body_intuitive_eating',
                    },
                    {
                      label:
                        'Discussed the importance of nutrition in the prenatal period and how nutrition impacts your pregnancy.',
                      value: 'healthy_parent_healthy_baby_prenatal',
                    },
                    {
                      label:
                        'Reviewed key nutrients that support you and your growing baby during the first trimester.',
                      value: 'healthy_parent_healthy_baby_first_trimester_nutrients',
                    },
                    {
                      label:
                        'Discussed strategies for managing pregnancy-related nausea and constipation.',
                      value: 'healthy_parent_healthy_baby_nausea',
                    },
                    {
                      label:
                        'Emphasized the benefits of frequent, safe exercise during pregnancy and how to create the right exercise plan.',
                      value: 'healthy_parent_healthy_baby_exercise',
                    },
                    {
                      label:
                        'Reviewed key nutrients that support you and your growing baby during the second trimester.',
                      value: 'healthy_parent_healthy_baby_second_trimester_nutrients',
                    },
                    {
                      label:
                        'Discussed how to manage cravings and food aversions as well as foods to avoid during pregnancy.',
                      value: 'healthy_parent_healthy_baby_safe_foods',
                    },
                    {
                      label:
                        'Identified key nutrients and where to find them for optimal brain development.',
                      value: 'healthy_parent_healthy_baby_brain_development',
                    },
                    {
                      label: 'Educated on easy ways to stay hydrated during pregnancy.',
                      value: 'healthy_parent_healthy_baby_hydration',
                    },
                    {
                      label:
                        'Reviewed key nutrients that support you and your growing baby during the third trimester.',
                      value: 'healthy_parent_healthy_baby_third_trimester_nutrients',
                    },
                    {
                      label:
                        'Discussed the importance of staying active and safe during the final stages of pregnancy.',
                      value: 'healthy_parent_healthy_baby_third_trimester',
                    },
                    {
                      label:
                        'Educated on the benefits of breastfeeding, how to prepare formula and making a feeding plan for your infant.',
                      value: 'healthy_parent_healthy_baby_breastfeeding',
                    },
                    {
                      label:
                        'Reviewed postpartum nutrition for helping your body recover from birth.',
                      value: 'healthy_parent_healthy_baby_postpartum',
                    },
                    {
                      label:
                        'Discussed Healthy Plate as a way to control portion sizes and the importance of trying different foods, especially non-starchy vegetables and different lean proteins.',
                      value: 'health_plate_portions',
                    },
                    {
                      label:
                        'Increased knowledge of nutrition management by providing appropriate education on Healthy Plate guidelines with a focus on macro and micronutrient consumption.',
                      value: 'health_plate_knowledge',
                    },
                    {
                      label:
                        'Reviewed Healthy Plate guidelines: 1/2 plate non-starchy vegetables, 1/4 plate lean protein, 1/4 plate carbs (whole grains or fruit), small serving healthy fat.',
                      value: 'health_plate_guidelines',
                    },
                    {
                      label:
                        'Discussed the Healthy Plate guidelines for weight management and portion control.',
                      value: 'health_plate_weight_management',
                    },
                    {
                      label:
                        'Provided a clear explanation of SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals, emphasizing their importance in creating actionable and realistic health and wellness objectives.',
                      value: 'healthy_weight_smart',
                    },
                    {
                      label:
                        'Introduced the concept of the "Perfect Plate," focusing on portion control, balance of macronutrients (proteins, fats, and carbohydrates), and the inclusion of fruits, vegetables, and whole grains.',
                      value: 'healthy_weight_perfect_plate',
                    },
                    {
                      label: 'Reviewed how to read and interpret nutrition labels.',
                      value: 'healthy_weight_labels',
                    },
                    {
                      label:
                        'Discussed the importance of incorporating regular physical activity into daily life, emphasizing the benefits for weight management.',
                      value: 'healthy_weight_physical_activity',
                    },
                    {
                      label:
                        'Introduced the principles of mindful eating, emphasizing awareness of hunger cues, the sensory experience of eating, and the emotional aspects of food.',
                      value: 'healthy_weight_mindful_eating',
                    },
                    {
                      label:
                        'Educated patient on making healthier menu choices when dining out, including portion control, choosing nutrient-dense options, and understanding menu terminology.',
                      value: 'healthy_weight_menu_choices',
                    },
                    {
                      label:
                        'Provided guidance on selecting nutritious, budget-friendly foods, focusing on whole foods, seasonal produce, and cost-effective protein sources.',
                      value: 'healthy_weight_cost',
                    },
                    {
                      label:
                        'Introduced strategies to manage and reduce cravings, such as mindful eating, stress management, and incorporating satisfying, nutrient-dense foods into the diet.',
                      value: 'healthy_weight_cravings',
                    },
                    {
                      label:
                        'Guided patient in creating an action plan to address setbacks, focusing on small, achievable steps to regain momentum.',
                      value: 'healthy_weight_action_plan',
                    },
                    {
                      label:
                        'Provided general strategies to overcome plateaus, such as adjusting nutrition, varying physical activity, and reviewing lifestyle habits.',
                      value: 'healthy_weight_plateau',
                    },
                    {
                      label: 'Educated patient on strategies for social events.',
                      value: 'healthy_weight_social_events',
                    },
                    {
                      label: 'Educated patient on strategies for long term success.',
                      value: 'healthy_weight_long_term',
                    },
                    {
                      label:
                        'Provided diet education on strategies to increase intake of healthy fats and fiber and decrease intake of saturated fats to reach overall goals of improving lipid panel.',
                      value: 'heart_health_diet_education',
                    },
                    {
                      label:
                        'Reviewed to eat a variety of foods with healthy fats, particularly focusing on omega-3 fats found in fatty fish and certain nuts/seeds.',
                      value: 'heart_health_variety',
                    },
                    {
                      label:
                        'Educated on heart disease prevention and the importance of a heart-healthy diet, regular exercise, and stress management.',
                      value: 'heart_health_prevention',
                    },
                    {
                      label:
                        'Provided diet education on nutritional strategies to aid with management of cholesterol (LDL, HDL, triglycerides).',
                      value: 'heart_health_cholesterol',
                    },
                    {
                      label:
                        'Educated on major causes of heart disease, hypertension and high cholesterol and how they affect heart health.',
                      value: 'heart_health_causes',
                    },
                    {
                      label:
                        'Emphasized fruits, vegetables, whole grains, healthy fats and lean protein to support heart health.',
                      value: 'heart_health_foods',
                    },
                    {
                      label:
                        'Discussed the difference between saturated and unsaturated fats and the role they play in heart health.',
                      value: 'heart_health_fats',
                    },
                    {
                      label:
                        'Identified foods that are high in sodium and developed strategies to avoid them.',
                      value: 'heart_health_sodium',
                    },
                    {
                      label: 'Discussed the importance of fiber and how to add more to your diet.',
                      value: 'heart_health_fiber',
                    },
                    {
                      label:
                        'Identified sources of added sugar that can be hidden in your diet and ways to reduce sugar intake.',
                      value: 'heart_health_sugar',
                    },
                    {
                      label:
                        'Reviewed the importance of staying hydrated and easy ways to help you stay hydrated each day.',
                      value: 'heart_health_hydration',
                    },
                    {
                      label:
                        'Educated on how to read a nutrition label and find heart-healthy foods within your budget.',
                      value: 'heart_health_label',
                    },
                    {
                      label:
                        'Discussed ways to incorporate plant-based protein and new cooking techniques to build heart-healthy meals.',
                      value: 'heart_health_plant_protein',
                    },
                    {
                      label:
                        'Educated on the importance of daily movement and finding an exercise routine that works.',
                      value: 'heart_health_physical_exercise',
                    },
                    {
                      label:
                        'Discussed how sleep and stress can affect your heart and identified ways to improve the quality of your sleep and ways to reduce stress.',
                      value: 'heart_health_sleep_stress',
                    },
                    {
                      label: 'Reviewed ways to maintain your heart-healthy lifestyle.',
                      value: 'heart_health_lifestyle',
                    },
                    {
                      label:
                        'Discussed the importance of hydration and aim for proper fluid intake with meals and snacks.',
                      value: 'hydration_importance',
                    },
                    {
                      label:
                        'Recommend staying hydrated by drinking at least your goal number of ounces of water daily.',
                      value: 'hydration_goals',
                    },
                    {
                      label:
                        'Educated on staying hydrated by setting reminders or integrating water intake into your routine.',
                      value: 'hydration_reminders',
                    },
                    {
                      label:
                        'Discussed the importance of hydration for helping to ensure adequate energy levels. Explained that hunger and thirst cues can be easily confused.',
                      value: 'hydration_energy',
                    },
                    {
                      label:
                        'Provided education on specific micronutrients and impact on health or disease state.',
                      value: 'micronutrients_education',
                    },
                    {
                      label:
                        'Provided overview of program curriculum, discussed member goals, and discussed basics of sports performance using the nutritional pyramid of importance.',
                      value: 'peak_performance_overview',
                    },
                    {
                      label:
                        'Reviewed weekly progress, discussed the functional role of macronutrients in an athlete’s diet, explained principles for adjusting macronutrient intake based on training type or intensity, and created a personalized list of performance foods.',
                      value: 'peak_performance_macronutrients',
                    },
                    {
                      label:
                        'Reviewed weekly progress, defined nutrition-specific metrics to monitor (as needed), and discussed recommendations for timing nutrition to promote optimal energy during and recovery from training.',
                      value: 'peak_performance_metrics',
                    },
                    {
                      label:
                        'Reviewed weekly progress, discussed role of hydration in health and athletic performance, evaluated current adequacy of hydration, and discussed strategies for monitoring and adapting hydration for optimal health and performance.',
                      value: 'peak_performance_hydration',
                    },
                    {
                      label:
                        'Established current intake of sports-related dietary supplements, evaluated individual decision-making process for use of dietary supplements, and communicated principles for determining effectiveness and safety of dietary supplements.',
                      value: 'peak_performance_supplements',
                    },
                    {
                      label:
                        'Discussed strategies for adjusting nutritional intake during travel, including meal choice at restaurants and ways to adapt available foods to satisfy performance plate goals.',
                      value: 'peak_performance_travel',
                    },
                    {
                      label:
                        'Discussed relevance of body composition to athletic performance, reviewed strategies for adapting nutritional intake based on body composition goals, and discussed appropriate pace and timing for body weight modification.',
                      value: 'peak_performance_body_composition',
                    },
                    {
                      label:
                        'Reinforced sports nutrition knowledge foundations (role of macronutrients, fuel timing) and evaluated potential benefits and pitfalls of various eating patterns.',
                      value: 'peak_performance_knowledge',
                    },
                    {
                      label:
                        'Discussed principles of energy availability for sport, signs or symptoms of RED-s or Low EA and strategies to reduce the risk of low EA or RED-s.',
                      value: 'peak_performance_energy_availability',
                    },
                    {
                      label:
                        'Explained the impact of alcohol on athletic performance or recovery, and discussed strategies to mitigate undesirable effects of alcohol consumption relevant to individual preferences.',
                      value: 'peak_performance_alcohol',
                    },
                    {
                      label:
                        'Evaluated current sleep habits, reviewed foods which could negatively impact sleep quantity or quality, and created individual goals for improving sleep hygiene.',
                      value: 'peak_performance_sleep',
                    },
                    {
                      label:
                        'Outlined nutritional tactics to optimize health and body composition when training load is decreased (off-season), introduced mindful eating and meal planning tactics to adjust caloric intake for reduced activity, and reinforced available Foodsmart resources to support fueling goals.',
                      value: 'peak_performance_tactics',
                    },
                    {
                      label:
                        'Encouraged adding flexibility, stability, and balance exercises to the regimen.',
                      value: 'physical_activity_stability',
                    },
                    {
                      label:
                        'Focused on cardiovascular or endurance activities, strength-training, stretching for flexibility, and balance exercises.',
                      value: 'physical_activity_cardio',
                    },
                    {
                      label:
                        'Increased activity at work by setting reminders to stand up every hour.',
                      value: 'physical_activity_work',
                    },
                    {
                      label: 'Reviewed your goal number of minutes of exercise per day.',
                      value: 'physical_activity_goal',
                    },
                    {
                      label:
                        'Discussed portion control using hands as a guide (fist = carbs, palm = protein, thumb = fats) as well as using calorie guide provided in the patient summary.',
                      value: 'portion_control_hands',
                    },
                    {
                      label: 'Practiced portion control strategies and mindful eating habits.',
                      value: 'portion_control_strategies',
                    },
                    {
                      label:
                        'Discussed the importance of sleep in weight loss and suggested techniques to improve sleep hygiene.',
                      value: 'sleep_weight',
                    },
                    {
                      label:
                        'Recommended improving sleep quality by working on sleep hygiene, including physical activity, reducing sugar intake, avoiding caffeine, and creating a bedtime routine.',
                      value: 'sleep_quality',
                    },
                    {
                      label:
                        'Reviewed background and customized health goals and needs, food budget, lifestyle, and cooking skills.',
                      value: 'food_insecurity_goals',
                    },
                    {
                      label:
                        'Discussed reading a nutrition label to create a plate packed with superfoods that are nutrient-dense and cost-effective.',
                      value: 'food_insecurity_nutrition_label',
                    },
                    {
                      label:
                        'Reviewed kitchen tools and appliances that are available to use to make healthy meals.',
                      value: 'food_insecurity_kitchen_tools',
                    },
                    {
                      label:
                        'Reviewed food budget and how to stretch the dollar with coupons, budgeting tools, and affordable foods.',
                      value: 'food_insecurity_budget_tools',
                    },
                    {
                      label:
                        'Discussed how to make grocery shopping faster and cheaper using Foodsmart tools.',
                      value: 'food_insecurity_shopping',
                    },
                    {
                      label:
                        'Discussed easy meal planning techniques to save money and reduce food waste.',
                      value: 'food_insecurity_meal_planning',
                    },
                    {
                      label:
                        'Discussed stretching the budget with canned and frozen foods, filling snacks, and plant-based proteins.',
                      value: 'food_insecurity_budget_foods',
                    },
                    {
                      label:
                        'Reviewed simple cooking techniques and food safety basics that will help with healthy cooking.',
                      value: 'food_insecurity_cooking_techniques',
                    },
                    {
                      label:
                        'Reviewed the importance to avoid impulse purchases and expensive fast foods runs with healthy and affordable tips for busy days.',
                      value: 'food_insecurity_impulse',
                    },
                    {
                      label:
                        'Discussed local resources to help access affordable healthy foods like food banks, school programs, and farmers markets.',
                      value: 'food_insecurity_local_resources',
                    },
                    {
                      label:
                        'Reviewed barriers to health goals and created a SNAP reenrollment plan.',
                      value: 'food_insecurity_barriers',
                    },
                    {
                      label:
                        'Summarized past goals and accomplishments that turned into healthy habits and set new goals to continue for improvements.',
                      value: 'food_insecurity_past_goals',
                    },
                    {
                      label: 'Reviewed coping skills to improve stress management.',
                      value: 'stress_coping',
                    },
                    {
                      label:
                        'Recommend using a food journal to track food intake, symptoms, and meal times.',
                      value: 'tracking_journal',
                    },
                    {
                      label:
                        'Educated on adding vegetables (non-starchy) to meals and snacks consistently throughout the day.',
                      value: 'vegetables_adding',
                    },
                    {
                      label: 'Reviewed your goal number of servings of vegetables per meal.',
                      value: 'vegetables_goal',
                    },
                    {
                      label: 'Provided healthy nutrition strategies to save money.',
                      value: 'wallet_wellness_strategies',
                    },
                    {
                      label: 'Enrolled member in SNAP.',
                      value: 'wallet_wellness_snap',
                    },
                    {
                      label:
                        'Reviewed background and customized health goals and needs, food budget, lifestyle, and cooking skills.',
                      value: 'wallet_wellness_goals',
                    },
                    {
                      label:
                        'Discussed how to build a balanced meal using nutritionally dense and cost-effective foods.',
                      value: 'wallet_wellness_balanced_meals',
                    },
                    {
                      label:
                        'Discovered budget-friendly recipes in the Foodsmart app and made a list of low-cost foods to keep on hand.',
                      value: 'wallet_wellness_budget_meals',
                    },
                    {
                      label:
                        'Utilized the Foodsmart website to help meal plan while accounting for time and budget.',
                      value: 'wallet_wellness_foodsmart_website',
                    },
                    {
                      label:
                        'Focused on local seasonal produce and when to buy canned or frozen foods to cut down on meal costs.',
                      value: 'wallet_wellness_local_produce',
                    },
                    {
                      label:
                        'Reviewed the cost and nutrient breakdown of different protein sources like beans, lentils, tofu, red meat, poultry, and seafood.',
                      value: 'wallet_wellness_protein',
                    },
                    {
                      label:
                        'Discussed money-saving tips by finding best deals with generic brands, bulk foods, and cost/unit.',
                      value: 'wallet_wellness_deals',
                    },
                    {
                      label:
                        'Reviewed the basics of growing the easiest foods at home to supplement groceries.',
                      value: 'wallet_wellness_gardening',
                    },
                    {
                      label:
                        'Reviewed meal planning strategy for busy and emergency nights to avoid expensive takeout.',
                      value: 'wallet_wellness_takeout',
                    },
                    {
                      label:
                        'Discussed storage options for food to prevent unnecessary waste and to stretch food scraps.',
                      value: 'wallet_wellness_storage',
                    },
                    {
                      label:
                        'Discussed turning one meal into multiple meals by safely storing and repurposing leftovers.',
                      value: 'wallet_wellness_leftovers',
                    },
                    {
                      label:
                        'Discussed increasing knowledge of nutrition to support weight management through balanced meals, portion control, lean protein, and fiber-rich carbohydrates.',
                      value: 'weight_management_knowledge',
                    },
                    {
                      label:
                        'Recommend adding a source of protein, fiber, or healthy fat to all meals or snacks for increased satiety and more lasting energy.',
                      value: 'weight_management_satiety',
                    },
                    {
                      label:
                        'Discussed strategies for navigating slips and setbacks in healthy eating and lifestyle changes.',
                      value: 'weight_management_setbacks',
                    },
                    {
                      label:
                        'Educated on balanced meal planning and portion control for weight management.',
                      value: 'weight_management_balanced_meals',
                    },
                    {
                      label: 'Encouraged regular weight checks and diet recall to track progress.',
                      value: 'weight_management_weight_checks',
                    },
                    {
                      label:
                        'Introduced principles of intuitive eating and mindfulness surrounding food.',
                      value: 'weight_management_intuitive_eating',
                    },
                    {
                      label:
                        'Educated on macro and micronutrients to meet dietary recommendations for optimal health and weight maintenance.',
                      value: 'weight_management_nutrients',
                    },
                    {
                      label:
                        'Practiced mindful eating by savoring every bite, minimizing distractions, and engaging all senses while eating.',
                      value: 'weight_management_mindful_eating',
                    },
                    {
                      label:
                        'Discussed prepping the fridge and pantry for success and simple and healthy meals.',
                      value: 'weight_management_fridge_pantry',
                    },
                    {
                      label:
                        'Promoted mindful eating, including recognizing hunger and fullness cues.',
                      value: 'weight_management_hunger_cues',
                    },
                    {
                      label:
                        'Provided education on calorie tracking; recommended eating within your calorie goal range per day to promote sustained weight loss.',
                      value: 'weight_management_calories',
                    },
                  ],
                },
                {
                  type: 'input:textarea',
                  inputLabel: 'Intervention notes',
                  prevAnswerPrompt: 'readonly',
                  key: 'intervention_notes',
                },
              ],
            },
            {
              type: 'group',
              title: 'Monitoring & evaluation',
              groupKey: 'monitoring_and_evaluation_group',
              widgets: [
                {
                  type: 'input:radio-v2',
                  key: 'member_expressed_understanding_of_education',
                  required: true,
                  label: 'Member expressed an understanding of the education.',
                  options: [
                    {
                      type: 'basic',
                      label: 'Yes',
                      value: 'yes',
                    },
                    {
                      type: 'basic',
                      label: 'No',
                      value: 'no',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  key: 'member_felt_confident_in_ability_to_meet_goals',
                  required: true,
                  label: 'Member felt confident in their ability to meet the goals discussed.',
                  options: [
                    {
                      type: 'basic',
                      label: 'Yes',
                      value: 'yes',
                    },
                    {
                      type: 'basic',
                      label: 'No',
                      value: 'no',
                    },
                  ],
                },
                {
                  type: 'group',
                  groupKey: 'general_encounter_notes_group',
                  title: 'General encounter notes',
                  widgets: [
                    {
                      type: 'input:textarea',
                      inputLabel: 'General notes',
                      key: 'general_encounter_notes',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'group',
          title: 'Encounter closeout',
          groupKey: 'encounter_closeout_group',
          widgets: [
            {
              type: 'group',
              title: 'Billing details',
              groupKey: 'billing_details',
              widgets: [
                {
                  type: 'input:time',
                  inputLabel: 'End time',
                  key: 'end_time',
                  description: 'Timezone: HST',
                  required: true,
                  size: 'md',
                },
                {
                  type: 'html',
                  name: 'start_time_html',
                  html: {
                    text: '<p class="text-neutral-600 text-sm -mt-2">Start time: {{start_time}}</p>',
                    interpolate: {
                      start_time: {
                        key: 'start_time',
                        type: 'time',
                        format: 'h:mm a ZZZZ',
                        timezone: 'Pacific/Honolulu',
                      },
                    },
                  },
                },
                {
                  type: 'html',
                  name: 'duration_html',
                  html: {
                    text: 'Duration: {{minutes}} minutes',
                    interpolate: {
                      minutes: {
                        type: 'date-diff',
                        key1: 'start_time',
                        key2: 'end_time',
                      },
                    },
                  },
                },
                {
                  type: 'input:number',
                  key: 'units_billed',
                  inputLabel: 'Units billed',
                  required: true,
                  min: 1,
                  max: 8,
                  size: 'md',
                },
                {
                  type: 'input:combobox',
                  key: 'cpt_code',
                  required: true,
                  inputLabel: 'Billing / CPT code',
                  options: [
                    {
                      label: '97802',
                      value: '97802',
                    },
                    {
                      label: '97803',
                      value: '97803',
                    },
                    {
                      label: '99202',
                      value: '99202',
                    },
                    {
                      label: '99203',
                      value: '99203',
                    },
                    {
                      label: '99204',
                      value: '99204',
                    },
                    {
                      label: '99205',
                      value: '99205',
                    },
                    {
                      label: '99212',
                      value: '99212',
                    },
                    {
                      label: '99213',
                      value: '99213',
                    },
                    {
                      label: '99214',
                      value: '99214',
                    },
                    {
                      label: '99215',
                      value: '99215',
                    },
                    {
                      label: 'S9470',
                      value: 'S9470',
                    },
                  ],
                  size: 'lg',
                },
                {
                  type: 'input:combobox',
                  key: 'diagnosis_code',
                  inputLabel: 'Diagnosis code',
                  required: true,
                  options: [
                    {
                      label: 'Z71.3',
                      value: 'Z71.3',
                    },
                  ],
                  size: 'md',
                },
              ],
            },
            {
              type: 'input:textarea',
              key: 'note_to_member',
              label: 'Note to member',
              prevAnswerPrompt: 'readonly',
              inputLabel: 'Member instructions',
              size: 'xl',
              required: true,
            },
          ],
        },
      ],
    },
  },
};

export default chartingConfig;
