import { IContext } from '@mono/common/lib/context';
import {
  GetScreeningQuestionnaireConfigParams,
  ScreeningDeterminationCode,
  ScreeningQuestionnaireConfig,
} from '../service';
import { err, ok } from 'neverthrow';
import { ErrCode, ErrCodeError } from '@mono/common/lib/error';
import { z } from 'zod';
import { Logger } from '@mono/common';
import { zc } from '@mono/common/lib/zod-custom';
import Decimal from 'decimal.js';
import _ = require('lodash');
import { getSharedWidgets } from './shared-widgets';
import { AccountIds } from '@mono/common/lib/account/service';
import { BenefitTypesArray, VendorCodeSchema, VendorData } from '@mono/common/lib/referral/determinations';
import * as FoodVendorStore from '@mono/common/lib/food-vendor/store';

const MTAG = Logger.tag();

const MedicalConditionPredefinedValueSchema = z.enum([
  'pre_diabetes',
  'type_1_diabetes',
  'type_2_diabetes',
  'hypertension',
  'ibs',
  'mental_health',
  'congestive_heart_failure',
  'cancer',
  'crohns_disease',
  'rheumatoid_arthritis',
  'stroke',
  'phenylketonuria',
  'dementia_alzheimers',
  'copd',
  'heart_disease',
  'heart_related_issues',
  'high_cholesterol',
  'thyroid_issues',
  'chronic_kidney_disease',
  'end_state_renal_disease',
  'celiac_disease',
  'other_autoimmune_disease',
  'eating_disorders',
  'physical_problem_adl_problems',
  'pregnant',
  'no_medical_conditions',
]);
type MedicalConditionPredefinedValue = z.infer<typeof MedicalConditionPredefinedValueSchema>;

const MedicationPredefinedValueSchema = z.enum([
  'glp1_weight_loss_medication',
  'blood_pressure_medication',
  'diabetes_medication',
  'mental_health_medication',
  'thyroid_medication',
  'cholesterol_medication',
  'diuretic_medication',
  'no_medications',
]);
type MedicationPredefinedValue = z.infer<typeof MedicationPredefinedValueSchema>;

const GroceryPaymentMethodPredefinedValueSchema = z.enum([
  'cash',
  'check',
  'credit_card',
  'debit_card',
  'ebt_card',
  'ebt_card_do_not_use',
  'do_not_buy_groceries',
]);
type GroceryPaymentMethodPredefinedValue = z.infer<typeof GroceryPaymentMethodPredefinedValueSchema>;

