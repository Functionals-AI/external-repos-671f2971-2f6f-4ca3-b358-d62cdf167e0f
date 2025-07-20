import { okResponse } from '../../mocks/responses';
import { encounterResponse } from '../../mocks/encounter-1';
import { FetchAppointmentEncounterInfoResult } from 'api/encounter/useFetchAppointmentEncounterInfo';
import { DateTime } from 'luxon';
import { setupProviderFixutre1 } from '../../mocks/provider-fixture-1';
import { historyResponse } from '../../mocks/history';
import EncounterPage from '../../pages/encounter/page';
import { UseGetStickyNotesForPatientsResult } from 'api/provider/useGetStickyNotesForPatient';
import { EncounterOversightStatus, EncounterStatus } from 'api/types';	

function fillOutFullChart() {
  EncounterPage.byDataTestId('member_details_confirmed-checkbox').click();
  EncounterPage.byDataTestId('start_time-input').type('14:30');
  EncounterPage.byDataTestId('stated_member_goals-input').type(
    'Member goals for the patient go here.',
  );
  EncounterPage.byDataTestId('radio-option-main_reason-manage_condition').click();
  EncounterPage.byDataTestId('radio-option-main_reason-combobox-manage_condition')
    .click()
    .type('Hypertension{enter}');
  EncounterPage.byDataTestId('radio-option-medical_conditions-yes').click();
  EncounterPage.byDataTestId('widget-question-medical_conditions')
    .find('[data-testid="tag-input-input"]')
    .type('Type 1 diabetes{enter}IBS{enter}{esc}');

  // pregnancy
  EncounterPage.byDataTestId('pregnancy-checkbox').click();
  EncounterPage.byDataTestId('pregnancy_due_date-input').type('02/02/2024');
  EncounterPage.byDataTestId('is_breastfeeding-checkbox').click();

  EncounterPage.byDataTestId('radio-option-pregnancy_risk-normal_pregnancy').click();

  EncounterPage.byDataTestId('radio-option-medications_list-yes').click();
  EncounterPage.byDataTestId('widget-question-medications_list')
    .find('[data-testid="tag-input-input"]')
    .type('Appetite{enter}{esc}');

  EncounterPage.byDataTestId('radio-option-member_is_smoker-non_smoker').click();
  EncounterPage.byDataTestId(
    'radio-option-inpatient_visit_last_90_days-no_inpatient_care_last_90_days',
  ).click();

  EncounterPage.byDataTestId('radio-option-gi_symptoms-yes').click();
  EncounterPage.byDataTestId('widget-question-gi_symptoms')
    .find('[data-testid="tag-input-input"]')
    .type('Abdominal bloating{enter}Heartburn{enter}{esc}');

  EncounterPage.byDataTestId('height_feet-input').type('5');
  EncounterPage.byDataTestId('height_inches-input').type('10');

  EncounterPage.byDataTestId('widget-question-weight').find('input').eq(0).type('150');
  EncounterPage.byDataTestId('widget-question-weight').find('input').eq(1).type('02/02/2024');

  EncounterPage.byDataTestId('widget-question-blood_pressure_systolic')
    .find('input')
    .eq(0)
    .type('120');
  EncounterPage.byDataTestId('widget-question-blood_pressure_systolic')
    .find('input')
    .eq(1)
    .type('02/02/2024');

  EncounterPage.byDataTestId('widget-question-blood_pressure_diastolic')
    .find('input')
    .eq(0)
    .type('200');
  EncounterPage.byDataTestId('widget-question-blood_pressure_diastolic')
    .find('input')
    .eq(1)
    .type('02/02/2024');

  EncounterPage.byDataTestId('widget-question-hdl').find('input').eq(0).type('100');
  EncounterPage.byDataTestId('widget-question-hdl').find('input').eq(1).type('02/02/2024');

  EncounterPage.byDataTestId('widget-question-ldl').find('input').eq(0).type('200');
  EncounterPage.byDataTestId('widget-question-ldl').find('input').eq(1).type('02/02/2024');

  EncounterPage.byDataTestId('widget-question-triglycerides').find('input').eq(0).type('500');
  EncounterPage.byDataTestId('widget-question-triglycerides')
    .find('input')
    .eq(1)
    .type('02/02/2024');

  EncounterPage.byDataTestId('widget-question-total_cholesterol').find('input').eq(0).type('129');
  EncounterPage.byDataTestId('widget-question-total_cholesterol')
    .find('input')
    .eq(1)
    .type('02/02/2024');

  EncounterPage.byDataTestId('radio-option-specialized_diet_type-no').click();
  EncounterPage.byDataTestId('radio-option-food_sensitivity_intolerance-no').click();
  EncounterPage.byDataTestId('radio-option-food_allergy-no').click();
  EncounterPage.byDataTestId('radio-option-vitamin_supplements-no').click();

  EncounterPage.byDataTestId('meals_per_day-input').type('3');
  EncounterPage.byDataTestId('first_meal_of_day_time-input').type('08:00');
  EncounterPage.byDataTestId('last_meal_of_day_time-input').type('16:00');
  EncounterPage.byDataTestId('diet_recall-input').type('Diet recall info..... goes.... here');
  EncounterPage.byDataTestId('current_work_situation-input').type('Full-time{enter}');
  EncounterPage.byDataTestId('radio-option-activity_level-medium').click();

  EncounterPage.byDataTestId(
    'radio-option-health_related_activity_limitations-severely_limited',
  ).click();
  EncounterPage.byDataTestId('radio-option-social_support-always').click();
  EncounterPage.byDataTestId('average_sleep_duration-input').type('8');
  EncounterPage.byDataTestId('radio-option-cooking_responsibility-other').click();

  EncounterPage.byDataTestId('radio-option-cooking_frequency_at_home-weekly').click();

  EncounterPage.byDataTestId('checkbox-option-dont_know_how_to_cook-button').click();
  EncounterPage.byDataTestId('checkbox-option-cooking_is_too_expensive-button').click();

  EncounterPage.byDataTestId('radio-option-grocery_purchasing_frequency-monthly').click();

  // check then uncheck
  // How do you typically get your groceries question
  EncounterPage.byDataTestId('checkbox-option-walk_to_store-button').click();
  EncounterPage.byDataTestId('checkbox-option-drive_to_store-button').click().click();
  EncounterPage.byDataTestId('checkbox-option-order_online_for_delivery-button').click();
  // uncheck first option
  EncounterPage.byDataTestId('checkbox-option-walk_to_store-button').click();
  // end of grocery purchasing frequency

  EncounterPage.byDataTestId('radio-option-takeout_restaurant_frequency-daily').click();
  EncounterPage.byDataTestId('checkbox-option-check-button').click();
  EncounterPage.byDataTestId('radio-option-food_shortage_worry_frequency-often').click();
  EncounterPage.byDataTestId('radio-option-food_security_last_12_months-sometimes').click();
  EncounterPage.byDataTestId(
    'radio-option-household_food_adequacy_last_12_months-dont_know_prefer_not_to_say',
  ).click();
  EncounterPage.byDataTestId(
    'radio-option-difficulty_getting_eating_healthy_foods-very_hard',
  ).click();
  EncounterPage.byDataTestId('radio-option-snap_ebt_assistance_interest-applied_pending').click();
  EncounterPage.byDataTestId('weekly_food_budget-input').type('500.00');
  EncounterPage.byDataTestId('radio-option-distance_from_grocery-1-5_miles').click();
  EncounterPage.byDataTestId('checkbox-option-wash_food-button').click();
  EncounterPage.byDataTestId('checkbox-option-food_stresses_me_out-button').click();

  EncounterPage.byDataTestId('widget-question-pes_statement-input-nutrition_diagnosis')
    .find('input')
    .type('Increased energy expenditure{enter}', { force: true });
  EncounterPage.byDataTestId('widget-question-pes_statement-input-related_to')
    .find('input')
    .type('Wound healing{enter}', { force: true });
  EncounterPage.byDataTestId('widget-question-pes_statement-input-signs_and_symptoms')
    .find('textarea')
    .type('Some free text here...');

  EncounterPage.byDataTestId('widget-question-intervention_notes')
    .find('textarea')
    .type('Test intervention notes.');
  EncounterPage.byDataTestId('radio-option-member_expressed_understanding_of_education-no').click();
  EncounterPage.byDataTestId(
    'radio-option-member_felt_confident_in_ability_to_meet_goals-yes',
  ).click();

  EncounterPage.byDataTestId('general_encounter_notes-input').type('Test general encounter notes.');

  EncounterPage.byDataTestId('units_billed-input').type('3');
  EncounterPage.byDataTestId('end_time-input').type('14:50');
  EncounterPage.byDataTestId('cpt_code-input').type('97802{enter}', { force: true });
  EncounterPage.byDataTestId('diagnosis_code-input').type('Z71.3{enter}', { force: true });
  EncounterPage.byDataTestId('note_to_member-input').type('Test note to member.');
}

