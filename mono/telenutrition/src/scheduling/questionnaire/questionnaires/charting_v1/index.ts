import { IContext } from '@mono/common/src/context';
import { GroupWidget } from '../../types';
import { PatientRecord } from '../../../patient/store';
import { billingCPTcodeOptions } from '../../consts';
import { PatientAttributeName } from '../../../../patient-attribute-types';
import { alphabeticalSort, getAllPatientAttributeOptions } from '../../helpers';
import { getPatientAttributeOptions, getPesStatementOptions } from '../../../../patient-attribute-options';
import { DateTime } from 'luxon';

interface ChartingV1ConfigParams {
  patient: PatientRecord;
  providerTimezone: string;
}

type ConfigGroup = { key: string; groups: GroupWidget[] };
export type ChartingConfig = {
  chartingGroups: ConfigGroup;
};

export function getPatientAttributeName(patientAttributeName: PatientAttributeName): PatientAttributeName {
  return patientAttributeName;
}

export type ChartingV1Config = ChartingConfig;

export function chartingV1Config(context: IContext, params: ChartingV1ConfigParams): ChartingV1Config {
  const { i18n } = context;

  const { patient, providerTimezone } = params;

  const timezoneDisplay = DateTime.fromJSDate(new Date(), { zone: providerTimezone }).toFormat('ZZZZ');

  const options = getPatientAttributeOptions(context);

  return {
    chartingGroups: {
      key: 'charting',
      groups: [
        {
          type: 'group',
          title: i18n.__('Member Details'),
          groupKey: 'member_details',
          widgets: [
            {
              type: 'group',
              groupKey: 'basic_details',
              title: i18n.__('Basic details'),
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
                        label: i18n.__('Legal first name'),
                        content: patient.firstName ?? '-',
                      },
                      size: 'md',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'last_name',
                        label: i18n.__('Legal last name'),
                        content: patient.lastName ?? '-',
                      },
                      size: 'md',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'member_phone_number',
                        label: i18n.__('Member phone number'),
                        content: patient.phone ?? '-',
                      },
                      size: 'md',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'member_email',
                        label: i18n.__('Member email'),
                        content: patient.email ?? '-',
                      },
                      size: 'md',
                    },
                    ...(patient.accountEmail || patient.accountPhone
                      ? [
                          {
                            widget: {
                              type: 'data-display' as const,
                              name: 'account_phone_number',
                              label: i18n.__('Account phone number'),
                              content: patient.accountPhone ?? '-',
                            },
                            size: 'md' as const,
                          },
                          {
                            widget: {
                              type: 'data-display' as const,
                              name: 'account_email',
                              label: i18n.__('Account email'),
                              content: patient.accountEmail ?? '-',
                            },
                            size: 'md' as const,
                          },
                        ]
                      : [
                          {
                            widget: {
                              type: 'data-display' as const,
                              name: 'account_info',
                              label: i18n.__('Account Info'),
                              content: i18n.__('User account does not exist for this patient'),
                            },
                            size: 'full' as const,
                          },
                        ]),
                    {
                      widget: {
                        type: 'data-display',
                        name: 'dob',
                        label: i18n.__('Birthday'),
                        content: patient.birthday ? `${patient.birthday} (${i18n.__('Age')} ${patient.age})` : '-',
                      },
                      size: 'md',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'sex',
                        label: i18n.__('Sex'),
                        content: patient.sex ?? '-',
                      },
                      size: 'md',
                    },
                    {
                      size: 'full',
                      widget: {
                        type: 'data-display',
                        name: 'address',
                        label: i18n.__('Street address'),
                        content: [patient.address1, patient.address2].filter((a) => !!a).join(' ') ?? '-',
                      },
                    },
                    {
                      size: 'md',
                      widget: {
                        type: 'data-display',
                        name: 'city',
                        label: i18n.__('City'),
                        content: patient.city ?? '-',
                      },
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'state',
                        label: i18n.__('State'),
                        content: patient.state ?? '-',
                      },
                      size: 'sm',
                    },
                    {
                      widget: {
                        type: 'data-display',
                        name: 'zipcode',
                        label: i18n.__('Postal code'),
                        content: patient.zipcode ?? '-',
                      },
                      size: 'sm',
                    },
                  ],
                },
                {
                  type: 'single-checkbox',
                  key: 'member_details_confirmed',
                  checkboxLabel: i18n.__(
                    'Confirm member name, date of birth, and state where they are currently located.',
                  ),
                  required: true,
                },
              ],
            },
          ],
        },
        {
          type: 'group',
          title: i18n.__('Assessment'),
          groupKey: 'assessment',
          widgets: [
            {
              type: 'group',
              groupKey: 'general_questions_group',
              title: i18n.__('General questions'),
              widgets: [
                {
                  type: 'input:time',
                  inputLabel: i18n.__('Start time'),
                  key: 'start_time',
                  required: true,
                  description: `Timezone: ${timezoneDisplay}`,
                  size: 'md',
                },
                {
                  type: 'input:textarea',
                  label: i18n.__("Member's stated goals"),
                  inputLabel: i18n.__('Goals'),
                  key: 'stated_member_goals',
                  size: 'xl',
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__('What is your main reason for using Foodsmart?'),
                  key: getPatientAttributeName('main_reason'),
                  required: true,
                  prevAnswerPrompt: 'fillable',
                  options: [
                    ...[
                      options.main_reason.general_wellness,
                      options.main_reason.lose_weight,
                      options.main_reason.gain_weight,
                      options.main_reason.improve_physical_fitness,
                      options.main_reason.improve_mental_health,
                      options.main_reason.supporting_pregnancy,
                      options.main_reason.help_with_food_allergy,
                    ].map((q) => ({ label: q.option_text, value: q.option_code })),
                    {
                      type: 'combobox',
                      label: i18n.__('Manage condition...'),
                      inputLabel: i18n.__('Select condition'),
                      value: 'manage_condition',
                      options: [
                        options.main_reason.prediabetes,
                        options.main_reason.type_1_diabetes,
                        options.main_reason.type_2_diabetes,
                        options.main_reason.hypertension,
                        options.main_reason.obesity,
                        options.main_reason.ibs,
                        options.main_reason.mental_disorder,
                        options.main_reason.congestive_heart_failure,
                        options.main_reason.malignant_neoplastic_disease,
                        options.main_reason.crohns_disease,
                        options.main_reason.ulcerative_colitis,
                        options.main_reason.rheumatoid_arthritis,
                        options.main_reason.osteoarthritis,
                        options.main_reason.cerebrovascular_accident,
                        options.main_reason.phenylketonuria,
                        options.main_reason.dementia,
                        options.main_reason.disorder_of_liver,
                        options.main_reason.gallbladder_calculus,
                        options.main_reason.sleep_apnea,
                        options.main_reason.gastritis,
                        options.main_reason.alzheimers_disease,
                        options.main_reason.copd,
                        options.main_reason.heart_disease,
                        options.main_reason.hypercholesterolemia,
                        options.main_reason.disorder_of_thyroid_gland,
                        options.main_reason.chronic_kidney_disease,
                        options.main_reason.end_stage_renal_disease,
                        options.main_reason.celiac_disease,
                        options.main_reason.gestational_diabetes_mellitus,
                        options.main_reason.pregnancy_induced_hypertension,
                        options.main_reason.pre_eclampsia,
                        options.main_reason.autoimmune_disease,
                        options.main_reason.eating_disorder,
                        options.main_reason.arthritis,
                        options.main_reason.gerd,
                        options.main_reason.lymphedema,
                        options.main_reason.neuropathy,
                        options.main_reason.anemia,
                        options.main_reason.pcos,
                        options.main_reason.malnutrition,
                        options.main_reason.hiv,
                        options.main_reason.aids,
                      ]
                        .map((q) => ({ label: q.option_text, value: q.option_code }))
                        .sort(alphabeticalSort),
                    },
                    ...[options.main_reason.help_getting_cooking_food, options.main_reason.help_affording_food].map(
                      (q) => ({ label: q.option_text, value: q.option_code }),
                    ),
                  ],
                },
                {
                  type: 'conditional-tag-input',
                  label: i18n.__('Do you have any of the following medical conditions?'),
                  key: getPatientAttributeName('medical_conditions'),
                  required: true,
                  inputLabel: i18n.__('Medical conditions'),
                  options: getAllPatientAttributeOptions(context, 'medical_conditions', 'alphabetical'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'single-checkbox',
                  checkboxLabel: i18n.__('The member is pregnant'),
                  key: getPatientAttributeName('pregnancy'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'conditional',
                  name: 'pregnancy_conditional_widgets',
                  conditions: [['booleanEquals', 'pregnancy', true]],
                  widgets: [
                    {
                      type: 'input:date',
                      key: getPatientAttributeName('pregnancy_due_date'),
                      prevAnswerPrompt: 'fillable',
                      inputLabel: i18n.__('Due date'),
                      size: 'md',
                    },
                    {
                      type: 'input:radio-v2',
                      label: i18n.__('High risk pregnancy'),
                      sublabel: i18n.__(
                        'Has member been told by a provider that they are at high risk, are not currently receiving any prenatal care, or are high risk due to gestational diabetes, pregnancy-induced hypertension, history of SGA?',
                      ),
                      size: 'xl',
                      key: getPatientAttributeName('pregnancy_risk'),
                      prevAnswerPrompt: 'fillable',
                      options: getAllPatientAttributeOptions(context, 'pregnancy_risk'),
                    },
                  ],
                },
                {
                  type: 'single-checkbox',
                  checkboxLabel: i18n.__('The member is breast/chestfeeding'),
                  key: getPatientAttributeName('is_breastfeeding'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'conditional-tag-input',
                  label: i18n.__('Do you take any of the following medications?'),
                  inputLabel: i18n.__('Medications'),
                  required: true,
                  key: getPatientAttributeName('medications_list'),
                  options: getAllPatientAttributeOptions(context, 'medications_list', 'alphabetical'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  key: 'member_is_smoker',
                  prevAnswerPrompt: 'fillable',
                  label: i18n.__('Do you smoke?'),
                  options: getAllPatientAttributeOptions(context, 'member_is_smoker'),
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__('Have you been in a medical facility for inpatient treatment in the last 90 days?'),
                  key: getPatientAttributeName('inpatient_visit_last_90_days'),
                  options: getAllPatientAttributeOptions(context, 'inpatient_visit_last_90_days'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'conditional',
                  conditions: [['stringEquals', 'inpatient_visit_last_90_days', 'inpatient_treatment_last_90_days']],
                  name: 'conditional_inpatient_treatment_questions',
                  widgets: [
                    {
                      type: 'input:date',
                      key: 'inpatient_discharge_date',
                      prevAnswerPrompt: 'fillable',
                      size: 'md',
                      inputLabel: i18n.__('Discharge date'),
                      max: new Date().toISOString(),
                    },
                    {
                      type: 'multi-select',
                      key: getPatientAttributeName('inpatient_visit_facility'),
                      size: 'md',
                      prevAnswerPrompt: 'fillable',
                      label: i18n.__('Facility'),
                      sublabel: i18n.__('Leave unselected of member chooses to not disclose'),
                      options: getAllPatientAttributeOptions(context, 'inpatient_visit_facility'),
                    },
                    {
                      type: 'input:combobox',
                      key: getPatientAttributeName('reason_for_inpatient_visit'),
                      size: 'md',
                      prevAnswerPrompt: 'fillable',
                      inputLabel: i18n.__('Reason for admission'),
                      options: getAllPatientAttributeOptions(context, 'reason_for_inpatient_visit', 'alphabetical'),
                    },
                  ],
                },
                {
                  type: 'conditional-tag-input',
                  label: i18n.__('Do you have any of the following GI Symptoms?'),
                  inputLabel: i18n.__('GI Symptoms'),
                  key: getPatientAttributeName('gi_symptoms'),
                  options: getAllPatientAttributeOptions(context, 'gi_symptoms', 'alphabetical'),
                  prevAnswerPrompt: 'fillable',
                }
              ],
            },
            {
              type: 'group',
              groupKey: 'biometrics_questions_group',
              title: i18n.__('Biometrics'),
              widgets: [
                {
                  type: 'flex-row',
                  name: 'height_grid',
                  title: i18n.__('Height'),
                  maxSize: 'xl',
                  widgets: [
                    {
                      size: 'sm',
                      widget: {
                        type: 'input:number',
                        inputLabel: i18n.__('Feet'),
                        key: 'height_feet',
                        prevAnswerPrompt: 'fillable',
                        prevAnswerPromptLocation: 'parent',
                        min: 0,
                        max: 10,
                      },
                    },
                    {
                      size: 'sm',
                      widget: {
                        type: 'input:number',
                        inputLabel: i18n.__('Inches'),
                        key: 'height_inches',
                        prevAnswerPrompt: 'fillable',
                        prevAnswerPromptLocation: 'parent',
                        min: 0,
                        max: 11,
                        decimalScale: 1,
                      },
                    },
                  ],
                },
                {
                  type: 'questions-with-date',
                  key: getPatientAttributeName('weight'),
                  label: i18n.__('Weight'),
                  dateInputLabel: i18n.__('Date recorded'),
                  maxDate: new Date().toISOString(),
                  prevAnswerPrompt: 'fillable',
                  question: {
                    type: 'input:number',
                    size: 'md',
                    prevAnswerPrompt: 'fillable',
                    inputLabel: `${i18n.__('Value')} (lbs)`,
                    min: 0,
                    max: 1000,
                    decimalScale: 1,
                  },
                },
                {
                  type: 'questions-with-date',
                  size: 'xl',
                  key: getPatientAttributeName('blood_pressure_systolic'),
                  dateInputLabel: i18n.__('Date recorded'),
                  label: i18n.__('Blood pressure (mmHg)'),
                  maxDate: new Date().toISOString(),
                  hideBottomBorder: true,
                  showHistoricalValues: true,
                  prevAnswerPrompt: 'fillable',
                  question: {
                    type: 'input:number',
                    size: 'sm',
                    inputLabel: i18n.__('Systolic'),
                    min: 1,
                    max: 1000,
                  },
                },
                {
                  type: 'questions-with-date',
                  size: 'xl',
                  key: getPatientAttributeName('blood_pressure_diastolic'),
                  dateInputLabel: i18n.__('Date recorded'),
                  maxDate: new Date().toISOString(),
                  showHistoricalValues: true,
                  prevAnswerPrompt: 'fillable',
                  question: {
                    type: 'input:number',
                    size: 'sm',
                    inputLabel: i18n.__('Diastolic'),
                    min: 1,
                    max: 1000,
                  },
                },
                {
                  type: 'questions-with-date',
                  key: getPatientAttributeName('a1c'),
                  size: 'xl',
                  dateInputLabel: i18n.__('Date recorded'),
                  maxDate: new Date().toISOString(),
                  label: i18n.__('A1c lab results'),
                  showHistoricalValues: true,
                  prevAnswerPrompt: 'fillable',
                  question: {
                    type: 'input:number',
                    size: 'md',
                    inputLabel: i18n.__('Value (%)'),
                    min: 0,
                    max: 1000,
                    decimalScale: 1,
                  },
                },
                {
                  type: 'questions-with-date',
                  key: getPatientAttributeName('hdl'),
                  size: 'xl',
                  label: i18n.__('Most recent lipids measurements'),
                  dateInputLabel: i18n.__('Date recorded'),
                  maxDate: new Date().toISOString(),
                  hideBottomBorder: true,
                  showHistoricalValues: true,
                  prevAnswerPrompt: 'fillable',
                  question: {
                    size: 'md',
                    type: 'input:number',
                    inputLabel: i18n.__('HDL (mg/DL)'),
                    min: 0,
                    max: 1000,
                    decimalScale: 1,
                  },
                },
                {
                  type: 'questions-with-date',
                  key: getPatientAttributeName('ldl'),
                  size: 'xl',
                  dateInputLabel: i18n.__('Date recorded'),
                  maxDate: new Date().toISOString(),
                  hideBottomBorder: true,
                  showHistoricalValues: true,
                  prevAnswerPrompt: 'fillable',
                  question: {
                    type: 'input:number',
                    size: 'md',
                    inputLabel: i18n.__('LDL (mg/DL)'),
                    min: 0,
                    max: 1000,
                    decimalScale: 1,
                  },
                },
                {
                  type: 'questions-with-date',
                  key: getPatientAttributeName('triglycerides'),
                  size: 'xl',
                  dateInputLabel: i18n.__('Date recorded'),
                  maxDate: new Date().toISOString(),
                  hideBottomBorder: true,
                  showHistoricalValues: true,
                  prevAnswerPrompt: 'fillable',
                  question: {
                    type: 'input:number',
                    size: 'md',
                    inputLabel: i18n.__('Triglycerides (mg/DL)'),
                    min: 0,
                    max: 5000,
                    decimalScale: 1,
                  },
                },
                {
                  type: 'questions-with-date',
                  key: getPatientAttributeName('total_cholesterol'),
                  size: 'xl',
                  dateInputLabel: i18n.__('Date recorded'),
                  maxDate: new Date().toISOString(),
                  hideBottomBorder: true,
                  showHistoricalValues: true,
                  prevAnswerPrompt: 'fillable',
                  question: {
                    type: 'input:number',
                    size: 'md',
                    inputLabel: i18n.__('Total Cholesterol (mg/DL)'),
                    min: 0,
                    max: 1000,
                    decimalScale: 1,
                  },
                },
              ],
            },
            {
              type: 'group',
              groupKey: 'diet_type_group',
              title: i18n.__('Diet type'),
              widgets: [
                {
                  type: 'conditional-tag-input',
                  label: i18n.__('Are you on any of the following specialized diets?'),
                  key: getPatientAttributeName('specialized_diet_type'),
                  size: 'xl',
                  inputLabel: i18n.__('Diet type'),
                  placeholder: i18n.__('Select diet'),
                  options: getAllPatientAttributeOptions(context, 'specialized_diet_type', 'alphabetical'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'conditional-tag-input',
                  label: i18n.__('Do you have any of the following sensitivities or intolerences?'),
                  key: getPatientAttributeName('food_sensitivity_intolerance'),
                  size: 'xl',
                  inputLabel: i18n.__('Sensitivities'),
                  placeholder: i18n.__('Select sensitivities or intolerances'),
                  options: getAllPatientAttributeOptions(context, 'food_sensitivity_intolerance', 'alphabetical'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'conditional-tag-input',
                  label: i18n.__('Do you have any of the following food allergies?'),
                  key: getPatientAttributeName('food_allergy'),
                  size: 'xl',
                  inputLabel: i18n.__('Allergies'),
                  placeholder: i18n.__('Select allergies'),
                  options: getAllPatientAttributeOptions(context, 'food_allergy'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'conditional-tag-input',
                  label: i18n.__('Do you take any of the following vitamins and or supplements?'),
                  key: getPatientAttributeName('vitamin_supplements'),
                  size: 'xl',
                  inputLabel: i18n.__('Supplements or vitamins'),
                  placeholder: i18n.__('Select supplements or vitamins'),
                  options: getAllPatientAttributeOptions(context, 'vitamin_supplements', 'alphabetical'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:number',
                  min: 0,
                  max: 10,
                  label: i18n.__('How many meals do you eat per day?'),
                  key: getPatientAttributeName('meals_per_day'),
                  inputLabel: i18n.__('Meals'),
                  size: 'sm',
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:time',
                  label: i18n.__('On average, what time is your first meal?'),
                  inputLabel: i18n.__('First meal'),
                  key: getPatientAttributeName('first_meal_of_day_time'),
                  size: 'sm',
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:time',
                  label: i18n.__('On average, what time is your last meal?'),
                  inputLabel: i18n.__('Last meal'),
                  key: getPatientAttributeName('last_meal_of_day_time'),
                  size: 'sm',
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:textarea',
                  key: 'diet_recall',
                  label: i18n.__('Diet recall notes'),
                  inputLabel: i18n.__('Notes'),
                  prevAnswerPrompt: 'fillable',
                },
              ],
            },
            {
              type: 'group',
              title: i18n.__('Lifestyle'),
              groupKey: 'lifestyle_group',
              widgets: [
                {
                  type: 'input:combobox',
                  label: i18n.__("What's your current working situation?"),
                  key: getPatientAttributeName('current_work_situation'),
                  inputLabel: i18n.__('Working situation'),
                  size: 'lg',
                  prevAnswerPrompt: 'fillable',
                  options: [
                    {
                      type: 'group',
                      groupLabel: i18n.__('Employed'),
                      options: [
                        { label: i18n.__('Full-time'), value: 'full_time' },
                        { label: i18n.__('Part-time'), value: 'part_time' },
                        { label: i18n.__('Seasonal or temporary'), value: 'seasonal_or_temp' },
                      ],
                    },
                    {
                      value: 'unemployed',
                      label: i18n.__('Unemployed'),
                    },
                    {
                      value: 'retired',
                      label: i18n.__('Retired'),
                    },
                    {
                      value: 'student',
                      label: i18n.__('Student'),
                    },
                    {
                      value: 'caretaker_for_family_members',
                      label: i18n.__('Caretaker for family members'),
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__("What's your current activity level?"),
                  key: getPatientAttributeName('activity_level'),
                  prevAnswerPrompt: 'fillable',
                  options: [
                    {
                      type: 'basic',
                      label: i18n.__('Low'),
                      sublabel: i18n.__('Only the physical activity of independent living.'),
                      value: 'low',
                    },
                    {
                      type: 'basic',
                      label: i18n.__('Medium'),
                      sublabel: i18n.__('Equivalent to walking about 1.5-3 miles per day at 3-4 mph.'),
                      value: 'medium',
                    },
                    {
                      type: 'basic',
                      label: i18n.__('High'),
                      sublabel: i18n.__('Equivalent to walking 3+ miles per day at 3-4 mph.'),
                      value: 'high',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__(
                    'For the past 6 months, to what extent have you been limited because of a health problem in activities people usually do?',
                  ),
                  key: getPatientAttributeName('health_related_activity_limitations'),
                  options: getAllPatientAttributeOptions(context, 'health_related_activity_limitations'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__(
                    'If you were in trouble, do you have relatives or friends you can count on to help you whenever you need them?',
                  ),
                  key: getPatientAttributeName('social_support'),
                  options: getAllPatientAttributeOptions(context, 'social_support'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:number',
                  label: i18n.__('How many hours of sleep do you get a night on average over the past 6 months?'),
                  min: 1,
                  max: 14,
                  key: getPatientAttributeName('average_sleep_duration'),
                  inputLabel: i18n.__('Hours'),
                  size: 'sm',
                  prevAnswerPrompt: 'fillable',
                },
              ],
            },
            {
              type: 'group',
              title: i18n.__('Cooking habits'),
              groupKey: 'cooking_habits_group',
              widgets: [
                {
                  type: 'input:radio-v2',
                  label: i18n.__('Who does most of the cooking in your household?'),
                  key: getPatientAttributeName('cooking_responsibility'),
                  options: getAllPatientAttributeOptions(context, 'cooking_responsibility'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__('How often do you cook meals at home or have them cooked by a household member?'),
                  key: getPatientAttributeName('cooking_frequency_at_home'),
                  options: getAllPatientAttributeOptions(context, 'cooking_frequency_at_home'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'multi-select',
                  label: i18n.__('For what reason(s) were meals made in other ways?'),
                  key: getPatientAttributeName('meal_preparation_reason'),
                  options: getAllPatientAttributeOptions(context, 'meal_preparation_reason'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__('How often do you or someone in your household purchase groceries?'),
                  key: getPatientAttributeName('grocery_purchasing_frequency'),
                  options: getAllPatientAttributeOptions(context, 'grocery_purchasing_frequency'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'multi-select',
                  label: i18n.__('How do you typically get your groceries?'),
                  key: getPatientAttributeName('grocery_acquisition_method'),
                  options: getAllPatientAttributeOptions(context, 'grocery_acquisition_method'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__('How often do you order take out or visit a restaurant/fast food establishment?'),
                  key: getPatientAttributeName('takeout_restaurant_frequency'),
                  options: getAllPatientAttributeOptions(context, 'takeout_restaurant_frequency'),
                  prevAnswerPrompt: 'fillable',
                },
              ],
            },
            {
              type: 'group',
              title: i18n.__('Food security'),
              groupKey: 'food_security_group',
              widgets: [
                {
                  type: 'multi-select',
                  label: i18n.__('How do you typically pay for your groceries?'),
                  key: getPatientAttributeName('grocery_payment_method'),
                  options: getAllPatientAttributeOptions(context, 'grocery_payment_method'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__(
                    'In the last 12 months, how often were you worried that food would run out before you got money to buy more?',
                  ),
                  key: getPatientAttributeName('food_shortage_worry_frequency'),
                  options: getAllPatientAttributeOptions(context, 'food_shortage_worry_frequency'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__(
                    'In the last 12 months, how often did the food you buy not last, and you didn’t have money to get more?',
                  ),
                  key: getPatientAttributeName('food_security_last_12_months'),
                  options: getAllPatientAttributeOptions(context, 'food_security_last_12_months'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__(
                    'Select which of these statements best describes the food eaten in your household in the last 12 months.',
                  ),
                  key: getPatientAttributeName('household_food_adequacy_last_12_months'),
                  options: getAllPatientAttributeOptions(context, 'household_food_adequacy_last_12_months'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  key: getPatientAttributeName('difficulty_getting_eating_healthy_foods'),
                  label: i18n.__(
                    'Thinking about the last 12 months, how hard was it for you or your household to regularly get and eat healthy foods?',
                  ),
                  options: getAllPatientAttributeOptions(context, 'difficulty_getting_eating_healthy_foods'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  key: getPatientAttributeName('snap_ebt_assistance_interest'),
                  label: i18n.__('Are you interested in having Foodsmart help you with SNAP/EBT benefits?'),
                  sublabel: i18n.__('Unsure about eligibility? Use the {{snap_screening_tool_link}}', {
                    snap_screening_tool_link: `<a href="https://www.snapscreener.com/screener" target="_blank">${i18n.__('SNAP screening tool')}</a>`,
                  }),
                  options: getAllPatientAttributeOptions(context, 'snap_ebt_assistance_interest'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:number',
                  key: getPatientAttributeName('weekly_food_budget'),
                  label: i18n.__('What is your weekly food budget?'),
                  inputLabel: i18n.__('Budget'),
                  decimalScale: 2,
                  size: 'sm',
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'input:radio-v2',
                  label: i18n.__('About how far do you live from your nearest grocery store?'),
                  key: getPatientAttributeName('distance_from_grocery'),
                  options: getAllPatientAttributeOptions(context, 'distance_from_grocery'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'multi-select',
                  label: i18n.__('"I am confident in my abilities to..."'),
                  key: getPatientAttributeName('confidence_in_food_abilities'),
                  options: getAllPatientAttributeOptions(context, 'confidence_in_food_abilities'),
                  prevAnswerPrompt: 'fillable',
                },
                {
                  type: 'multi-select',
                  label: i18n.__('"When I think about food, I feel that..."'),
                  key: getPatientAttributeName('emotional_response_to_food'),
                  options: getAllPatientAttributeOptions(context, 'emotional_response_to_food'),
                  prevAnswerPrompt: 'fillable',
                },
              ],
            },
          ],
        },
        {
          type: 'group',
          title: i18n.__('Treatment plan'),
          groupKey: 'treatment_plan',
          widgets: [
            {
              type: 'group',
              title: i18n.__('Nutrition diagnosis'),
              groupKey: 'pes_statement',
              widgets: [
                {
                  type: 'tiered-inputs',
                  key: 'pes_statement',
                  label: 'PES Statement',
                  size: 'xl',
                  prevAnswerPrompt: 'readonly',
                  inputs: [
                    {
                      type: 'tiered-combobox',
                      key: 'nutrition_diagnosis',
                      inputLabel: i18n.__('Member with...'),
                      required: true,
                      props: [
                        {
                          then: {
                            options: getAllPatientAttributeOptions(context, 'problem'),
                          },
                        },
                      ],
                    },
                    {
                      type: 'tiered-combobox',
                      key: 'related_to',
                      inputLabel: '...related to...',
                      required: true,
                      props: Object.entries(getPesStatementOptions(context)).map(([key, values]) => {
                        return {
                          condition: ['stringEquals', 'nutrition_diagnosis', key],
                          then: {
                            options: values
                              .map((value) => ({ label: value.option_text, value: value.option_code }))
                              .sort((a, b) => a.label.localeCompare(b.label)),
                          },
                        };
                      }),
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
              title: i18n.__('Intervention'),
              subtitle: i18n.__('You must enter at least one intervention below, or add custom notes.'),
              groupKey: 'intervention_group',
              widgets: [
                {
                  type: 'entry-editor',
                  key: 'interventions',
                  prevAnswerPrompt: 'readonly',
                  allowEmptyEntries: false,
                  addButtonText: i18n.__('Add intervention'),
                  inputLabel: i18n.__('Intervention'),
                  options: getAllPatientAttributeOptions(context, 'intervention').sort((a, b) =>
                    a.value.localeCompare(b.value),
                  ),
                },
                {
                  type: 'input:textarea',
                  inputLabel: i18n.__('Intervention notes'),
                  key: 'intervention_notes',
                  prevAnswerPrompt: 'readonly',
                },
              ],
            },
            {
              type: 'group',
              title: i18n.__('Monitoring & evaluation'),
              groupKey: 'monitoring_and_evaluation_group',
              widgets: [
                {
                  type: 'input:radio-v2',
                  key: 'member_expressed_understanding_of_education',
                  required: true,
                  label: i18n.__('Member expressed an understanding of the education.'),
                  options: [
                    {
                      type: 'basic',
                      label: i18n.__('Yes'),
                      value: 'yes',
                    },
                    {
                      type: 'basic',
                      label: i18n.__('No'),
                      value: 'no',
                    },
                  ],
                },
                {
                  type: 'input:radio-v2',
                  key: 'member_felt_confident_in_ability_to_meet_goals',
                  required: true,
                  label: i18n.__('Member felt confident in their ability to meet the goals discussed.'),
                  options: [
                    {
                      type: 'basic',
                      label: i18n.__('Yes'),
                      value: 'yes',
                    },
                    {
                      type: 'basic',
                      label: i18n.__('No'),
                      value: 'no',
                    },
                  ],
                },
              ],
            },
            {
              type: 'group',
              groupKey: 'general_encounter_notes_group',
              title: i18n.__('General encounter notes'),
              widgets: [
                {
                  type: 'input:textarea',
                  label: i18n.__('General encounter notes'),
                  inputLabel: i18n.__('General notes'),
                  key: 'general_encounter_notes',
                  prevAnswerPrompt: 'readonly',
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
              title: i18n.__('Billing details'),
              groupKey: 'billing_details',
              widgets: [
                {
                  type: 'input:time',
                  inputLabel: i18n.__('End time'),
                  key: 'end_time',
                  description: `Timezone: ${timezoneDisplay}`,
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
                        timezone: providerTimezone,
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
                  inputLabel: i18n.__('Units billed'),
                  required: true,
                  min: 1,
                  max: 8,
                  size: 'md',
                },
                {
                  type: 'input:combobox',
                  key: 'cpt_code',
                  required: true,
                  inputLabel: i18n.__('Billing / CPT code'),
                  options: billingCPTcodeOptions,
                  size: 'lg',
                },
                {
                  type: 'input:combobox',
                  key: 'diagnosis_code',
                  inputLabel: i18n.__('Diagnosis code'),
                  disableAutoComplete: true,
                  // disabled: true,
                  required: true,
                  options: [{ label: 'Z71.3', value: 'Z71.3' }],
                  size: 'md',
                },
                {
                  type: 'input:textarea',
                  key: 'note_to_member',
                  label: i18n.__('Note to member'),
                  prevAnswerPrompt: 'readonly',
                  inputLabel: i18n.__('Member instructions'),
                  size: 'xl',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
  };
}