const v1Schema = z
  .object({
    medical_conditions: z.array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('predefined'),
          value: MedicalConditionPredefinedValueSchema,
        }),
        z.object({
          type: z.literal('custom'),
          value: z.string().trim(),
        }),
      ]),
    ),
    medications: z.array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('predefined'),
          value: MedicationPredefinedValueSchema,
        }),
        z.object({
          type: z.literal('custom'),
          value: z.string().trim(),
        }),
      ]),
    ),
    recent_inpatient_yn: z.object({
      type: z.literal('basic'),
      value: z.enum(['yes', 'no']),
    }),
    recent_inpatient_date_of_discharge: zc.dateString().optional(),
    recent_inpatient_facility_type: z
      .discriminatedUnion('type', [
        z.object({
          type: z.literal('basic'),
          value: z.enum(['hospital', 'skilled_nursing_facility', 'longterm_acute_care']),
        }),
        z.object({
          type: z.literal('text-input'),
          value: z.enum(['other']),
          freeText: z.string().trim().optional(),
        }),
      ])
      .optional(),
    recent_inpatient_admission_reason: z
      .array(
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('predefined'),
            value: z.enum([
              'septicemia',
              'pneumonia',
              'heart_failure_cardiovascular_disease',
              'osteoarthritis',
              'diabetes',
              'acute_and_unspecified_renal_failure',
              'copd',
            ]),
          }),
          z.object({
            type: z.literal('custom'),
            value: z.string().trim(),
          }),
        ]),
      )
      .optional(),
    blood_pressure: z
      .array(
        z.object({
          systolic: zc.decimal({ min: 0, max: 1000 }),
          diastolic: zc.decimal({ min: 0, max: 1000 }),
          date: zc.dateString(),
        }),
      )
      .default([])
      .transform((arr) => _.orderBy(arr, 'date', 'desc')),
    height_feet: zc.decimal({ min: 1, max: 10, maxScale: 0 }).optional(),
    height_inches: zc.decimal({ min: 0, max: 11.9, maxScale: 1 }).optional(),
    weight: z
      .array(
        z.object({
          pounds: zc.decimal({ min: 0, max: 1000, maxScale: 1 }),
          date: zc.dateString(),
        }),
      )
      .default([])
      .transform((arr) => _.orderBy(arr, 'date', 'desc')),
    a1c: z
      .array(
        z.object({
          percentage: zc.decimal({ min: 0, max: 1000, maxScale: 1 }),
          date: zc.dateString(),
        }),
      )
      .default([])
      .transform((arr) => _.orderBy(arr, 'date', 'desc')),
    lipids: z
      .array(
        z.object({
          hdl: zc.decimal({ min: 0, max: 1000 }).optional(),
          ldl: zc.decimal({ min: 0, max: 1000 }).optional(),
          triglycerides: zc.decimal({ min: 0, max: 5000 }).optional(),
          cholesterol: zc.decimal({ min: 0, max: 1000 }).optional(),
          date: zc.dateString(),
        }),
      )
      .default([])
      .transform((arr) => _.orderBy(arr, 'date', 'desc')),
    health_limitations: z.object({
      type: z.literal('basic'),
      value: z.enum(['not_limited_at_all', 'somewhat_limited', 'severely_limited']),
    }),
    friends_and_family_support: z.object({
      type: z.literal('basic'),
      value: z.enum(['always', 'sometimes', 'never']),
    }),
    grocery_payment_methods: z.array(
      z.object({
        type: z.literal('predefined'),
        value: GroceryPaymentMethodPredefinedValueSchema,
      }),
    ),
    worried_money_would_run_out: z.object({
      type: z.literal('basic'),
      value: z.enum(['often', 'sometimes', 'never', 'prefer_not_to_say']),
    }),
    wasted_food_with_no_money: z.object({
      type: z.literal('basic'),
      value: z.enum(['often', 'sometimes', 'never', 'prefer_not_to_say']),
    }),
    food_quality_in_household: z.object({
      type: z.literal('basic'),
      value: z.enum([
        'enough_of_kinds_we_want',
        'enough_but_not_always_what_we_want',
        'sometimes_not_enough',
        'often_not_enough',
        'prefer_not_to_say',
      ]),
    }),
    how_hard_to_get_healthy_foods: z.object({
      type: z.literal('basic'),
      value: z.enum(['very_hard', 'hard', 'somewhat_hard', 'not_very_hard', 'not_hard_at_all', 'prefer_not_to_say']),
    }),
  })
  .strict();

const FoodAllergiesPredefinedValueSchema = z.enum([
  'none',
  'dairy',
  'egg',
  'fish',
  'shellfish',
  'tree_nut',
  'peanut',
  'wheat',
  'soy',
  'sesame',
]);

const FoodSensitivitiesPredefinedValueSchema = z.enum([
  'none',
  'lactose',
  'nonceliac_gluten',
  'histamine',
  'fodmap',
  'nightshades',
]);

const DietTypePredefinedValueSchema = z.enum([
  'none',
  'vegetarian',
  'vegan',
  'pescatarian',
  'kosher',
  'halal',
  'religious',
  'whole_30_paleo',
  'keto',
  'pregnancy',
  'autoimmune_protocol',
]);

const CuisinePreferencesValueSchema = z.enum([
  'african',
  'american',
  'asian_east_asian',
  'indian',
  'middle_eastern',
  'mediterranean',
  'latin_american_hispanic',
  'native_american',
  'southern',
  'none',
]);

const v2Schema = v1Schema
  .extend({
    schema_type: z.literal('cal_optima_risk_assessment_V2').default('cal_optima_risk_assessment_V2'),
    food_allergies: z.array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('predefined'),
          value: FoodAllergiesPredefinedValueSchema,
        }),
        z.object({
          type: z.literal('custom'),
          value: z.string().trim(),
        }),
      ]),
    ),
    food_sensitivities: z.array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('predefined'),
          value: FoodSensitivitiesPredefinedValueSchema,
        }),
        z.object({
          type: z.literal('custom'),
          value: z.string().trim(),
        }),
      ]),
    ),
    diet_types: z.array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('predefined'),
          value: DietTypePredefinedValueSchema,
        }),
        z.object({
          type: z.literal('custom'),
          value: z.string().trim(),
        }),
      ]),
    ),
    recommendations_for_food_vendor_for_member: z.string().trim().optional(),
    cuisine_preferences: z.array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('predefined'),
          value: CuisinePreferencesValueSchema,
        }),
        z.object({
          type: z.literal('custom'),
          value: z.string().trim(),
        }),
      ]),
    ),
  })
  .strict();