const res1chartingData = {
  member_details_confirmed: true,
  start_time: '14:30',
  stated_member_goals: 'Member goals for the patient go here.',
  main_reason: 'hypertension',
  medical_conditions: ['type_1_diabetes', 'ibs'],
  pregnancy: true,
  is_breastfeeding: true,
  medications_list: ['appetite_suppressants'],
  member_is_smoker: 'non_smoker',
  inpatient_visit_last_90_days: 'no_inpatient_care_last_90_days',
  gi_symptoms: ['gi_symptoms_bloating', 'gi_symptoms_heartburn'],
  height_feet: '5',
  height_inches: '10',
  weight: { value: '150', date: '2024-02-02' },
  blood_pressure_systolic: { value: '120', date: '2024-02-02' },
  blood_pressure_diastolic: { value: '200', date: '2024-02-02' },
  hdl: { value: '100', date: '2024-02-02' },
  ldl: { value: '200', date: '2024-02-02' },
  triglycerides: { value: '500', date: '2024-02-02' },
  total_cholesterol: { value: '129', date: '2024-02-02' },
  specialized_diet_type: null,
  food_sensitivity_intolerance: null,
  food_allergy: null,
  vitamin_supplements: null,
  meals_per_day: '3',
  first_meal_of_day_time: '08:00',
  last_meal_of_day_time: '16:00',
  diet_recall: 'Diet recall info..... goes.... here',
  current_work_situation: 'full_time',
  activity_level: 'medium',
  health_related_activity_limitations: 'severely_limited',
  social_support: 'always',
  average_sleep_duration: '8',
  cooking_responsibility: 'other',
  cooking_frequency_at_home: 'weekly',
  meal_preparation_reason: {
    dont_know_how_to_cook: true,
    cooking_is_too_expensive: true,
  },
  grocery_purchasing_frequency: 'monthly',
  grocery_acquisition_method: { order_online_for_delivery: true },
  takeout_restaurant_frequency: 'daily',
  grocery_payment_method: { check: true },
  food_shortage_worry_frequency: 'often',
  food_security_last_12_months: 'sometimes',
  household_food_adequacy_last_12_months: 'dont_know_prefer_not_to_say',
  difficulty_getting_eating_healthy_foods: 'very_hard',
  snap_ebt_assistance_interest: 'applied_pending',
  weekly_food_budget: '500.00',
  distance_from_grocery: '1-5_miles',
  confidence_in_food_abilities: { wash_food: true },
  emotional_response_to_food: { food_stresses_me_out: true },
  intervention_notes: 'Test intervention notes.',
  member_expressed_understanding_of_education: 'no',
  member_felt_confident_in_ability_to_meet_goals: 'yes',
  general_encounter_notes: 'Test general encounter notes.',
  end_time: '14:50',
  units_billed: '3',
  cpt_code: '97802',
  diagnosis_code: 'Z71.3',
  note_to_member: 'Test note to member.',
  pes_statement: {
    nutrition_diagnosis: 'increased_energy_expenditure',
    related_to: 'wound_healing',
    signs_and_symptoms: 'Some free text here...',
  },
  pregnancy_due_date: '2024-02-02',
  pregnancy_risk: 'normal_pregnancy',
};

