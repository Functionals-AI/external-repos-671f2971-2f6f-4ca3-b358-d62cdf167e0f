import { DateTime } from 'luxon';
import {
  setupProviderFixutre1,
  setupProvidersForSchedulingAppointments,
} from '../../mocks/provider-fixture-1';
import { okResponse } from '../../mocks/responses';
import { FetchProviderPatientAppointmentsReturn } from 'api/provider/useFetchProviderPatientAppointments';
import { createAppointmentRecord } from '../../mocks/provider-fixture-1/appointment';

const PATIENT_ID = 917460;

function runScheduleWithOtherKnownTests(timezone: string) {
  const now = DateTime.fromFormat('05/13/2024', 'LL/dd/yyyy', { zone: timezone })
    .startOf('day')
    .plus({ hour: 10 });

  const scheduledAppointmentDate = DateTime.fromFormat('05/23/2024', 'LL/dd/yyyy', {
    zone: timezone,
  });

  describe(`Timezone: ${timezone} -> Provider Connect -> Patient Thorough Scheduling`, () => {
    beforeEach(() => {
      cy.turnOnFeatureFlag('thorough_scheduling_flow_ENG_1629');
      const fixture = setupProviderFixutre1({ timezone, now });
      setupProvidersForSchedulingAppointments({ timezone, now, patientTimezone: timezone });
      cy.clock(now.toJSDate(), ['Date']);

      cy.visit('/schedule/provider/patients');

      cy.intercept(
        {
          url: `/telenutrition/api/v1/provider/patients/${PATIENT_ID}/appointments`,
          method: 'GET',
        },
        okResponse<FetchProviderPatientAppointmentsReturn>({
          appointments: [
            {
              appointment: createAppointmentRecord({
                dateTime: scheduledAppointmentDate,
                provider: fixture.provider,
              }),
            },
          ],
        }),
      );

      cy.get('[data-testid="table-expander-button"]').first().click();
      cy.get('[data-testid="table-expander-button"]').eq(1).click();
      cy.get('[data-testid="schedule-sessions-button"]').click();
      cy.get('[data-testid="radio-option-scheduleOption-OTHER"]').click();
      cy.get('[data-testid="radio-option-scheduleOtherSubOption-KNOWN_PROVIDER"]').click();
      cy.get('button').contains('Next').click();
    });

    describe('with other known', () => {
      it('should display available slots for provider', () => {
        cy.get('[data-testid="providerId-input"]').click();
        cy.get('[data-cy="combobox-option"][data-test="enabled"]').should('have.length', 3);
        cy.get('[data-cy="combobox-option"][data-test="enabled"]')
          .contains('Provider Novicki')
          .click();
        let dateLabel = now.toLocaleString(DateTime.DATE_SHORT);
        let timeLabel = now.toLocaleString(DateTime.TIME_SIMPLE);
        cy.get(`[data-testid="${dateLabel}"]`).click();
        cy.get(`[data-testid="option-${timeLabel}"]`).should('exist');

        const day2 = now.plus({ day: 1, hour: 2 });
        dateLabel = day2.toLocaleString(DateTime.DATE_SHORT);
        timeLabel = day2.toLocaleString(DateTime.TIME_SIMPLE);

        cy.get(`[data-testid="${dateLabel}"]`).click();
        cy.get(`[data-testid="option-${timeLabel}"]`).should('exist');

        cy.get('[data-testid="providerId-input"]').click();
        cy.get('[data-cy="combobox-option"][data-test="enabled"]')
          .contains('Provider Meowmeowbobo')
          .click();

        dateLabel = now.toLocaleString(DateTime.DATE_SHORT);
        timeLabel = now.toLocaleString(DateTime.TIME_SIMPLE);
        cy.get(`[data-testid="${dateLabel}"]`).click();
        cy.get(`[data-testid="option-${timeLabel}"]`).should('exist');
      });

      it('should be able to schedule with another provider', () => {
        const PATIENT_ID = 917460;

        cy.get('[data-testid="providerId-input"]').click();
        cy.get('[data-cy="combobox-option"][data-test="enabled"]').should('have.length', 3);
        cy.get('[data-cy="combobox-option"][data-test="enabled"]')
          .contains('Provider Novicki')
          .click();

        const dateLabel = now.toLocaleString(DateTime.DATE_SHORT);
        const timeLabel = now.toLocaleString(DateTime.TIME_SIMPLE);
        cy.get(`[data-testid="${dateLabel}"]`).click();
        cy.get(`[data-testid="option-${timeLabel}"]`).click();
        cy.get('button').contains('Next').click();

        cy.get('[data-test="content"]').contains('Provider Novicki').should('exist');

        const confirmDateLabel = now.toLocaleString(DateTime.DATE_FULL);
        const confirmTimeLabel = now.toFormat('h:mma ZZZZ').replace('AM', 'am');
        cy.get('[data-testid="confirm-time"]').contains(confirmDateLabel).should('exist');
        cy.get('[data-testid="data-display"]').contains(confirmTimeLabel).should('exist');

        cy.intercept('POST', '/telenutrition/api/v1/provider/appointments', okResponse({})).as(
          'book-appointment',
        );
        cy.get('button').contains('Finish').click();
        cy.wait('@book-appointment')
          .its('request.body.state')
          .should('contain', {
            patient_id: PATIENT_ID,
            audio_only: true,
          })
          .its('appointment_ids')
          .should('be.an', 'array')
          .should('have.length', 2);
      });

      it('should not allow selected day in the past', () => {
        cy.get('[data-testid="providerId-input"]').click();
        cy.get('[data-cy="combobox-option"][data-test="enabled"]').should('have.length', 3);
        cy.get('[data-cy="combobox-option"][data-test="enabled"]')
          .contains('Provider Novicki')
          .click();

        const dateLabel = now.minus({ day: 1 }).toLocaleString(DateTime.DATE_SHORT);
        cy.get(`[data-testid="${dateLabel}"]`).should('be.disabled');
      });

      it('should disabled 6 days before and after scheduled appointment', () => {
        cy.get('[data-testid="providerId-input"]').click();
        cy.get('[data-cy="combobox-option"][data-test="enabled"]').should('have.length', 3);
        cy.get('[data-cy="combobox-option"][data-test="enabled"]')
          .contains('Provider Novicki')
          .click();

        function testDate(date: string, shouldBeDisabled: boolean) {
          cy.get(`[data-testid="${date}"]`).should(
            shouldBeDisabled ? 'be.disabled' : 'not.be.disabled',
          );
        }
        testDate('5/18/2024', false);
        cy.getByDataTestId('week-picker-nav-next-week').click();
        testDate('5/19/2024', true);
        testDate('5/20/2024', true);
        testDate('5/21/2024', true);
        testDate('5/22/2024', true);
        testDate('5/23/2024', true);
        testDate('5/24/2024', true);

        testDate('5/25/2024', true);
        cy.getByDataTestId('week-picker-nav-next-week').click();
        testDate('5/26/2024', false);
        testDate('5/27/2024', false);
      });
    });
  });
}

runScheduleWithOtherKnownTests('America/New_York');
runScheduleWithOtherKnownTests('Pacific/Honolulu');