const v3Schema = v2Schema
  .extend({
    schema_type: z.literal('cal_optima_risk_assessment_V3').default('cal_optima_risk_assessment_V3'),
    pregnant_member_expected_due_date: zc.dateString().optional(),
    pregnant_member_high_risk: z
      .object({
        type: z.literal('basic'),
        value: z.enum(['yes', 'no']),
      })
      .optional(),
    prefers_grocery_delivery: z
      .object({
        type: z.literal('basic'),
        value: z.enum(['yes', 'no']),
      })
      .optional(), // Deprecated
  })
  .strict();

const v4Schema = v3Schema
  .extend({
    schema_type: z.literal('cal_optima_risk_assessment_V4').default('cal_optima_risk_assessment_V4'),
    vendor_preference: z.union([VendorCodeSchema, z.literal('no_preference')]),
  })
  .strict();

const v5Schema = v4Schema
  .extend({
    schema_type: z.literal('risk_assessment_V5').default('risk_assessment_V5'),
    meal_type_preference: z.enum(BenefitTypesArray),
  })
  .strict();

const schema = v5Schema.transform((val, ctx) => {
  if (val.recent_inpatient_yn.value === 'no') {
    delete val.recent_inpatient_date_of_discharge;
    delete val.recent_inpatient_facility_type;
    delete val.recent_inpatient_admission_reason;
  }

  const pregnantMember = val.medical_conditions.some((mc) => mc.type === 'predefined' && mc.value === 'pregnant');
  if (pregnantMember) {
    if (!val.pregnant_member_expected_due_date || !val.pregnant_member_high_risk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pregnant member questions are required.',
      });
      return z.NEVER;
    }
  } else {
    delete val.pregnant_member_expected_due_date;
    delete val.pregnant_member_high_risk;
  }
  return val;
});

export function calculateBmi(weightPounds: Decimal, heightInches: Decimal): Decimal {
  return weightPounds.dividedBy(heightInches.toPower(2)).times(703).toDecimalPlaces(1);
}

const mapVendorToDisplayComboboxOption = (vendor: VendorData) => ({
  label: vendor.vendorDisplayLabel,
  value: vendor.vendorName,
});