const timezone = 'US/Pacific';

const now = DateTime.fromFormat('05/13/2024', 'LL/dd/yyyy', { zone: timezone })
  .startOf('day')
  .plus({ hour: 8, minutes: 25 });

describe('Encounter', () => {
  beforeEach(() => {
    cy.clock(now.toJSDate(), ['Date']);
    cy.intercept(
      {
        method: 'PUT',
        url: '/telenutrition/api/v1/appointment-encounter/1000022/visit',
      },
      okResponse({}),
    ).as('setVisitTimer');
  });
  describe('Charting v1', () => {
    describe('Encounter before exists', () => {
      describe('encounter starts 2 days in past', () => {
        beforeEach(() => {
          const fixture = setupProviderFixutre1({ timezone, now });

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/patients/10000000/history?*',
            },
            okResponse(historyResponse),
          ).as('patientHistory');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/appointment-encounter/info?appointmentId=100000082',
            },
            okResponse<FetchAppointmentEncounterInfoResult>(
              encounterResponse({ appointmentStatus: 'f', startTimestamp: now.minus({ days: 2 }) }),
            ),
          ).as('encounterInfo');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/sticky-notes?patientId=10000000',
            },
            okResponse<UseGetStickyNotesForPatientsResult>({ stickyNotes: [] }),
          );

          cy.viewport(1500, 1500);

          cy.visit('/schedule/provider/session/100000082/meeting');
        });
      });
      describe('encounter starts in the future', () => {
        beforeEach(() => {
          const fixture = setupProviderFixutre1({ timezone, now });

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/patients/10000000/history?*',
            },
            okResponse(historyResponse),
          ).as('patientHistory');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/appointment-encounter/info?appointmentId=100000082',
            },
            okResponse<FetchAppointmentEncounterInfoResult>(
              encounterResponse({ appointmentStatus: 'f', startTimestamp: now.plus({ days: 1 }) }),
            ),
          ).as('encounterInfo');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/sticky-notes?patientId=10000000',
            },
            okResponse<UseGetStickyNotesForPatientsResult>({ stickyNotes: [] }),
          );

          cy.viewport(1500, 1500);

          cy.visit('/schedule/provider/session/100000082/meeting');
        });
      });

      describe('encounter starts today', () => {
        beforeEach(() => {
          const fixture = setupProviderFixutre1({ timezone, now });

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/patients/10000000/history?*',
            },
            okResponse(historyResponse),
          ).as('patientHistory');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/appointment-encounter/info?appointmentId=100000082',
            },
            okResponse<FetchAppointmentEncounterInfoResult>(
              encounterResponse({ appointmentStatus: 'f', startTimestamp: now.startOf('day') }),
            ),
          ).as('encounterInfo');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/sticky-notes?patientId=10000000',
            },
            okResponse<UseGetStickyNotesForPatientsResult>({ stickyNotes: [] }),
          );

          cy.viewport(1500, 1500);

          cy.visit('/schedule/provider/session/100000082/meeting');
        });

        // TODO: clicking collapsible items doesn't work?
        it.skip('should dislpay collapsible items', () => {
          EncounterPage.encounterCollapsibleItems
            .sessionHistory()
            .should('exist')
            .should('not.be.disabled');
        });

        it('should not show any groups other than member details', () => {
          EncounterPage.chartingGroups.memberDetails().should('exist');
          EncounterPage.chartingGroups.assessment().should('not.exist');
          EncounterPage.chartingGroups.treatmentPlan().should('not.exist');
          EncounterPage.chartingGroups.encounterCloseout().should('not.exist');
        });

        it('should PUT start encounter when "Start visit" button clicked', () => {
          cy.intercept(
            {
              method: 'POST',
              url: '/telenutrition/api/v1/appointment-encounter/create',
            },
            okResponse({}),
          ).as('createEncounter');

          EncounterPage.startEncounterButton().click();

          cy.wait('@createEncounter').then((interception) => {
            const body = interception.request.body;
            expect(body).to.deep.equal({
              appointmentId: 100000082,
              chartingData: {},
            });
          });
        });
      });
    });

    describe('After encounter has started', () => {
      describe('For encounter that does not need oversight', () => {
        beforeEach(() => {
          const fixture = setupProviderFixutre1({ timezone, now });

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/patients/10000000/history?*',
            },
            okResponse(historyResponse),
          ).as('patientHistory');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/appointment-encounter/info?appointmentId=100000082',
            },
            okResponse<FetchAppointmentEncounterInfoResult>(
              encounterResponse({ appointmentStatus: '2', startTimestamp: now }),
            ),
          ).as('encounterInfo');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/sticky-notes?patientId=10000000',
            },
            okResponse<UseGetStickyNotesForPatientsResult>({ stickyNotes: [] }),
          );

          cy.viewport(1500, 1500);

          cy.visit('/schedule/provider/session/100000082/meeting');
        });

        describe('Showing previous answers in-line', () => {
          it('should show 4 previous answer boxes', () => {
            cy.getByDataTestId('charting-prev-answer').should('have.length', 4);

            cy.getByDataTestId('widget-question-main_reason').within(() => {
              cy.getByDataTestId('charting-prev-answer').should(
                'contain.text',
                'I want to improve my general wellness',
              );

              cy.getByDataTestId('dismiss-prev-answer-button').click();
              cy.getByDataTestId('charting-prev-answer').should('not.exist');
            });

            cy.getByDataTestId('charting-prev-answer').should('have.length', 3);

            cy.getByDataTestId('widget-question-food_sensitivity_intolerance').within(() => {
              cy.getByDataTestId('charting-prev-answer').should(
                'contain.text',
                'Yes: Histamine Intolerance; Non-celiac Gluten Sensitivity',
              );

              cy.getByDataTestId('fill-prev-answer-button').click();
              cy.getByDataTestId('charting-prev-answer').should('have.attr', 'data-test', 'filled');

              cy.getByDataTestId('tag-input-badge').should('have.length', 2);
            });

            cy.getByDataTestId('charting-prev-answer').should('have.length', 3);

            cy.getByDataTestId('widget-question-grocery_payment_method').within(() => {
              cy.getByDataTestId('charting-prev-answer').should(
                'contain.text',
                'Cash; Credit Card; Check; Debit Card',
              );

              cy.getByDataTestId('fill-prev-answer-button').click();
              cy.getByDataTestId('charting-prev-answer').should('have.attr', 'data-test', 'filled');

              cy.get('div > [data-state="checked"]').should('have.length', 4);
            });

            cy.getByDataTestId('widget-question-household_food_adequacy_last_12_months').within(
              () => {
                cy.getByDataTestId('charting-prev-answer').should(
                  'contain.text',
                  'Sometimes not enough to eat',
                );

                cy.getByDataTestId('fill-prev-answer-button').click();
                cy.getByDataTestId('charting-prev-answer').should(
                  'have.attr',
                  'data-test',
                  'filled',
                );

                cy.getByDataTestId(
                  'radio-option-household_food_adequacy_last_12_months-sometimes_not_enough',
                )
                  .should('exist')
                  .should('have.attr', 'data-state', 'checked');
              },
            );

            cy.intercept(
              {
                method: 'PUT',
                url: '/telenutrition/api/v1/appointment-encounter/1000022/save',
              },
              okResponse({}),
            ).as('saveEncounter');

            cy.getByDataTestId('save-and-close-encounter-button').click();

            EncounterPage.modal().within(() => {
              cy.get('button').contains('Done').click();
            });

            cy.wait('@saveEncounter').then((interception) => {
              const body = interception.request.body;
              expect(body).to.deep.equal({
                chartingData: {
                  food_sensitivity_intolerance: [
                    'non_celiac_gluten_sensitivity',
                    'histamine_intolerance',
                  ],
                  grocery_payment_method: {
                    cash: true,
                    credit_card: true,
                    check: true,
                    debit_card: true,
                  },
                  household_food_adequacy_last_12_months: 'sometimes_not_enough',
                  // not sure why this is here
                  pes_statement: {},
                },
              });
            });
          });
        });

        it('should show all groups', () => {
          EncounterPage.chartingGroups.memberDetails().should('exist');
          EncounterPage.chartingGroups.assessment().should('exist');
          EncounterPage.chartingGroups.treatmentPlan().should('exist');
          EncounterPage.chartingGroups.encounterCloseout().should('exist');
        });

        it('should have expected required fields', () => {
          const expectedRequiredWidgets = [
            'widget-question-member_details_confirmed',
            'widget-question-start_time',
            'widget-question-main_reason',
            'widget-question-medical_conditions',
            'widget-question-medications_list',
            'widget-question-pes_statement-input-nutrition_diagnosis',
            'widget-question-pes_statement-input-related_to',
            'widget-question-pes_statement-input-signs_and_symptoms',
            'widget-question-member_expressed_understanding_of_education',
            'widget-question-member_felt_confident_in_ability_to_meet_goals',
            'widget-question-end_time',
            'widget-question-units_billed',
            'widget-question-cpt_code',
            'widget-question-diagnosis_code',
            'widget-question-note_to_member',
          ];

          const values: string[] = [];
          const requiredWidgets = cy.get('[data-cy="required"]');

          requiredWidgets.should('have.length', expectedRequiredWidgets.length);

          requiredWidgets
            .each((el) => {
              const dataTestId = el.attr('data-testid');
              if (dataTestId) values.push(dataTestId);
            })
            .then(() => {
              expect(expectedRequiredWidgets.length).to.equal(values.length);
              expect(values).to.deep.equal(expectedRequiredWidgets);
            });

          EncounterPage.byDataTestId('member_details_confirmed-checkbox').click();
          EncounterPage.byDataTestId('start_time-input').type('14:30');
          EncounterPage.byDataTestId('radio-option-main_reason-general_wellness').click();
          EncounterPage.byDataTestId('radio-option-medical_conditions-no').click();
          EncounterPage.byDataTestId('radio-option-medications_list-no').click();

          EncounterPage.byDataTestId('widget-question-pes_statement-input-nutrition_diagnosis')
            .find('input')
            .type('Increased energy expenditure{enter}', { force: true });
          EncounterPage.byDataTestId('widget-question-pes_statement-input-related_to')
            .find('input')
            .type('Wound healing{enter}', { force: true });
          EncounterPage.byDataTestId('widget-question-pes_statement-input-signs_and_symptoms')
            .find('textarea')
            .type('Some free text here...');

          EncounterPage.byDataTestId(
            'radio-option-member_expressed_understanding_of_education-no',
          ).click();
          EncounterPage.byDataTestId(
            'radio-option-member_felt_confident_in_ability_to_meet_goals-yes',
          ).click();
          EncounterPage.byDataTestId('widget-question-intervention_notes')
            .find('textarea')
            .type('Test intervention notes.');

          EncounterPage.finalizeEncounterButton().click();

          // Shouldn't show modal if required fields not all filled.
          EncounterPage.modal().should('not.exist');

          EncounterPage.byDataTestId('units_billed-input').type('3');
          EncounterPage.byDataTestId('end_time-input').type('14:50');
          EncounterPage.byDataTestId('cpt_code-input').type('97802{enter}', { force: true });
          EncounterPage.byDataTestId('diagnosis_code-input').type('Z71.3{enter}', { force: true });
          EncounterPage.byDataTestId('note_to_member-input').type('Test note to member.');

          cy.intercept(
            {
              method: 'PUT',
              url: '/telenutrition/api/v1/appointment-encounter/1000022/submit',
            },
            okResponse({}),
          ).as('submitEncounter');

          EncounterPage.finalizeEncounterButton().click();

          EncounterPage.modal()
            .should('exist')
            .within(() => {
              EncounterPage.byDataTestId('radio-option-action-FinalizeAndSubmitToBilling').click();
              EncounterPage.byDataTestId('confirm-checkbox').click();
              cy.get('button').contains('Submit').click();
            });

          cy.wait('@submitEncounter').then((interception) => {
            const body = interception.request.body;

            const res = {
              chartingData: {
                cpt_code: '97802',
                diagnosis_code: 'Z71.3',
                end_time: '14:50',
                intervention_notes: 'Test intervention notes.',
                main_reason: 'general_wellness',
                medical_conditions: null,
                medications_list: null,
                member_details_confirmed: true,
                member_expressed_understanding_of_education: 'no',
                member_felt_confident_in_ability_to_meet_goals: 'yes',
                note_to_member: 'Test note to member.',
                pes_statement: {
                  nutrition_diagnosis: 'increased_energy_expenditure',
                  related_to: 'wound_healing',
                  signs_and_symptoms: 'Some free text here...',
                },
                start_time: '14:30',
                units_billed: '3',
              },
            };

            expect(body).to.deep.equal(res);
          });
        });

        it('should allow entering all fields and have correct payload when submitted', () => {
          cy.get('[data-testid*="widget-question"]').should('have.length', 63);

          fillOutFullChart();

          cy.intercept(
            {
              method: 'PUT',
              url: '/telenutrition/api/v1/appointment-encounter/1000022/submit',
            },
            okResponse({}),
          ).as('submitEncounter');

          EncounterPage.finalizeEncounterButton().click();

          EncounterPage.modal()
            .should('exist')
            .within(() => {
              EncounterPage.byDataTestId('radio-option-action-FinalizeAndSubmitToBilling').click();
              EncounterPage.byDataTestId('confirm-checkbox').click();
              cy.get('button').contains('Submit').click();
            });

          cy.wait('@submitEncounter').then((interception) => {
            const body = interception.request.body;

            expect(body).to.deep.equal({ chartingData: res1chartingData });
          });
        });

        it('should have correct payload when removing fields', () => {
          cy.get('[data-testid*="widget-question"]').should('have.length', 63);

          fillOutFullChart();

          EncounterPage.byDataTestId('radio-option-medications_list-no').click();
          EncounterPage.byDataTestId('widget-question-blood_pressure_systolic')
            .find('input')
            .eq(0)
            .clear();
          EncounterPage.byDataTestId('widget-question-blood_pressure_systolic')
            .find('input')
            .eq(1)
            .clear();

          cy.intercept(
            {
              method: 'PUT',
              url: '/telenutrition/api/v1/appointment-encounter/1000022/submit',
            },
            okResponse({}),
          ).as('submitEncounter');

          EncounterPage.finalizeEncounterButton().click();

          EncounterPage.modal()
            .should('exist')
            .within(() => {
              EncounterPage.byDataTestId('radio-option-action-FinalizeAndSubmitToBilling').click();
              EncounterPage.byDataTestId('confirm-checkbox').click();
              cy.get('button').contains('Submit').click();
            });

          cy.wait('@submitEncounter').then((interception) => {
            const body = interception.request.body;

            expect(body).to.deep.equal({
              chartingData: {
                ...res1chartingData,
                medications_list: null,
                blood_pressure_systolic: null,
              },
            });
          });
        });

        it('should remove conditional pregnancy fields from formData if pregnancy is unchecked', () => {
          // todo
        });

        it('should submit correct data if populated on generation from a past-encounter', () => {
          // todo
        });
      });

      describe('For encounter that needs oversight', () => {
        beforeEach(() => {
          const fixture = setupProviderFixutre1({ timezone, now });

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/patients/10000000/history?*',
            },
            okResponse(historyResponse),
          ).as('patientHistory');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/appointment-encounter/info?appointmentId=100000082',
            },
            okResponse<FetchAppointmentEncounterInfoResult>(
              encounterResponse({
                appointmentStatus: '2',
                startTimestamp: now,
                oversightRequired: true,
              }),
            ),
          ).as('encounterInfo');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/sticky-notes?patientId=10000000',
            },
            okResponse<UseGetStickyNotesForPatientsResult>({ stickyNotes: [] }),
          );

          cy.viewport(1500, 1500);

          cy.visit('/schedule/provider/session/100000082/meeting');
        });

        it('should have finalize button disabled and send to oversight button enabled', () => {
          cy.get('[data-testid*="widget-question"]').should('have.length', 63);

          fillOutFullChart();

          cy.intercept(
            {
              method: 'PUT',
              url: '/telenutrition/api/v1/appointment-encounter/1000022/submit',
            },
            okResponse({}),
          ).as('submitEncounter');

          EncounterPage.finalizeEncounterButton().click();

          EncounterPage.modal()
            .should('exist')
            .within(() => {
              EncounterPage.byDataTestId('radio-option-action-FinalizeAndSubmitToBilling').should(
                'be.disabled',
              );
              EncounterPage.byDataTestId('radio-option-action-SendToMdOversight')
                .should('be.enabled')
                .click();
              EncounterPage.byDataTestId('confirm-checkbox').click();
              cy.get('button').contains('Submit').click();
            });

          cy.wait('@submitEncounter').then((interception) => {
            const body = interception.request.body;

            expect(body).to.deep.equal({ chartingData: res1chartingData });
          });
        });
      });

      describe('For appointmentStatus "3", encounterStatus "oversight", oversightStatus "provider_response_required" and oversight comment', () => {
        const oversightComment = 'This is an oversight comment';
        const oversightBy = 'Dr. Axe';
        const oversightAt = now.minus({ days: 1 });

        beforeEach(() => {
          const fixture = setupProviderFixutre1({ timezone, now });

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/patients/10000000/history?*',
            },
            okResponse(historyResponse),
          ).as('patientHistory');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/appointment-encounter/info?appointmentId=100000082',
            },
            okResponse<FetchAppointmentEncounterInfoResult>(
              encounterResponse({
                appointmentStatus: '3',
                startTimestamp: now,
                oversightRequired: true,
                encounterStatus: EncounterStatus.Oversight,
                oversightStatus: EncounterOversightStatus.ProviderResponseRequired,
                rawData: res1chartingData,
                oversight: {
                  comment: oversightComment,
                  at: oversightAt,
                  by: oversightBy,
                },
              }),
            ),
          ).as('encounterInfo');

          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/provider/sticky-notes?patientId=10000000',
            },
            okResponse<UseGetStickyNotesForPatientsResult>({ stickyNotes: [] }),
          );

          cy.viewport(1500, 1500);

          cy.visit('/schedule/provider/session/100000082/meeting');
        });

        it('should allow viewing the charting page', () => {
          cy.url().should('include', '/schedule/provider/session/100000082/meeting');
        });

        it('should show the oversight bar and open modal to show comment', () => {
          cy.getByDataTestId('oversight-review-banner')
            .should('exist')
            .within(() => {
              cy.get('button').click();
            });

          EncounterPage.modal()
            .should('exist')
            .within(() => {
              cy.get('p').contains(oversightComment).should('exist');
              cy.get('p').contains(oversightBy).should('exist');
              cy.get('p').contains(oversightAt.toFormat('LLLL d yyyy')).should('exist');

              cy.get('button').contains('Close').click();
            });

          EncounterPage.modal().should('not.exist');
        });

        it('should hit resubmit endpoint with correct payload', () => {
          cy.intercept(
            {
              method: 'PUT',
              url: '/telenutrition/api/v1/appointment-encounter/1000022/resubmit',
            },
            okResponse({}),
          ).as('resubmitEncounter');

          EncounterPage.finalizeEncounterButton().click();
          EncounterPage.modal()
            .should('exist')
            .within(() => {
              EncounterPage.byDataTestId('radio-option-action-FinalizeAndSubmitToBilling').should(
                'be.disabled',
              );
              EncounterPage.byDataTestId('radio-option-action-SendToMdOversight')
                .should('not.be.disabled')
                .click();
              EncounterPage.byDataTestId('confirm-checkbox').click();
              cy.get('button').contains('Submit').click();
            });

          cy.wait('@resubmitEncounter').then((interception) => {
            const body = interception.request.body;

            expect(body).to.deep.equal({ chartingData: res1chartingData });
          });
        });
      });
    });

    describe('After encounter has been finalized', () => {
      beforeEach(() => {
        const fixture = setupProviderFixutre1({ timezone, now });

        cy.intercept(
          {
            method: 'GET',
            url: '/telenutrition/api/v1/appointment-encounter/info?appointmentId=100000082',
          },
          okResponse<FetchAppointmentEncounterInfoResult>(
            encounterResponse({
              appointmentStatus: '3',
              startTimestamp: now.plus({ days: 2 }),
              encounterStatus: EncounterStatus.Closed,
            }),
          ),
        ).as('encounterInfo');

        cy.viewport(1500, 1500);
      });

      describe('before an amendment is requested', () => {
        beforeEach(() => {
          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/appointment-encounter/1000022/amendments',
            },
            okResponse({ amendments: [] }),
          );
          cy.visit('/schedule/provider/session/100000082/meeting');
        });

        it('should redirect to display page if appointment status is 3', () => {
          cy.url().should('include', '/schedule/provider/session/100000082/details');
        });

        it('should display all correct visit data in sidebar', () => {
          EncounterPage.byDataTestId('visit-charting-visit-date')
            .contains('May 15, 2024')
            .should('exist');
          EncounterPage.byDataTestId('visit-charting-visit-id')
            .contains('100000082')
            .should('exist');
          EncounterPage.byDataTestId('visit-charting-visit-type')
            .contains('Audio Only Follow Up 60')
            .should('exist');
          EncounterPage.byDataTestId('visit-charting-visit-duration')
            .contains('60')
            .should('exist');
          EncounterPage.byDataTestId('visit-charting-visit-connection')
            .contains('Audio only')
            .should('exist');
          
          EncounterPage.byDataTestId('visit-charting-start-time')
            .should('be.visible');
          
          EncounterPage.byDataTestId('visit-charting-start-time')
            .contains('8:02 AM')
            .should('exist');
            
          EncounterPage.byDataTestId('visit-charting-end-time').contains('8:35 AM').should('exist');
          EncounterPage.byDataTestId('visit-charting-duration')
            .contains('33 minutes')
            .should('exist');
          EncounterPage.byDataTestId('visit-charting-units-billed').contains('4').should('exist');
          EncounterPage.byDataTestId('visit-charting-cpt-code').contains('99212').should('exist');

          EncounterPage.byDataTestId('request-billing-edit-button').click();

          EncounterPage.modal()
            .should('exist')
            .within(() => {
              EncounterPage.byDataTestId('unitsBilled-input').should('have.value', '4');
              EncounterPage.byDataTestId('billingCode-input').should('have.value', '99212');
              EncounterPage.byDataTestId('reason-input').should('have.value', '');
              EncounterPage.byDataTestId('comments-input').should('have.value', '');

              EncounterPage.byDataTestId('unitsBilled-input').clear().type('6');
              EncounterPage.byDataTestId('billingCode-input').clear().type('97802{enter}');
              EncounterPage.byDataTestId('reason-input').clear().type('technical{enter}');
              EncounterPage.byDataTestId('comments-input').type('Some comment here');

              cy.intercept(
                {
                  method: 'POST',
                  path: '/telenutrition/api/v1/appointment-encounter/1000022/amend',
                },
                okResponse({}),
              ).as('postAmendment');

              cy.get('form').submit();

              cy.wait('@postAmendment').then((interception) => {
                const body = interception.request.body;

                expect(body).to.deep.equal({
                  unitsBilled: '6',
                  cptCode: '97802',
                  reason: 'technical_error',
                  comments: 'Some comment here',
                });
              });
            });

          EncounterPage.modal().should('not.exist');
        });
      });

      describe('before an amendment is request', () => {
        beforeEach(() => {
          cy.intercept(
            {
              method: 'GET',
              url: '/telenutrition/api/v1/appointment-encounter/1000022/amendments',
            },
            okResponse({
              amendments: [
                {
                  amendmentId: 9,
                  encounterId: 22,
                  unitsBilled: 3,
                  billingCode: '99215',
                  reason: 'technical_error',
                  status: 'pending',
                  createdAt: '2024-11-04T14:01:13.818317',
                },
                {
                  amendmentId: 8,
                  encounterId: 22,
                  unitsBilled: 5,
                  billingCode: '99215',
                  reason: 'duration_unit_error',
                  status: 'approved',
                  createdAt: '2024-11-04T13:58:10.728039',
                },
              ],
            }),
          );
          cy.visit('/schedule/provider/session/100000082/meeting');
        });

        it('should have two amendment entries', () => {
          EncounterPage.byDataTestId('encounter-amendment-item').should('have.length', 2);
        });
      });
    });
  });
});
