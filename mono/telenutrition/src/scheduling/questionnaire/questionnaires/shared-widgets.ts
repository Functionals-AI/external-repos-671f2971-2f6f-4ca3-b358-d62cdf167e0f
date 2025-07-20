import { Widget } from '../types';
import { IContext } from '@mono/common/src/context';
import { DateTime } from 'luxon';

type Key =
  | 'medical_conditions'
  | 'medications'
  | 'height_inputs'
  | 'weight_table'
  | 'blood_pressure_table'
  | 'lipids_table'
  | 'a1c_table'
  | 'diet_type_group';

export const getSharedWidgets = ({ i18n }: IContext): Record<Key, Widget> => {
  const TODAY_ISO = DateTime.now().toISO();

  return {
    diet_type_group: {
      type: 'group',
      title: 'Diet type',
      groupKey: 'diet_type_group',
      widgets: [
        {
          type: 'tag-input',
          required: true,
          label: i18n.__('What best describes the way you eat?'),
          inputLabel: i18n.__('Diet type'),
          key: 'diet_types',
          creatable: true,
          placeholder: i18n.__('No specialized diet'),
          options: [
            { type: 'predefined', label: i18n.__('No Specialized Diet'), value: 'none' },
            { type: 'predefined', label: i18n.__('Vegetarian'), value: 'vegetarian' },
            { type: 'predefined', label: i18n.__('Vegan'), value: 'vegan' },
            { type: 'predefined', label: i18n.__('Pescatarian'), value: 'pescatarian' },
            { type: 'predefined', label: i18n.__('Kosher'), value: 'kosher' },
            { type: 'predefined', label: i18n.__('Halal'), value: 'halal' },
            { type: 'predefined', label: i18n.__('Whole 30 / Paleo'), value: 'whole_30_paleo' },
            { type: 'predefined', label: i18n.__('Keto'), value: 'keto' },
            { type: 'predefined', label: i18n.__('Pregnancy'), value: 'pregnancy' },
            { type: 'predefined', label: i18n.__('AIP (autoimmune protocol)'), value: 'autoimmune_protocol' },
          ],
        },
        {
          type: 'tag-input',
          required: true,
          label: i18n.__('Do you have any food sensitivities or intolerances?'),
          inputLabel: i18n.__('Sensitivities'),
          key: 'food_sensitivities',
          creatable: true,
          placeholder: i18n.__('Sensitivities'),
          options: [
            {
              label: i18n.__('No food sensitivities or intolerances'),
              value: 'none',
              type: 'predefined',
            },
            { label: i18n.__('Lactose'), value: 'lactose', type: 'predefined' },
            {
              label: i18n.__('Non-celiac gluten sensitivity'),
              value: 'nonceliac_gluten',
              type: 'predefined',
            },
            { label: i18n.__('Histamine'), value: 'histamine', type: 'predefined' },
            { label: i18n.__('FODMAP'), value: 'fodmap', type: 'predefined' },
            { label: i18n.__('Nightshades'), value: 'nightshades', type: 'predefined' },
          ],
        },
        {
          type: 'tag-input',
          required: true,
          label: i18n.__('Do you have any food allergies?'),
          inputLabel: i18n.__('Allergies'),
          key: 'food_allergies',
          creatable: true,
          options: [
            { type: 'predefined', label: i18n.__('No food allergies'), value: 'none' },
            { type: 'predefined', label: i18n.__('Milk / dairy'), value: 'dairy' },
            { type: 'predefined', label: i18n.__('Egg'), value: 'egg' },
            { type: 'predefined', label: i18n.__('Fish (e.g., bass, flounder, cod)'), value: 'fish' },
            { type: 'predefined', label: i18n.__('Shellfish (e.g., crab, lobster, shrimp)'), value: 'shellfish' },
            { type: 'predefined', label: i18n.__('Tree nut (e.g., almonds, walnuts, pecans)'), value: 'tree_nut' },
            { type: 'predefined', label: i18n.__('Peanut'), value: 'peanut' },
            { type: 'predefined', label: i18n.__('Wheat'), value: 'wheat' },
            { type: 'predefined', label: i18n.__('Soy'), value: 'soy' },
            { type: 'predefined', label: i18n.__('Sesame'), value: 'sesame' },
          ],
        },
        {
          type: 'input:textarea',
          label: i18n.__(
            'Do you have any recommendations/notes for the Food vendor to take into account for the member?',
          ),
          inputLabel: i18n.__('Recommendations'),
          key: 'recommendations_for_food_vendor_for_member',
        },
        {
          type: 'tag-input',
          required: true,
          key: 'cuisine_preferences',
          label: i18n.__('What are your Cuisine Preferences?'),
          inputLabel: i18n.__('Preferences'),
          creatable: true,
          options: [
            { type: 'predefined', label: i18n.__('African'), value: 'african' },
            { type: 'predefined', label: i18n.__('American'), value: 'american' },
            { type: 'predefined', label: i18n.__('Asian/East Asian'), value: 'asian_east_asian' },
            { type: 'predefined', label: i18n.__('Indian'), value: 'indian' },
            { type: 'predefined', label: i18n.__('Middle Eastern'), value: 'middle_eastern' },
            { type: 'predefined', label: i18n.__('Mediterranean'), value: 'mediterranean' },
            { type: 'predefined', label: i18n.__('Latin American/Hispanic'), value: 'latin_american_hispanic' },
            { type: 'predefined', label: i18n.__('Native American'), value: 'native_american' },
            { type: 'predefined', label: i18n.__('Southern'), value: 'southern' },
            { type: 'predefined', label: i18n.__('No Preference'), value: 'none' },
          ],
        },
        // {
        //   type: 'tag-input',
        //   label: 'What supplements & vitamins do you take?',
        //   inputLabel: 'Supplements',
        //   key: 'supplements_and_vitamins',
        //   options: [
        //     { type: 'predefined', label: 'No vitamins', value: 'no_vitamins' },
        //     { type: 'predefined', label: 'Vitamin D', value: 'vitamin_d' },
        //     { type: 'predefined', label: 'Omega-3 fatty acids', value: 'omega_3_fatty_acids' },
        //     { type: 'predefined', label: 'Vitamin C', value: 'vitamin_c' },
        //     { type: 'predefined', label: 'Botanicals', value: 'botanicals' },
        //     { type: 'predefined', label: 'Calcium', value: 'calcium' },
        //     { type: 'predefined', label: 'Vitamin B-12', value: 'vitamin_b_12' },
        //     { type: 'predefined', label: 'Multivitamin', value: 'multivitamin' },
        //   ],
        // },
        // {
        //   type: 'input:number',
        //   key: 'meals_per_day',
        //   min: 0,
        //   max: 10,
        //   label: 'How many meals do you eat per day?',
        //   inputLabel: 'Meals',
        //   decimalScale: 0,
        // },
        // {
        //   type: 'input:time',
        //   key: 'first_meal_time',
        //   label: 'On average, what time is your first meal?',
        //   inputLabel: 'First meal',
        // },
        // {
        //   type: 'input:time',
        //   key: 'last_meal_time',
        //   label: 'On average, what time is your last meal?',
        //   inputLabel: 'Last meal',
        // },
      ],
    },
    medical_conditions: {
      type: 'tag-input',
      label: i18n.__('Do you currently have any of these medical conditions?'),
      required: true,
      key: 'medical_conditions',
      creatable: true,
      inputLabel: i18n.__('Medical conditions'),
      options: [
        {
          type: 'predefined',
          label: i18n.__('Pre-diabetes'),
          value: 'pre_diabetes',
        },
        {
          type: 'predefined',
          label: i18n.__('Type 1 Diabetes'),
          value: 'type_1_diabetes',
        },
        {
          type: 'predefined',
          label: i18n.__('Type 2 diabetes'),
          value: 'type_2_diabetes',
        },
        { type: 'predefined', label: i18n.__('Hypertension'), value: 'hypertension' },
        { type: 'predefined', label: i18n.__('Irritable Bowel Syndrome (IBS)'), value: 'ibs' },
        { type: 'predefined', label: i18n.__('Mental Health (depression, anxiety, other)'), value: 'mental_health' },
        { type: 'predefined', label: i18n.__('Congestive Heart Failure'), value: 'congestive_heart_failure' },
        { type: 'predefined', label: i18n.__('Cancer'), value: 'cancer' },
        { type: 'predefined', label: i18n.__("Crohn's Disease"), value: 'crohns_disease' },
        { type: 'predefined', label: i18n.__('Rheumatoid Arthritis'), value: 'rheumatoid_arthritis' },
        { type: 'predefined', label: i18n.__('Stroke'), value: 'stroke' },
        { type: 'predefined', label: i18n.__('Phenylketonuria (PKU)'), value: 'phenylketonuria' },
        { type: 'predefined', label: i18n.__("Dementia / Alzheimer's"), value: 'dementia_alzheimers' },
        {
          type: 'predefined',
          label: i18n.__('Chronic Obstructive Pulmonary Disease (COPD)'),
          value: 'copd',
        },
        {
          type: 'predefined',
          label: i18n.__('Heart disease'),
          value: 'heart_disease',
        },
        {
          type: 'predefined',
          label: i18n.__('Heart-related issues'),
          value: 'heart_related_issues',
        },
        {
          type: 'predefined',
          label: i18n.__('High cholesterol'),
          value: 'high_cholesterol',
        },
        {
          type: 'predefined',
          label: i18n.__('Thyroid issues'),
          value: 'thyroid_issues',
        },
        {
          type: 'predefined',
          label: i18n.__('Chronic kidney disease (CKD)'),
          value: 'chronic_kidney_disease',
        },
        {
          type: 'predefined',
          label: i18n.__('End-state renal disease (ESRD) / dialysis'),
          value: 'end_state_renal_disease',
        },
        {
          type: 'predefined',
          label: i18n.__('Celiac disease'),
          value: 'celiac_disease',
        },
        {
          type: 'predefined',
          label: i18n.__('Other autoimmune disease'),
          value: 'other_autoimmune_disease',
        },
        {
          type: 'predefined',
          label: i18n.__('Eating disorders'),
          value: 'eating_disorders',
        },
        {
          type: 'predefined',
          label: i18n.__('Physical problem / ADL problems'),
          value: 'physical_problem_adl_problems',
        },
        {
          type: 'predefined',
          label: i18n.__('Pregnant'),
          value: 'pregnant',
        },
        {
          type: 'predefined',
          label: i18n.__('No medical conditions'),
          value: 'no_medical_conditions',
        },
      ],
    },
    medications: {
      type: 'tag-input',
      key: 'medications',
      required: true,
      label: i18n.__('Do you currently use any of these medications?'),
      inputLabel: i18n.__('Medications'),
      creatable: true,
      options: [
        {
          type: 'predefined',
          label: i18n.__('GLP-1/weight loss medication: WeGovy, Ozempic, or other'),
          value: 'glp1_weight_loss_medication',
        },
        {
          type: 'predefined',
          label: i18n.__('Blood pressure medication'),
          value: 'blood_pressure_medication',
        },
        {
          type: 'predefined',
          label: i18n.__('Diabetes medication'),
          value: 'diabetes_medication',
        },
        {
          type: 'predefined',
          label: i18n.__('Mental health (anxiety, depression, or other) medication'),
          value: 'mental_health_medication',
        },
        {
          type: 'predefined',
          label: i18n.__('Thyroid medication'),
          value: 'thyroid_medication',
        },
        {
          type: 'predefined',
          label: i18n.__('Cholesterol medication'),
          value: 'cholesterol_medication',
        },
        {
          type: 'predefined',
          label: i18n.__('Diuretic medication'),
          value: 'diuretic_medication',
        },
        {
          type: 'predefined',
          label: i18n.__('No medications'),
          value: 'no_medications',
        },
      ],
    },
    height_inputs: {
      type: 'inline-inputs',
      name: 'biometrics_height_inputs',
      label: i18n.__('Height'),
      inputs: [
        {
          type: 'input:number',
          inputLabel: i18n.__('Feet'),
          key: 'height_feet',
          min: 1,
          max: 10,
          required: false,
        },
        {
          type: 'input:number',
          inputLabel: i18n.__('Inches'),
          key: 'height_inches',
          min: 0,
          max: 11.9,
          decimalScale: 1,
          required: false,
        },
      ],
    },
    weight_table: {
      type: 'table',
      tableLabel: i18n.__('Weight'),
      key: 'weight',
      addEntryModal: {
        title: i18n.__('Add Reading'),
        widgets: [
          {
            type: 'input:number',
            inputLabel: `${i18n.__('Weight')} (lbs)`,
            key: 'pounds',
            min: 0,
            max: 1000,
            decimalScale: 1,
            required: true,
          },
          {
            type: 'input:date',
            inputLabel: i18n.__('Date of reading'),
            key: 'date',
            required: true,
            max: TODAY_ISO,
          },
        ],
      },
      renderEntryConfig: {
        label: {
          text: '{{pounds}}',
          interpolate: {
            pounds: {
              type: 'text',
              key: 'pounds',
            },
          },
        },
        sublabel: {
          text: '{{date}}',
          interpolate: {
            date: {
              type: 'date',
              key: 'date',
              format: 'LL/dd/yyyy',
            },
          },
        },
      },
    },
    blood_pressure_table: {
      type: 'table',
      tableLabel: `${i18n.__('Blood Pressure')} (mmHG)`,
      key: 'blood_pressure',
      addEntryModal: {
        title: i18n.__(`Add Reading`),
        widgets: [
          {
            type: 'input:number',
            key: 'systolic',
            min: 0,
            max: 1000,
            inputLabel: i18n.__('Systolic Blood Pressure (mmHG)'),
            required: true,
          },
          {
            type: 'input:number',
            key: 'diastolic',
            min: 0,
            max: 1000,
            inputLabel: i18n.__('Diastolic Blood Pressure (mmHG)'),
            required: true,
          },
          {
            type: 'input:date',
            inputLabel: i18n.__('Date of reading'),
            key: 'date',
            required: true,
            max: TODAY_ISO,
          },
        ],
      },
      renderEntryConfig: {
        label: {
          text: `{{systolic}}/{{diastolic}}`,
          interpolate: {
            systolic: {
              key: 'systolic',
              type: 'text',
            },
            diastolic: {
              key: 'diastolic',
              type: 'text',
            },
          },
        },
        sublabel: {
          text: '{{date}}',
          interpolate: {
            date: {
              key: 'date',
              type: 'date',
              format: 'LL/dd/yyyy',
            },
          },
        },
      },
    },
    lipids_table: {
      type: 'table',
      tableLabel: i18n.__('Lipids'),
      key: 'lipids',
      addEntryModal: {
        title: i18n.__('Add Reading'),
        widgets: [
          {
            type: 'input:number',
            inputLabel: i18n.__('HDL (mg / DL)'),
            key: 'hdl',
            min: 0,
            max: 1000,
          },
          {
            type: 'input:number',
            inputLabel: i18n.__('LDL (mg / DL)'),
            key: 'ldl',
            min: 0,
            max: 1000,
          },
          {
            type: 'input:number',
            inputLabel: i18n.__('Triglycerides (mg / DL)'),
            key: 'triglycerides',
            min: 0,
            max: 5000,
          },
          {
            type: 'input:number',
            inputLabel: i18n.__('Total cholesterol (mg / DL)'),
            key: 'cholesterol',
            min: 0,
            max: 1000,
          },
          {
            type: 'input:date',
            inputLabel: i18n.__('Date of reading'),
            key: 'date',
            required: true,
            max: TODAY_ISO,
          },
        ],
      },
      renderEntryConfig: {
        label: {
          text: `${i18n.__('HDL (mg / DL)')}: {{hdl}}<br/> ${i18n.__('LDL (mg / DL)')}: {{ldl}}<br/> ${i18n.__('Triglycerides (mg / DL)')}: {{triglycerides}}<br/> ${i18n.__('Total cholesterol (mg / DL)')}: {{cholesterol}}`,
          interpolate: {
            hdl: {
              key: 'hdl',
              type: 'text',
            },
            ldl: {
              key: 'ldl',
              type: 'text',
            },
            triglycerides: {
              key: 'triglycerides',
              type: 'text',
            },
            cholesterol: {
              key: 'cholesterol',
              type: 'text',
            },
          },
        },
        sublabel: {
          text: '{{date}}',
          interpolate: {
            date: {
              type: 'date',
              key: 'date',
              format: 'LL/dd/yyyy',
            },
          },
        },
      },
    },
    a1c_table: {
      type: 'table',
      tableLabel: i18n.__('A1c lab results'),
      key: 'a1c',
      addEntryModal: {
        title: 'A1c lab result entry',
        widgets: [
          {
            type: 'input:number',
            inputLabel: i18n.__('Percentage'),
            key: 'percentage',
            min: 0,
            max: 1000,
            decimalScale: 1,
            required: true,
          },
          {
            type: 'input:date',
            inputLabel: i18n.__('Date of reading'),
            key: 'date',
            required: true,
            max: TODAY_ISO,
          },
        ],
      },
      renderEntryConfig: {
        label: {
          text: '{{percentage}}',
          interpolate: {
            percentage: {
              key: 'percentage',
              type: 'text',
            },
          },
        },
        sublabel: {
          text: '{{date}}',
          interpolate: {
            date: {
              type: 'date',
              key: 'date',
              format: 'LL/dd/yyyy',
            },
          },
        },
      },
    },
  };
};
