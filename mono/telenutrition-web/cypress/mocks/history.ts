import { FetchProviderPatientAppointmentsReturn } from 'api/provider/useFetchProviderPatientAppointments';
import { EncounterStatus } from 'api/types';

export const historyResponse: FetchProviderPatientAppointmentsReturn = {
  appointments: [
    {
      appointment: {
        appointmentId: 100000042,
        appointmentTypeId: 341,
        departmentId: 9,
        patientId: 10000000,
        providerId: 1,
        duration: 60,
        status: '3',
        startDate: '11/04/2024',
        startTime: '10:00 AM EST',
        frozen: false,
        date: '11/04/2024',
        startAt: '2024-11-04T15:00:00.000Z',
        startTimestamp: '2024-11-04T15:00:00.000Z',
        paymentMethodId: 1,
        isAudioOnly: true,
        appointmentTypeDisplay: 'Audio Only Follow Up 60',
        isFollowUp: true,
        encounterId: 1000014,
        patient: {
          patientId: 10000000,
          departmentId: 9,
          identityId: 1,
          state: 'CA',
          address1: 'ABC 123',
          city: 'Louisville',
          sex: 'M',
          phone: '+15022253532',
          email: 'conner.novicki+1@foodsmart.com',
          timezone: 'America/Los_Angeles',
          firstName: 'Conner',
          lastName: 'Novicki',
          birthday: '1990-12-07',
          zipcode: '12345',
        },
      },
      encounterData: {
        type: 'app-complete',
        encounter: {
          encounterId: 1000014,
          patientId: 10000000,
          appointmentId: 100000042,
          departmentId: 9,
          providerId: 1,
          encounterType: 'visit',
          encounterDate: '2024-10-02T00:00:00.000Z',
          actualStarttime: '2024-10-02T20:20:00+00:00',
          encounterStatus: EncounterStatus.Closed,
          createdBy: 'Kate Schlag, RD',
          closedDatetime: '2024-10-02T16:27:49.582+00:00',
          closedBy: 'Kate Schlag, RD',
          specialty: 'Registered Dietitian Nutritionist',
          billingTabReviewed: 'Kate Schlag, RD, 2024-10-02 16:27:49',
          lastModified: '2024-10-02T16:27:49.582+00:00',
          specialtyId: '071',
          actualEndtime: '2024-10-02T20:30:00+00:00',
          totalMinutes: 10,
          unitsBilled: 6,
          diagnosisCode: 'Z71.3',
          billingCode: '97803',
          createdAt: '2024-10-02T14:34:06.578+00:00',
          updatedAt: '2024-10-02T16:27:49.582+00:00',
          rawData: {
            cpt_code: '97803',
            end_time: '10:30',
            start_time: '10:20',
            main_reason: 'lose_weight',
            units_billed: '6',
            meals_per_day: '2',
            pes_statement: {
              related_to: 'poor_intake',
              signs_and_symptoms: 'abc',
              nutrition_diagnosis: 'inadequate_energy_intake',
            },
            diagnosis_code: 'Z71.3',
            medications_list: null,
            medical_conditions: null,
            stated_member_goals: 'abc',
            vitamin_supplements: null,
            grocery_payment_method: {
              ebt_card_but_dont_use: true,
            },
            member_details_confirmed: true,
            food_sensitivity_intolerance: null,
            member_expressed_understanding_of_education: 'no',
            member_felt_confident_in_ability_to_meet_goals: 'no',
          },
        },
        displayChartingData: [
          {
            type: 'group',
            title: 'Member Details',
            groupKey: 'member_details',
            children: [
              {
                type: 'group',
                title: 'Basic Details',
                groupKey: 'basic_details',
                children: [
                  {
                    type: 'single-checkbox',
                    label:
                      'Confirm member name, date of birth, and state where they are currently located.',
                    value: true,
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            title: 'Assessment',
            groupKey: 'assessment',
            children: [
              {
                type: 'group',
                title: 'General questions',
                groupKey: 'general_questions_group',
                children: [
                  {
                    type: 'text',
                    question: 'Start time',
                    text: '10:20 AM',
                  },
                  {
                    type: 'text',
                    question: 'Stated member goals',
                    text: 'abc',
                  },
                  {
                    type: 'text',
                    question: 'What is your main reason for using Foodsmart?',
                    text: 'I want to lose weight',
                  },
                  {
                    type: 'single-checkbox',
                    label: 'The member is pregnant',
                    value: false,
                  },
                ],
              },
              {
                type: 'group',
                title: 'Biometrics',
                groupKey: 'biometrics_questions_group',
                children: [
                  {
                    type: 'group',
                    title: 'Blood pressure (mmHg)',
                    groupKey: 'blood_pressure_group',
                    children: [],
                  },
                  {
                    type: 'group',
                    title: 'Most recent lipids measurements',
                    groupKey: 'lipids_group',
                    children: [],
                  },
                ],
              },
              {
                type: 'group',
                title: 'Diet type',
                groupKey: 'diet_type_group',
                children: [
                  {
                    type: 'text',
                    question: 'How many meals do you eat per day?',
                    text: '2',
                  },
                ],
              },
              {
                type: 'group',
                title: 'Lifestyle',
                groupKey: 'lifestyle_group',
                children: [],
              },
              {
                type: 'group',
                title: 'Cooking habits',
                groupKey: 'cooking_habits_group',
                children: [],
              },
              {
                type: 'group',
                title: 'Food security',
                groupKey: 'food_security_group',
                children: [
                  {
                    type: 'text',
                    question: 'How do you typically pay for your groceries?',
                    bullets: ["I have an EBT card, but don't use it"],
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            title: 'Treatment plan',
            groupKey: 'treatment_plan',
            children: [
              {
                type: 'group',
                title: 'PES statement',
                groupKey: 'pes_statement',
                children: [
                  {
                    type: 'text',
                    question: 'Member with...',
                    text: 'Inadequate (suboptimal) energy intake',
                  },
                  {
                    type: 'text',
                    question: '...related to...',
                    text: 'Poor intake',
                  },
                  {
                    type: 'text',
                    question: 'as evidenced by...',
                    text: 'abc',
                  },
                ],
              },
              {
                type: 'group',
                title: 'Intervention',
                groupKey: 'intervention_group',
                children: [],
              },
              {
                type: 'group',
                title: 'Monitoring & evaluation',
                groupKey: 'monitoring_and_evaluation_group',
                children: [
                  {
                    type: 'text',
                    question: 'Member expressed an understanding of the education.',
                    text: 'No',
                  },
                  {
                    type: 'text',
                    question: 'Member felt confident in their ability to meet the goals discussed.',
                    text: 'No',
                  },
                  {
                    type: 'group',
                    title: 'General encounter notes',
                    groupKey: 'general_encounter_notes_group',
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            title: 'Encounter closeout',
            groupKey: 'encounter_closeout_group',
            children: [
              {
                type: 'group',
                title: 'Billing details',
                groupKey: 'billing_details',
                children: [
                  {
                    type: 'text',
                    question: 'End time',
                    text: '10:30 AM',
                  },
                  {
                    type: 'text',
                    question: 'Units billed',
                    text: '6',
                  },
                  {
                    type: 'text',
                    question: 'Billing / CPT code',
                    text: '97803',
                  },
                  {
                    type: 'text',
                    question: 'Diagnosis code',
                    text: 'Z71.3',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
    {
      appointment: {
        appointmentId: 100000079,
        appointmentTypeId: 341,
        departmentId: 9,
        patientId: 10000000,
        providerId: 1,
        duration: 60,
        status: '3',
        startDate: '10/13/2024',
        startTime: '5:00 PM EDT',
        frozen: false,
        date: '10/13/2024',
        startAt: '2024-10-13T21:00:00.000Z',
        startTimestamp: '2024-10-13T21:00:00.000Z',
        paymentMethodId: 1,
        isAudioOnly: true,
        appointmentTypeDisplay: 'Audio Only Follow Up 60',
        isFollowUp: true,
        encounterId: 1000021,
        patient: {
          patientId: 10000000,
          departmentId: 9,
          identityId: 1,
          state: 'CA',
          address1: 'ABC 123',
          city: 'Louisville',
          sex: 'M',
          phone: '+15022253532',
          email: 'conner.novicki+1@foodsmart.com',
          timezone: 'America/Los_Angeles',
          firstName: 'Conner',
          lastName: 'Novicki',
          birthday: '1990-12-07',
          zipcode: '12345',
        },
      },
      encounterData: {
        type: 'app-complete',
        encounter: {
          encounterId: 1000021,
          patientId: 10000000,
          appointmentId: 100000079,
          departmentId: 9,
          providerId: 1,
          encounterType: 'visit',
          encounterDate: '2024-10-08T00:00:00.000Z',
          actualStarttime: '2024-10-10T18:30:00+00:00',
          encounterStatus: EncounterStatus.Closed,
          createdBy: 'Kate Schlag, RD',
          closedDatetime: '2024-10-10T20:00:22.938+00:00',
          closedBy: 'Kate Schlag, RD',
          specialty: 'Registered Dietitian Nutritionist',
          billingTabReviewed: 'Kate Schlag, RD, 2024-10-10 20:00:22',
          lastModified: '2024-10-10T20:00:22.938+00:00',
          specialtyId: '071',
          actualEndtime: '2024-10-10T18:33:00+00:00',
          totalMinutes: 3,
          unitsBilled: 3,
          diagnosisCode: 'Z71.3',
          billingCode: '99215',
          createdAt: '2024-10-08T14:49:42.38+00:00',
          updatedAt: '2024-10-10T20:00:22.938+00:00',
          rawData: {
            cpt_code: '99215',
            end_time: '14:33',
            start_time: '14:30',
            main_reason: 'general_wellness',
            units_billed: '3',
            pes_statement: {
              related_to: 'fever',
              signs_and_symptoms: 'abc',
              nutrition_diagnosis: 'increased_energy_expenditure',
            },
            diagnosis_code: 'Z71.3',
            note_to_member: 'abc',
            medications_list: null,
            intervention_notes: 'abcdefg',
            medical_conditions: null,
            stated_member_goals: 'abcdefg',
            member_details_confirmed: true,
            member_expressed_understanding_of_education: 'no',
            member_felt_confident_in_ability_to_meet_goals: 'no',
          },
        },
        displayChartingData: [
          {
            type: 'group',
            title: 'Member Details',
            groupKey: 'member_details',
            children: [
              {
                type: 'group',
                title: 'Basic Details',
                groupKey: 'basic_details',
                children: [
                  {
                    type: 'single-checkbox',
                    label:
                      'Confirm member name, date of birth, and state where they are currently located.',
                    value: true,
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            title: 'Assessment',
            groupKey: 'assessment',
            children: [
              {
                type: 'group',
                title: 'General questions',
                groupKey: 'general_questions_group',
                children: [
                  {
                    type: 'text',
                    question: 'Start time',
                    text: '2:30 PM',
                  },
                  {
                    type: 'text',
                    question: 'Stated member goals',
                    text: 'abcdefg',
                  },
                  {
                    type: 'text',
                    question: 'What is your main reason for using Foodsmart?',
                    text: 'I want to improve my general wellness',
                  },
                  {
                    type: 'single-checkbox',
                    label: 'The member is pregnant',
                    value: false,
                  },
                ],
              },
              {
                type: 'group',
                title: 'Biometrics',
                groupKey: 'biometrics_questions_group',
                children: [
                  {
                    type: 'group',
                    title: 'Blood pressure (mmHg)',
                    groupKey: 'blood_pressure_group',
                    children: [],
                  },
                  {
                    type: 'group',
                    title: 'Most recent lipids measurements',
                    groupKey: 'lipids_group',
                    children: [],
                  },
                ],
              },
              {
                type: 'group',
                title: 'Diet type',
                groupKey: 'diet_type_group',
                children: [],
              },
              {
                type: 'group',
                title: 'Lifestyle',
                groupKey: 'lifestyle_group',
                children: [],
              },
              {
                type: 'group',
                title: 'Cooking habits',
                groupKey: 'cooking_habits_group',
                children: [],
              },
              {
                type: 'group',
                title: 'Food security',
                groupKey: 'food_security_group',
                children: [],
              },
            ],
          },
          {
            type: 'group',
            title: 'Treatment plan',
            groupKey: 'treatment_plan',
            children: [
              {
                type: 'group',
                title: 'PES statement',
                groupKey: 'pes_statement',
                children: [
                  {
                    type: 'text',
                    question: 'Member with...',
                    text: 'Increased energy expenditure',
                  },
                  {
                    type: 'text',
                    question: '...related to...',
                    text: 'Fever',
                  },
                  {
                    type: 'text',
                    question: 'as evidenced by...',
                    text: 'abc',
                  },
                ],
              },
              {
                type: 'group',
                title: 'Intervention',
                groupKey: 'intervention_group',
                children: [
                  {
                    type: 'text',
                    question: 'Intervention notes',
                    text: 'abcdefg',
                  },
                ],
              },
              {
                type: 'group',
                title: 'Monitoring & evaluation',
                groupKey: 'monitoring_and_evaluation_group',
                children: [
                  {
                    type: 'text',
                    question: 'Member expressed an understanding of the education.',
                    text: 'No',
                  },
                  {
                    type: 'text',
                    question: 'Member felt confident in their ability to meet the goals discussed.',
                    text: 'No',
                  },
                  {
                    type: 'group',
                    title: 'General encounter notes',
                    groupKey: 'general_encounter_notes_group',
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            title: 'Encounter closeout',
            groupKey: 'encounter_closeout_group',
            children: [
              {
                type: 'group',
                title: 'Billing details',
                groupKey: 'billing_details',
                children: [
                  {
                    type: 'text',
                    question: 'End time',
                    text: '2:33 PM',
                  },
                  {
                    type: 'text',
                    question: 'Units billed',
                    text: '3',
                  },
                  {
                    type: 'text',
                    question: 'Billing / CPT code',
                    text: '99215',
                  },
                  {
                    type: 'text',
                    question: 'Diagnosis code',
                    text: 'Z71.3',
                  },
                ],
              },
              {
                type: 'text',
                question: 'Note to member',
                text: 'abc',
              },
            ],
          },
        ],
      },
    },
    {
      appointment: {
        appointmentId: 100000077,
        appointmentTypeId: 341,
        departmentId: 9,
        patientId: 10000000,
        providerId: 1,
        duration: 60,
        status: '3',
        startDate: '10/09/2024',
        startTime: '9:00 AM EDT',
        frozen: false,
        date: '10/09/2024',
        startAt: '2024-10-09T13:00:00.000Z',
        startTimestamp: '2024-10-09T13:00:00.000Z',
        paymentMethodId: 1,
        isAudioOnly: true,
        appointmentTypeDisplay: 'Audio Only Follow Up 60',
        isFollowUp: true,
        encounterId: 1000019,
        patient: {
          patientId: 10000000,
          departmentId: 9,
          identityId: 1,
          state: 'CA',
          address1: 'ABC 123',
          city: 'Louisville',
          sex: 'M',
          phone: '+15022253532',
          email: 'conner.novicki+1@foodsmart.com',
          timezone: 'America/Los_Angeles',
          firstName: 'Conner',
          lastName: 'Novicki',
          birthday: '1990-12-07',
          zipcode: '12345',
        },
      },
      encounterData: {
        type: 'app-complete',
        encounter: {
          encounterId: 1000019,
          patientId: 10000000,
          appointmentId: 100000077,
          departmentId: 9,
          providerId: 1,
          encounterType: 'visit',
          encounterDate: '2024-10-07T00:00:00.000Z',
          actualStarttime: '2024-10-08T01:00:00+00:00',
          encounterStatus: EncounterStatus.Closed,
          createdBy: 'Kate Schlag, RD',
          closedDatetime: '2024-10-07T21:05:20.307+00:00',
          closedBy: 'Kate Schlag, RD',
          specialty: 'Registered Dietitian Nutritionist',
          billingTabReviewed: 'Kate Schlag, RD, 2024-10-07 21:05:20',
          lastModified: '2024-10-07T21:05:20.307+00:00',
          specialtyId: '071',
          actualEndtime: '2024-10-08T04:06:00+00:00',
          totalMinutes: 186,
          unitsBilled: 5,
          diagnosisCode: 'Z71.3',
          billingCode: '99202',
          createdAt: '2024-10-07T21:02:13.876+00:00',
          updatedAt: '2024-10-07T21:05:20.307+00:00',
          rawData: {
            weight: {
              date: '2024-01-01',
              value: '140',
            },
            cpt_code: '99202',
            end_time: '18:06',
            start_time: '15:00',
            diet_recall: 'eggs\nspinach\n\n\n\nother stuff',
            height_feet: '4',
            main_reason: 'crohns_disease',
            food_allergy: ['milk_dairy_allergy', 'egg_allergy'],
            units_billed: '5',
            height_inches: '4',
            interventions: ['ckd_whole_food_diet'],
            meals_per_day: '3',
            pes_statement: {
              related_to: 'inadequate_excessive_rate',
              signs_and_symptoms: 'hhjklyuio',
              nutrition_diagnosis: 'pn_administration_inconsistent_with_needs',
            },
            activity_level: 'high',
            diagnosis_code: 'Z71.3',
            note_to_member: 'hjlhjk',
            social_support: 'always',
            medications_list: [
              'phentermine_medications',
              'glp1_medications',
              'blood_pressure_medications',
            ],
            total_cholesterol: {
              date: '2024-02-02',
              value: '400',
            },
            medical_conditions: null,
            weekly_food_budget: '600.00',
            stated_member_goals: 'abc member goals\n\n\nFinalized.',
            vitamin_supplements: null,
            distance_from_grocery: 'less_than_1_mile',
            last_meal_of_day_time: '20:30',
            specialized_diet_type: null,
            average_sleep_duration: '8',
            cooking_responsibility: 'other',
            current_work_situation: 'full_time',
            first_meal_of_day_time: '03:30',
            grocery_payment_method: {
              ebt_card_but_dont_use: true,
              dont_buy_groceries_for_household: true,
            },
            blood_pressure_systolic: {
              date: '2024-02-02',
              value: '30',
            },
            meal_preparation_reason: {
              other: true,
            },
            blood_pressure_diastolic: {
              date: '2024-02-02',
              value: '50',
            },
            inpatient_discharge_date: '2024-01-01',
            inpatient_visit_facility: {
              hospital: true,
            },
            member_details_confirmed: true,
            cooking_frequency_at_home: 'daily',
            emotional_response_to_food: {
              food_brings_me_joy: true,
              food_feels_like_a_chore: true,
            },
            grocery_acquisition_method: {
              other: true,
            },
            reason_for_inpatient_visit: 'pneumonia',
            confidence_in_food_abilities: {
              wash_food: true,
              cut_up_food: true,
            },
            food_security_last_12_months: 'dont_know_prefer_not_to_say',
            food_sensitivity_intolerance: null,
            grocery_purchasing_frequency: 'daily',
            inpatient_visit_last_90_days: 'inpatient_treatment_last_90_days',
            snap_ebt_assistance_interest: 'not_interested_snap_ebt',
            takeout_restaurant_frequency: 'daily',
            food_shortage_worry_frequency: 'dont_know_prefer_not_to_say',
            health_related_activity_limitations: 'not_limited_at_all',
            household_food_adequacy_last_12_months: 'dont_know_prefer_not_to_say',
            difficulty_getting_eating_healthy_foods: 'not_hard_at_all',
            member_expressed_understanding_of_education: 'no',
            member_felt_confident_in_ability_to_meet_goals: 'no',
          },
        },
        displayChartingData: [
          {
            type: 'group',
            title: 'Member Details',
            groupKey: 'member_details',
            children: [
              {
                type: 'group',
                title: 'Basic Details',
                groupKey: 'basic_details',
                children: [
                  {
                    type: 'single-checkbox',
                    label:
                      'Confirm member name, date of birth, and state where they are currently located.',
                    value: true,
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            title: 'Assessment',
            groupKey: 'assessment',
            children: [
              {
                type: 'group',
                title: 'General questions',
                groupKey: 'general_questions_group',
                children: [
                  {
                    type: 'text',
                    question: 'Start time',
                    text: '3:00 PM',
                  },
                  {
                    type: 'text',
                    question: 'Stated member goals',
                    text: 'abc member goals\n\n\nFinalized.',
                  },
                  {
                    type: 'text',
                    question: 'What is your main reason for using Foodsmart?',
                    text: 'Manage condition...',
                  },
                  {
                    type: 'single-checkbox',
                    label: 'The member is pregnant',
                    value: false,
                  },
                  {
                    type: 'text',
                    question: 'Do you take any of the following medications?',
                    text: 'Yes',
                    bullets: [
                      'Phentermine Medications (e.g., Adipex, Atti-Plex P, Fastin, Ionamin, Lomaira, Phentercot, Phentride, Pro-Fast)',
                      'GLP-1 Medications (e.g., WeGovy, Ozempic, Mounjaro, Zepbound)',
                      'Blood Pressure Medications',
                    ],
                  },
                  {
                    type: 'text',
                    question:
                      'Have you been in a medical facility for inpatient treatment in the last 90 days?',
                    text: 'Yes - Inpatient Treatment in the last 90 days',
                  },
                  {
                    type: 'text',
                    question: 'Discharge date',
                    text: '01/01/2024',
                  },
                  {
                    type: 'text',
                    question: 'Facility',
                    bullets: ['Hospital'],
                  },
                  {
                    type: 'text',
                    question: 'Reason for admission',
                    text: 'Pneumonia',
                  },
                ],
              },
              {
                type: 'group',
                title: 'Biometrics',
                groupKey: 'biometrics_questions_group',
                children: [
                  {
                    type: 'text',
                    question: 'Feet',
                    text: '4',
                  },
                  {
                    type: 'text',
                    question: 'Inches',
                    text: '4',
                  },
                  {
                    type: 'text',
                    question: 'Weight (lbs)',
                    text: '140/ 01/01/2024',
                  },
                  {
                    type: 'group',
                    title: 'Blood pressure (mmHg)',
                    groupKey: 'blood_pressure_group',
                    children: [
                      {
                        type: 'text',
                        question: 'Systolic',
                        text: '30/ 02/02/2024',
                      },
                      {
                        type: 'text',
                        question: 'Diastolic',
                        text: '50/ 02/02/2024',
                      },
                    ],
                  },
                  {
                    type: 'group',
                    title: 'Most recent lipids measurements',
                    groupKey: 'lipids_group',
                    children: [
                      {
                        type: 'text',
                        question: 'Total Cholesterol (mg/DL)',
                        text: '400/ 02/02/2024',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'group',
                title: 'Diet type',
                groupKey: 'diet_type_group',
                children: [
                  {
                    type: 'text',
                    question: 'Do you have any of the following food allergies?',
                    text: 'Yes',
                    bullets: ['Milk or Dairy', 'Egg'],
                  },
                  {
                    type: 'text',
                    question: 'How many meals do you eat per day?',
                    text: '3',
                  },
                  {
                    type: 'text',
                    question: 'On average, what time is your first meal?',
                    text: '3:30 AM',
                  },
                  {
                    type: 'text',
                    question: 'On average, what time is your last meal?',
                    text: '8:30 PM',
                  },
                  {
                    type: 'text',
                    question: 'Diet recall',
                    text: 'eggs\nspinach\n\n\n\nother stuff',
                  },
                ],
              },
              {
                type: 'group',
                title: 'Lifestyle',
                groupKey: 'lifestyle_group',
                children: [
                  {
                    type: 'text',
                    question: "What's your current working situation?",
                    text: 'Employed: Full-time',
                  },
                  {
                    type: 'text',
                    question: "What's your current activity level?",
                    text: 'High',
                  },
                  {
                    type: 'text',
                    question:
                      'For the past 6 months, to what extent have you been limited because of a health problem in activities people usually do?',
                    text: 'Not limited at all',
                  },
                  {
                    type: 'text',
                    question:
                      'If you were in trouble, do you have relatives or friends you can count on to help you whenever you need them?',
                    text: 'Always',
                  },
                  {
                    type: 'text',
                    question:
                      'How many hours of sleep do you get a night on average over the past 6 months?',
                    text: '8',
                  },
                ],
              },
              {
                type: 'group',
                title: 'Cooking habits',
                groupKey: 'cooking_habits_group',
                children: [
                  {
                    type: 'text',
                    question: 'Who does most of the cooking in your household?',
                    text: 'Other',
                  },
                  {
                    type: 'text',
                    question:
                      'How often do you cook meals at home or have them cooked by a household member?',
                    text: 'Daily',
                  },
                  {
                    type: 'text',
                    question: 'For what reason(s) were meals made in other ways?',
                    bullets: ['Other'],
                  },
                  {
                    type: 'text',
                    question: 'How often do you or someone in your household purchase groceries?',
                    text: 'Daily',
                  },
                  {
                    type: 'text',
                    question: 'How do you typically get your groceries?',
                    bullets: ['Other'],
                  },
                  {
                    type: 'text',
                    question:
                      'How often do you order take out or visit a restaurant/fast food establishment?',
                    text: 'Daily',
                  },
                ],
              },
              {
                type: 'group',
                title: 'Food security',
                groupKey: 'food_security_group',
                children: [
                  {
                    type: 'text',
                    question: 'How do you typically pay for your groceries?',
                    bullets: [
                      "I have an EBT card, but don't use it",
                      "I don't buy groceries for my household",
                    ],
                  },
                  {
                    type: 'text',
                    question:
                      'In the last 12 months, how often were you worried that food would run out before you got money to buy more?',
                    text: "Don't Know or I'd prefer not to say",
                  },
                  {
                    type: 'text',
                    question:
                      'In the last 12 months, how often did the food you buy not last, and you didn’t have money to get more?',
                    text: "Don't Know or I'd prefer not to say",
                  },
                  {
                    type: 'text',
                    question:
                      'Select which of these statements best describes the food eaten in your household in the last 12 months.',
                    text: "Don't Know or I'd prefer not to say",
                  },
                  {
                    type: 'text',
                    question:
                      'Thinking about the last 12 months, how hard was it for you or your household to regularly get and eat healthy foods?',
                    text: 'Not hard at all',
                  },
                  {
                    type: 'text',
                    question:
                      'Are you interested in having Foodsmart help you with SNAP/EBT benefits?',
                    text: 'No, I’m not interested.',
                  },
                  {
                    type: 'text',
                    question: 'What is your weekly food budget?',
                    text: '600',
                  },
                  {
                    type: 'text',
                    question: 'About how far do you live from your nearest grocery store?',
                    text: '<1 mile',
                  },
                  {
                    type: 'text',
                    question: '"I am confident in my abilities to..."',
                    bullets: ['wash food', 'cut up food'],
                  },
                  {
                    type: 'text',
                    question: '"When I think about food, I feel that..."',
                    bullets: ['Food brings me joy', 'Food feels like a chore'],
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            title: 'Treatment plan',
            groupKey: 'treatment_plan',
            children: [
              {
                type: 'group',
                title: 'PES statement',
                groupKey: 'pes_statement',
                children: [
                  {
                    type: 'text',
                    question: 'Member with...',
                    text: 'PN administration inconsistent with needs',
                  },
                  {
                    type: 'text',
                    question: '...related to...',
                    text: 'Inadequate or excessive rate',
                  },
                  {
                    type: 'text',
                    question: 'as evidenced by...',
                    text: 'hhjklyuio',
                  },
                ],
              },
              {
                type: 'group',
                title: 'Intervention',
                groupKey: 'intervention_group',
                children: [
                  {
                    type: 'text',
                    question: 'Intervention',
                    bullets: [
                      'Educated on adopting a whole food plant based diet with chronic kidney disease.',
                    ],
                  },
                ],
              },
              {
                type: 'group',
                title: 'Monitoring & evaluation',
                groupKey: 'monitoring_and_evaluation_group',
                children: [
                  {
                    type: 'text',
                    question: 'Member expressed an understanding of the education.',
                    text: 'No',
                  },
                  {
                    type: 'text',
                    question: 'Member felt confident in their ability to meet the goals discussed.',
                    text: 'No',
                  },
                  {
                    type: 'group',
                    title: 'General encounter notes',
                    groupKey: 'general_encounter_notes_group',
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            type: 'group',
            title: 'Encounter closeout',
            groupKey: 'encounter_closeout_group',
            children: [
              {
                type: 'group',
                title: 'Billing details',
                groupKey: 'billing_details',
                children: [
                  {
                    type: 'text',
                    question: 'End time',
                    text: '6:06 PM',
                  },
                  {
                    type: 'text',
                    question: 'Units billed',
                    text: '5',
                  },
                  {
                    type: 'text',
                    question: 'Billing / CPT code',
                    text: '99202',
                  },
                  {
                    type: 'text',
                    question: 'Diagnosis code',
                    text: 'Z71.3',
                  },
                ],
              },
              {
                type: 'text',
                question: 'Note to member',
                text: 'hjlhjk',
              },
            ],
          },
        ],
      },
    },
  ],
};