export const riskAssessmentConfig = async (
  context: IContext,
  params: GetScreeningQuestionnaireConfigParams,
): Promise<ScreeningQuestionnaireConfig> => {
  const { i18n, logger } = context;
  const sharedWidgets = getSharedWidgets(context);

  const vendorDataResult = await FoodVendorStore.getFoodVendors(context, params.accountId);
  if (vendorDataResult.isErr()) {
    logger.error(context, MTAG, 'Error retrieving food vendors', { error: vendorDataResult.error });
    throw new ErrCodeError(ErrCode.SERVICE);
  }

  const foodOfferingsResult = await FoodVendorStore.getFoodOfferingTypes(context);
  if (foodOfferingsResult.isErr()) {
    logger.error(context, MTAG, 'Error retrieving food offerings', { error: foodOfferingsResult.error });
    throw new ErrCodeError(ErrCode.SERVICE);
  }

  const foodOfferings = foodOfferingsResult.value;

  const vendorData = vendorDataResult.value;
  const availableVendors = vendorData
    .map((v) => ({
      ...v,
      foodOfferings: foodOfferings.filter((o) => v.offerings.includes(o.offeringType)),
    }));

  const availableFoodOfferings = _.uniqBy(
    availableVendors.flatMap((vendor) => vendor.foodOfferings),
    (o) => o.offeringType,
  );

  return {
    questionnaireType: 'risk_assessment',
    title: i18n.__('Risk Assessment'),
    caption: i18n.__('Please complete the risk assessment'),
    widgets: [
      {
        title: i18n.__('Medical'),
        type: 'group',
        groupKey: 'medical_group',
        widgets: [
          sharedWidgets.medical_conditions,
          {
            type: 'conditional',
            name: 'pregnant_member_conditional',
            conditions: [['notNull', `medical_conditions[?value=='pregnant'] | [0]`]],
            widgets: [
              {
                type: 'input:date',
                label: i18n.__('When is the members expected due date?'),
                key: 'pregnant_member_expected_due_date',
                required: true,
                inputLabel: i18n.__('Expected due date'),
              },
              {
                type: 'input:radio',
                label: i18n.__(
                  `Has member been told by a provider that he/she/they are at high risk, are not currently receiving any prenatal care, or member is a high risk pregnant member due to: history of SGA, gestational diabetes, pregnancy-induced hypertension, history of pre-term birth, or pregnancy/birth complication?`,
                ),
                key: 'pregnant_member_high_risk',
                required: true,
                options: [
                  {
                    type: 'basic',
                    label: i18n.__('No'),
                    value: 'no',
                  },
                  {
                    type: 'basic',
                    label: i18n.__('Yes'),
                    value: 'yes',
                  },
                ],
              },
            ],
          },
          sharedWidgets.medications,
          {
            type: 'input:radio',
            label: i18n.__(
              'Medical History: have you been in a medical facility for inpatient treatment in the last 90 days?',
            ),
            key: 'recent_inpatient_yn',
            required: true,
            options: [
              { type: 'basic', label: i18n.__('Yes'), value: 'yes' },
              { type: 'basic', label: i18n.__('No'), value: 'no' },
            ],
          },
          {
            type: 'conditional',
            name: 'recent_inpatient_details_conditional',
            conditions: [['stringEquals', 'recent_inpatient_yn', 'yes']],
            widgets: [
              {
                type: 'input:date',
                label: i18n.__('What was your date of discharge?'),
                key: 'recent_inpatient_date_of_discharge',
                inputLabel: i18n.__('Date of discharge'),
                max: new Date().toISOString(),
              },
              {
                type: 'input:radio',
                label: i18n.__('What type of facility were you in?'),
                key: 'recent_inpatient_facility_type',
                options: [
                  {
                    type: 'basic',
                    label: i18n.__('Hospital'),
                    value: 'hospital',
                  },
                  {
                    type: 'basic',
                    label: i18n.__('Skilled nursing facility'),
                    value: 'skilled_nursing_facility',
                  },
                  {
                    type: 'basic',
                    label: i18n.__('Long-term acute care'),
                    value: 'longterm_acute_care',
                  },
                  {
                    type: 'text-input',
                    label: i18n.__('Other facility'),
                    value: 'other',
                  },
                ],
              },
              {
                type: 'tag-input',
                label: i18n.__('What was the reason for admission?'),
                key: 'recent_inpatient_admission_reason',
                inputLabel: i18n.__('Reasons'),
                creatable: true,
                options: [
                  {
                    type: 'predefined',
                    label: i18n.__('Septicemia'),
                    value: 'septicemia',
                  },
                  {
                    type: 'predefined',
                    label: i18n.__('Pneumonia'),
                    value: 'pneumonia',
                  },
                  {
                    type: 'predefined',
                    label: i18n.__(
                      'Heart failure/cardiovascular disease (acute myocardial infarction, cardiac dysrhythmias, cerebral infarction, etc.)',
                    ),
                    value: 'heart_failure_cardiovascular_disease',
                  },
                  {
                    type: 'predefined',
                    label: i18n.__('Osteoarthritis'),
                    value: 'osteoarthritis',
                  },
                  {
                    type: 'predefined',
                    label: i18n.__('Diabetes'),
                    value: 'diabetes',
                  },
                  {
                    type: 'predefined',
                    label: i18n.__('Acute and unspecified Renal Failure'),
                    value: 'acute_and_unspecified_renal_failure',
                  },
                  { type: 'predefined', label: 'COPD', value: 'copd' },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'group',
        title: i18n.__('Biometrics'),
        groupKey: 'biometrics_group',
        widgets: [
          sharedWidgets.height_inputs,
          sharedWidgets.weight_table,
          sharedWidgets.blood_pressure_table,
          sharedWidgets.lipids_table,
          sharedWidgets.a1c_table,
        ],
      },
      {
        type: 'group',
        groupKey: 'lifestyle_and_wellbeing_group',
        title: i18n.__('Lifestyle & Wellbeing'),
        widgets: [
          {
            type: 'input:radio',
            label: i18n.__(
              'For the past 6 months, to what extent have you been limited because of a health problem in activities people usually do?',
            ),
            key: 'health_limitations',
            required: true,
            options: [
              { type: 'basic', label: i18n.__('Not limited at all'), value: 'not_limited_at_all' },
              { type: 'basic', label: i18n.__('Somewhat limited'), value: 'somewhat_limited' },
              { type: 'basic', label: i18n.__('Severely limited'), value: 'severely_limited' },
            ],
          },
          {
            type: 'input:radio',
            label: i18n.__(
              'If you were in trouble, do you have relatives or friends you can count on to help you whenever you need them?',
            ),
            key: 'friends_and_family_support',
            required: true,
            options: [
              { type: 'basic', label: i18n.__('Always'), value: 'always' },
              { type: 'basic', label: i18n.__('Sometimes'), value: 'sometimes' },
              { type: 'basic', label: i18n.__('Never'), value: 'never' },
            ],
          },
        ],
      },
      {
        type: 'group',
        groupKey: 'food_and_nutrition_security_group',
        title: i18n.__('Food & Nutrition Security'),
        widgets: [
          {
            type: 'tag-input',
            label: i18n.__('How do you typically pay for your groceries?'),
            inputLabel: i18n.__('Payment methods'),
            key: 'grocery_payment_methods',
            required: true,
            creatable: false,
            options: [
              { type: 'predefined', label: i18n.__('Cash'), value: 'cash' },
              { type: 'predefined', label: i18n.__('Check'), value: 'check' },
              {
                type: 'predefined',
                label: i18n.__('Credit card'),
                value: 'credit_card',
              },
              {
                type: 'predefined',
                label: i18n.__('Debit card'),
                value: 'debit_card',
              },
              { type: 'predefined', label: i18n.__('EBT Card'), value: 'ebt_card' },
              {
                type: 'predefined',
                label: i18n.__("I have an EBT card, but don't use it"),
                value: 'ebt_card_do_not_use',
              },
              {
                type: 'predefined',
                label: i18n.__("I don't buy groceries for my household"),
                value: 'do_not_buy_groceries',
              },
            ],
          },
          {
            type: 'input:radio',
            label: i18n.__(
              'In the last 12 months, how often were you worried that money would run out before getting more food?',
            ),
            key: 'worried_money_would_run_out',
            required: true,
            options: [
              { type: 'basic', label: i18n.__('Often'), value: 'often' },
              { type: 'basic', label: i18n.__('Sometimes'), value: 'sometimes' },
              { type: 'basic', label: i18n.__('Never'), value: 'never' },
              {
                type: 'basic',
                label: i18n.__("I'd prefer not to say"),
                value: 'prefer_not_to_say',
              },
            ],
          },
          {
            type: 'input:radio',
            label: i18n.__(
              "In the last 12 months, how often did the food you buy not last, and you didn't have money to get more?",
            ),
            key: 'wasted_food_with_no_money',
            required: true,
            options: [
              { type: 'basic', label: i18n.__('Often'), value: 'often' },
              { type: 'basic', label: i18n.__('Sometimes'), value: 'sometimes' },
              { type: 'basic', label: i18n.__('Never'), value: 'never' },
              {
                type: 'basic',
                label: i18n.__("I'd prefer not to say"),
                value: 'prefer_not_to_say',
              },
            ],
          },
          {
            type: 'input:radio',
            label: i18n.__(
              'Select which of these statements best describes the food eaten in your household in the last 12 months.',
            ),
            key: 'food_quality_in_household',
            required: true,
            options: [
              {
                type: 'basic',
                label: i18n.__('Enough of the kinds of food we want to eat'),
                value: 'enough_of_kinds_we_want',
              },
              {
                type: 'basic',
                label: i18n.__('Enough but not always the kinds of food we want'),
                value: 'enough_but_not_always_what_we_want',
              },
              {
                type: 'basic',
                label: i18n.__('Sometimes not enough to eat'),
                value: 'sometimes_not_enough',
              },
              {
                type: 'basic',
                label: i18n.__('Often not enough to eat'),
                value: 'often_not_enough',
              },
              {
                type: 'basic',
                label: i18n.__("I'd prefer not to say"),
                value: 'prefer_not_to_say',
              },
            ],
          },
          {
            type: 'input:radio',
            label: i18n.__(
              'Thinking about the last 12 months, how hard was it for you or your household to regularly get and eat healthy foods?',
            ),
            key: 'how_hard_to_get_healthy_foods',
            required: true,
            options: [
              { type: 'basic', label: i18n.__('Very hard'), value: 'very_hard' },
              { type: 'basic', label: i18n.__('Hard'), value: 'hard' },
              { type: 'basic', label: i18n.__('Somewhat hard'), value: 'somewhat_hard' },
              { type: 'basic', label: i18n.__('Not very hard'), value: 'not_very_hard' },
              { type: 'basic', label: i18n.__('Not hard at all'), value: 'not_hard_at_all' },
              {
                type: 'basic',
                label: i18n.__("I'd prefer not to say"),
                value: 'prefer_not_to_say',
              },
            ],
          },
        ],
      },
      sharedWidgets.diet_type_group,
      {
        type: 'group',
        groupKey: 'food_benefit_preference_type_group',
        title: i18n.__('Food Benefit Preference Type'),
        widgets: [
          {
            type: 'input:select',
            label: i18n.__('If you qualify for medically tailored meals, what meal type would you prefer?'),
            key: 'meal_type_preference',
            inputLabel: i18n.__('Meal type preference'),
            size: 'lg',
            required: true,
            options: availableFoodOfferings.map((offering) => ({
              label: offering.displayLabel,
              value: offering.offeringType,
            })),
          },
          {
            type: 'input:combobox',
            label: i18n.__('Do you have a preference for a vendor?'),
            key: 'vendor_preference',
            inputLabel: i18n.__('Vendor preference'),
            size: 'lg',
            required: true,
            options: [
              {
                type: 'conditional',
                conditions: [['stringEquals', 'meal_type_preference', 'prepared_meals']],
                then: {
                  options: [
                    { label: 'No preference', value: 'no_preference' },
                    ...availableVendors
                      .filter((v) => v.offerings.includes('prepared_meals'))
                      .map(mapVendorToDisplayComboboxOption),
                  ],
                },
              },
              {
                type: 'conditional',
                conditions: [['stringEquals', 'meal_type_preference', 'frozen_meals']],
                then: {
                  options: [
                    { label: 'No preference', value: 'no_preference' },
                    ...availableVendors
                      .filter((v) => v.offerings.includes('frozen_meals'))
                      .map(mapVendorToDisplayComboboxOption),
                  ],
                },
              },
              {
                type: 'conditional',
                conditions: [['stringEquals', 'meal_type_preference', 'refrigerated_meals']],
                then: {
                  options: [
                    { label: 'No preference', value: 'no_preference' },
                    ...availableVendors
                      .filter((v) => v.offerings.includes('refrigerated_meals'))
                      .map(mapVendorToDisplayComboboxOption),
                  ],
                },
              },
              {
                type: 'conditional',
                conditions: [['stringEquals', 'meal_type_preference', 'hot_meals']],
                then: {
                  options: [
                    { label: 'No preference', value: 'no_preference' },
                    ...availableVendors
                      .filter((v) => v.offerings.includes('hot_meals'))
                      .map(mapVendorToDisplayComboboxOption),
                  ],
                },
              },
              {
                type: 'conditional',
                conditions: [['stringEquals', 'meal_type_preference', 'grocery_boxes']],
                then: {
                  options: [
                    { label: 'No preference', value: 'no_preference' },
                    ...availableVendors
                      .filter((v) => v.offerings.includes('grocery_boxes'))
                      .map(mapVendorToDisplayComboboxOption),
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
    transformSubmission: (context: IContext, formData: unknown) => {
      const tag = [...MTAG, 'transformSubmission'];
      const { logger } = context;

      const parseResult = schema.safeParse(formData);
      if (!parseResult.success) {
        logger.error(context, tag, 'error parsing caloptima risk assessment form data', {
          issues: parseResult.error.issues,
        });
        return err({ code: ErrCode.INVALID_DATA, issues: parseResult.error.issues });
      }
      const fd = parseResult.data;

      // Determine risk for each factor
      const medicalConditionsAddedRiskValues: MedicalConditionPredefinedValue[] = [
        'type_1_diabetes',
        'type_2_diabetes',
        'ibs',
        'mental_health',
        'congestive_heart_failure',
        'cancer',
        'crohns_disease',
        'rheumatoid_arthritis',
        'stroke',
        'phenylketonuria',
        'dementia_alzheimers',
        'copd',
        'heart_disease',
        'heart_related_issues',
        'thyroid_issues',
        'chronic_kidney_disease',
        'end_state_renal_disease',
        'celiac_disease',
        'pregnant',
      ];
      const medicalConditionsValues = fd.medical_conditions.map((mc) => mc.value);
      const medicalConditionsAddedRisk =
        _.intersection(medicalConditionsValues, medicalConditionsAddedRiskValues).length > 0;

      const medicationsValues = fd.medications.map((m) => m.value);
      const medicationsAddedRiskValues: MedicationPredefinedValue[] = [
        'glp1_weight_loss_medication',
        'diabetes_medication',
        'mental_health_medication',
      ];
      const medicationsAddedRisk = _.intersection(medicationsValues, medicationsAddedRiskValues).length > 0;

      const recentInpatientAddedRisk = fd.recent_inpatient_yn.value === 'yes';

      const latestBloodPressure = fd.blood_pressure.at(0);
      const systolicBloodPressureAddedRisk = latestBloodPressure
        ? latestBloodPressure.systolic.greaterThanOrEqualTo(130)
        : false;
      const diastolicBloodPressureAddedRisk = latestBloodPressure
        ? latestBloodPressure.diastolic.greaterThanOrEqualTo(80)
        : false;
      const bloodPressureAddedRisk = systolicBloodPressureAddedRisk || diastolicBloodPressureAddedRisk;

      const latestWeight = fd.weight.at(0);
      const bmi =
        fd.height_feet && latestWeight
          ? calculateBmi(latestWeight.pounds, new Decimal(fd.height_feet).times(12).plus(fd.height_inches ?? 0))
          : undefined;
      const bmiAddedRisk = bmi ? bmi.greaterThanOrEqualTo(30) : false;

      const latestA1c = fd.a1c.at(0);
      const a1cAddedRisk = latestA1c ? latestA1c.percentage.greaterThanOrEqualTo(6.5) : false;

      const latestLipids = fd.lipids.at(0);
      const lipidsHdlAddedRisk = latestLipids?.hdl ? latestLipids.hdl.lessThanOrEqualTo(40) : false;
      const lipidsLdlAddedRisk = latestLipids?.ldl ? latestLipids.ldl.greaterThanOrEqualTo(130) : false;
      const lipidsTriglyceridesAddedRisk = latestLipids?.triglycerides
        ? latestLipids.triglycerides.greaterThanOrEqualTo(150)
        : false;
      const lipidsCholesterolAddedRisk = latestLipids?.cholesterol
        ? latestLipids.cholesterol.greaterThanOrEqualTo(200)
        : false;
      const lipidsAddedRisk =
        lipidsHdlAddedRisk || lipidsLdlAddedRisk || lipidsTriglyceridesAddedRisk || lipidsCholesterolAddedRisk;

      const healthLimitationsAddedRisk =
        fd.health_limitations.value === 'severely_limited' || fd.health_limitations.value === 'somewhat_limited';

      const friendsAndFamilySupportAddedRisk = fd.friends_and_family_support.value === 'never';

      const groceryPaymentMethodsValues = fd.grocery_payment_methods.map((gpm) => gpm.value);
      const groceryPaymentMethodsAddedRiskValues: GroceryPaymentMethodPredefinedValue[] = [
        'ebt_card',
        'ebt_card_do_not_use',
      ];
      const groceryPaymentMethodsAddedRisk =
        _.intersection(groceryPaymentMethodsValues, groceryPaymentMethodsAddedRiskValues).length > 0;

      const worriedMoneyWouldRunOutAddedRisk =
        fd.worried_money_would_run_out.value === 'often' || fd.worried_money_would_run_out.value === 'sometimes';

      const wastedFoodWithNoMoneyAddedRisk =
        fd.wasted_food_with_no_money.value === 'often' || fd.wasted_food_with_no_money.value === 'sometimes';

      const foodQualityInHouseholdAddedRisk =
        fd.food_quality_in_household.value === 'sometimes_not_enough' ||
        fd.food_quality_in_household.value === 'often_not_enough';

      const howHardToGetHealthyFoodsAddedRisk =
        fd.how_hard_to_get_healthy_foods.value === 'hard' || fd.how_hard_to_get_healthy_foods.value === 'very_hard';

      // Determine risk for each category
      const medicalAddedRisk =
        medicalConditionsAddedRisk ||
        medicationsAddedRisk ||
        bloodPressureAddedRisk ||
        bmiAddedRisk ||
        a1cAddedRisk ||
        lipidsAddedRisk;

      const lifestyleAndWellbeingAddedRisk = healthLimitationsAddedRisk || friendsAndFamilySupportAddedRisk;

      const foodNutritionInsecurityAddedRisk =
        groceryPaymentMethodsAddedRisk ||
        worriedMoneyWouldRunOutAddedRisk ||
        wastedFoodWithNoMoneyAddedRisk ||
        foodQualityInHouseholdAddedRisk ||
        howHardToGetHealthyFoodsAddedRisk;

      // Determine overall risk
      const categoryAddedRiskCount = [
        medicalAddedRisk,
        lifestyleAndWellbeingAddedRisk,
        foodNutritionInsecurityAddedRisk,
      ].filter((c) => c === true).length;

      let overallRisk: ScreeningDeterminationCode | null = null;
      if (recentInpatientAddedRisk || categoryAddedRiskCount >= 3) {
        overallRisk = 'high_risk';
      } else if (categoryAddedRiskCount === 2) {
        overallRisk = 'medium_risk';
      } else if (categoryAddedRiskCount <= 1) {
        overallRisk = 'low_risk';
      } else {
        logger.error(context, tag, 'unable to determine overall risk');
        return err({ code: ErrCode.INVALID_CONFIG });
      }

      return ok({
        formData: fd,
        determinationCode: overallRisk,
        determinationMeta: {
          overallRisk,
          calculatedValues: {
            bmi,
          },
          categoryRisks: {
            medicalAddedRisk,
            lifestyleAndWellbeingAddedRisk,
            foodNutritionInsecurityAddedRisk,
          },
          factorRisks: {
            medicalConditionsAddedRisk,
            medicationsAddedRisk,
            recentInpatientAddedRisk,
            systolicBloodPressureAddedRisk,
            diastolicBloodPressureAddedRisk,
            bloodPressureAddedRisk,
            bmiAddedRisk,
            a1cAddedRisk,
            lipidsHdlAddedRisk,
            lipidsLdlAddedRisk,
            lipidsTriglyceridesAddedRisk,
            lipidsCholesterolAddedRisk,
            lipidsAddedRisk,
            healthLimitationsAddedRisk,
            friendsAndFamilySupportAddedRisk,
            groceryPaymentMethodsAddedRisk,
            worriedMoneyWouldRunOutAddedRisk,
            wastedFoodWithNoMoneyAddedRisk,
            foodQualityInHouseholdAddedRisk,
            howHardToGetHealthyFoodsAddedRisk,
          },
        },
      });
    },
    buildDetermination: (context: IContext, determinationCode: ScreeningDeterminationCode) => {
      switch (params.accountId) {
        case AccountIds.CalOptima:
          switch (determinationCode) {
            case 'low_risk':
              return ok({
                title: i18n.__('Low Risk: Population Health Management'),
                sections: [
                  {
                    title: i18n.__('Visits'),
                    text: i18n.__('Member receives up to 1 initial & 2 follow-up visits.'),
                  },
                  {
                    title: i18n.__('Meal Benefits'),
                    text: i18n.__('Member is not eligible for subsidized food.'),
                  },
                ],
              });
            case 'medium_risk':
              return ok({
                title: i18n.__('Moderate Risk: Community Supports'),
                sections: [
                  {
                    title: i18n.__('Visits'),
                    text: i18n.__('Member receives up to 1 initial & 3 follow-up visits.'),
                  },
                  {
                    title: i18n.__('Meal Benefits'),
                    text: i18n.__('Member is eligible for 4 weeks of meals or food boxes.'),
                  },
                ],
              });
            case 'high_risk':
              return ok({
                title: i18n.__('High Risk: Enhanced Care Management'),
                sections: [
                  {
                    title: i18n.__('Visits'),
                    text: i18n.__('Member receives up to 1 initial & 6 follow-up visits.'),
                  },
                  {
                    title: i18n.__('Meal Benefits'),
                    text: i18n.__(
                      'Member is eligible for 12 weeks of meals or food boxes (ability to reauthorize for additional 12 weeks).',
                    ),
                  },
                ],
              });
            default:
              return err(ErrCode.INVALID_CONFIG);
          }
        case AccountIds.SantaClara:
          switch (determinationCode) {
            case 'low_risk':
              return ok({
                title: i18n.__('Low Risk: Population Health Management'),
                sections: [
                  {
                    title: i18n.__('Visits'),
                    text: i18n.__('Member receives up to 1 initial & 3 follow-up visits.'),
                  },
                  {
                    title: i18n.__('Meal Benefits'),
                    text: i18n.__('Member is not eligible for subsidized food.'),
                  },
                ],
              });
            case 'medium_risk':
              return ok({
                title: i18n.__('Moderate Risk: Community Supports'),
                sections: [
                  {
                    title: i18n.__('Visits'),
                    text: i18n.__('Member receives up to 1 initial & 3 follow-up visits.'),
                  },
                  {
                    title: i18n.__('Meal Benefits'),
                    text: i18n.__(
                      'Member is eligible for 12 weeks of meals or food boxes (ability to reauthorize for additional 12 weeks).',
                    ),
                  },
                ],
              });
            case 'high_risk':
              return ok({
                title: i18n.__('High Risk: Enhanced Care Management'),
                sections: [
                  {
                    title: i18n.__('Visits'),
                    text: i18n.__('Member receives up to 1 initial & 3 follow-up visits.'),
                  },
                  {
                    title: i18n.__('Meal Benefits'),
                    text: i18n.__(
                      'Member is eligible for 12 weeks of meals or food boxes (ability to reauthorize for additional 12 weeks).',
                    ),
                  },
                ],
              });
            default:
              return err(ErrCode.INVALID_CONFIG);
          }
        default:
          return err(ErrCode.INVALID_CONFIG);
      }
    },
  };
};

export default { riskAssessmentConfig };
