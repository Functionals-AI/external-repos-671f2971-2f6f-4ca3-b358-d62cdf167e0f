import { DateTime } from 'luxon';
import {
  setupProviderFixutre1,
  setupProvidersForSchedulingAppointments,
} from '../../mocks/provider-fixture-1';
import { okResponse } from '../../mocks/responses';
import { FetchProviderMeResult } from '../../../src/api/provider/useFetchProviderMe';
import { FetchProviderPatientAppointmentsReturn } from 'api/provider/useFetchProviderPatientAppointments';
import { createAppointmentRecord } from '../../mocks/provider-fixture-1/appointment';

const PATIENT_ID = 917460;

function runRescheduleWithSelfTests(timezone: string) {
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
        {
          url: '/telenutrition/api/v1/provider/me',
          method: 'GET',
        },
        okResponse<FetchProviderMeResult>({
          provider: fixture.provider,
          licenseSummary: { applications: [], licenses: [] },
          features: {
            canScheduleOverbookSlots: true,
          },
          intercomHash: 'fake',
        }),
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

      cy.intercept(
        { method: 'GET', url: '/telenutrition/api/v1/provider/sticky-notes?*' },
        okResponse({ stickyNotes: [] }),
      );

      cy.clock(now.toJSDate(), ['Date']);

      cy.visit('/schedule/provider/dashboard');
      cy.get('[data-test="8:00am"]').click();
      cy.get('button').contains('Reschedule').click();
      cy.get('[data-testid="radio-option-scheduleOption-SELF"]').click();
      cy.get('button').contains('Next').click();
    });

    describe('with other known', () => {
      it('should display available slots for provider', () => {
        let dateLabel = now.toLocaleString(DateTime.DATE_SHORT);
        let timeLabel = now.toLocaleString(DateTime.TIME_SIMPLE);
        cy.get(`[data-testid="${dateLabel}"]`).click();
        cy.get(`[data-testid="option-${timeLabel}"]`).should('exist');

        const day2 = now.plus({ day: 1, hour: 2 });
        dateLabel = day2.toLocaleString(DateTime.DATE_SHORT);
        timeLabel = day2.toLocaleString(DateTime.TIME_SIMPLE);

        cy.get(`[data-testid="${dateLabel}"]`).click();
        cy.get(`[data-testid="option-${timeLabel}"]`).should('exist');
      });

      it('should be able to reschedule with yourself', () => {
        const dateLabel = now.toLocaleString(DateTime.DATE_SHORT);
        const timeLabel = now.toLocaleString(DateTime.TIME_SIMPLE);
        cy.get(`[data-testid="${dateLabel}"]`).click();
        cy.get(`[data-testid="option-${timeLabel}"]`).click();
        cy.get('button').contains('Next').click();

        const confirmDateLabel = now.toLocaleString(DateTime.DATE_FULL);
        const confirmTimeLabel = now.toFormat('h:mma').replace('AM', 'am');
        cy.get('[data-testid="confirm-after"]').contains('Myself');
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

      it('should not allow selected day in the past', () => {
        const dateLabel = now.minus({ day: 1 }).toLocaleString(DateTime.DATE_SHORT);
        cy.get(`[data-testid="${dateLabel}"]`).should('be.disabled');
      });

      it('should disabled 6 days before and after scheduled appointment', () => {
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

runRescheduleWithSelfTests('America/New_York');
runRescheduleWithSelfTests('Pacific/Honolulu');
