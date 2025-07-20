import { DateTime } from 'luxon';
import {
  setupProviderFixutre1,
  setupProvidersForSchedulingAppointments,
} from '../../mocks/provider-fixture-1';
import { okResponse } from '../../mocks/responses';
import { FetchProviderPatientAppointmentsReturn } from 'api/provider/useFetchProviderPatientAppointments';
import BasePage from '../../pages/base';
import { createAppointmentRecord } from '../../mocks/provider-fixture-1/appointment';

const PATIENT_ID = 917460;

function runRescheduleWithOtherKnownTests(timezone: string) {
  const now = DateTime.fromFormat('05/13/2024', 'LL/dd/yyyy', { zone: timezone })
    .startOf('day')
    .plus({ hour: 10, minutes: 25 });
  const scheduledAppointmentDate = DateTime.fromFormat('05/23/2024', 'LL/dd/yyyy', {
    zone: timezone,
  });

  describe(`Timezone: ${timezone} -> Provider Connect -> Patient Thorough Rescheduling`, () => {
    beforeEach(() => {
      cy.turnOnFeatureFlag('thorough_scheduling_flow_ENG_1629');
      Cypress.on('uncaught:exception', (err) => {
        if (err.message.includes('ResizeObserver loop completed with undelivered notifications')) {
          return false;
        }
      });
      const fixture = setupProviderFixutre1({ timezone, now });
      setupProvidersForSchedulingAppointments({ timezone, now, patientTimezone: timezone });

      cy.intercept(
        { method: 'GET', url: '/telenutrition/api/v1/provider/sticky-notes?*' },
        okResponse({ stickyNotes: [] }),
      );

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

      cy.clock(now.toJSDate(), ['Date']);

      cy.visit('/schedule/provider/dashboard');
      cy.get('[data-test="8:00am"]').click();
      cy.get('button').contains('Reschedule').click();
      cy.get('[data-testid="radio-option-scheduleOption-OTHER"]').click();
      cy.get('[data-testid="radio-option-scheduleOtherSubOption-ANY_OTHER_PROVIDER"]').click();
      cy.get('button').contains('Next').click();
    });

    describe('with other unknown', () => {
      it('should display available slots for provider', () => {
        let dateLabel;
        dateLabel = now.toFormat('LL/dd/yyyy');
        cy.get(`[data-testid="date-input"]`).type(dateLabel);

        cy.get('[data-testid="provider-slot"]').contains('Provider Novicki').should('exist');
        cy.get('[data-testid="provider-slot"]').contains('Provider Meowmeowbobo').should('exist');

        cy.get('[data-testid="time-slot-option"]').should('have.length', 2);

        const day2 = now.plus({ day: 1, hour: 2 });
        dateLabel = day2.toFormat('LL/dd/yyyy');
        cy.get(`[data-testid="date-input"]`).clear().type(dateLabel);
        cy.get('[data-testid="provider-slot"]').contains('Provider Novicki').should('exist');
        cy.get('[data-testid="provider-slot"]')
          .contains('Provider Meowmeowbobo')
          .should('not.exist');

        cy.get('[data-testid="time-slot-option"]').should('have.length', 1);
      });

      it('should be able to reschedule with yourself', () => {
        let dateLabel;
        dateLabel = now.toFormat('LL/dd/yyyy');
        cy.get(`[data-testid="date-input"]`).type(dateLabel);

        cy.get('[data-testid="provider-slot"]').contains('Provider Novicki').should('exist');
        cy.get('[data-testid="provider-slot"]').contains('Provider Meowmeowbobo').should('exist');

        cy.get('[data-testid="time-slot-option"]').first().click();

        cy.get('button').contains('Next').click();

        const confirmDateLabel = now.toLocaleString(DateTime.DATE_FULL);
        const confirmTimeLabel = now.toFormat('h:mma').replace('AM', 'am');
        cy.get('[data-testid="confirm-after"]').contains('Provider Novicki');
        cy.get('[data-testid="confirm-after"]').contains(confirmDateLabel).should('exist');
        cy.get('[data-testid="confirm-after"]').contains(confirmTimeLabel).should('exist');

        cy.get('[data-testid="cancelReason-input"]').click();
        cy.get('[data-testid="combobox-option-PATIENT_NO_SHOW"]').click();

        cy.get('[data-testid="confirmMemberInformed-checkbox"]').click();

        cy.intercept(
          'PUT',
          '/telenutrition/api/v1/scheduling/appointments/reschedule',
          okResponse({}),
        ).as('reschedule-appointment');
        cy.get('button').contains('Finish').click();
        cy.wait('@reschedule-appointment').then((interception) => {
          const body = interception.request.body;
          expect(body).to.contain({
            cancelReason: 'PATIENT_NO_SHOW',
          });
          expect(body.oldAppointmentId).to.be.a('number');
          expect(body.newAppointmentIds).to.be.an('array').and.have.length(2);
        });
      });

      it('should not allow rescheduling before today by typing', () => {
        const dateLabel = now.minus({ day: 1 }).toFormat('LL/dd/yyyy');
        cy.get(`[data-testid="date-input"]`).type(dateLabel);

        cy.getByDataTestId('form-item-error-date')
          .should('exist')
          .should('contain.text', 'Minimum date is 05/13/2024');
      });

      it('should not allow rescheduling before today by selecting on calendar', () => {
        const dateLabel = now.minus({ day: 1 }).toFormat('LL/dd/yyyy');

        BasePage.modal().within(() => {
          cy.get('button[data-testid="popover-trigger"]').click({ force: true });
        });
        cy.getByDataTestId('date-picker-popover').within(() => {
          cy.get('[data-day="2024-05-12"]').should('have.attr', 'data-hidden', 'true');
        });
      });

      it('should not allow rescheduling disabled dates on calendar', () => {
        BasePage.modal().within(() => {
          cy.get('button[data-testid="popover-trigger"]').click({ force: true });
        });
        cy.getByDataTestId('date-picker-popover').within(() => {
          cy.get('[data-day="2024-05-18"]').should('not.have.attr', 'data-hidden');
          cy.get('[data-day="2024-05-19"]').should('have.attr', 'data-hidden', 'true');
          cy.get('[data-day="2024-05-20"]').should('have.attr', 'data-hidden', 'true');
          cy.get('[data-day="2024-05-21"]').should('have.attr', 'data-hidden', 'true');
          cy.get('[data-day="2024-05-22"]').should('have.attr', 'data-hidden', 'true');
          cy.get('[data-day="2024-05-23"]').should('have.attr', 'data-hidden', 'true');
          cy.get('[data-day="2024-05-24"]').should('have.attr', 'data-hidden', 'true');
          cy.get('[data-day="2024-05-25"]').should('have.attr', 'data-hidden', 'true');
          cy.get('[data-day="2024-05-26"]').should('not.have.attr', 'data-hidden');
        });
      });
    });
  });
}

runRescheduleWithOtherKnownTests('America/New_York');
runRescheduleWithOtherKnownTests('Pacific/Honolulu');
