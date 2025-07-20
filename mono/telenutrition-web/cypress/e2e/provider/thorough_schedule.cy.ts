import { DateTime } from 'luxon';
import { setupProviderFixutre1 } from '../../mocks/provider-fixture-1';
import { okResponse } from '../../mocks/responses';
import { FetchProviderPatientAppointmentsReturn } from 'api/provider/useFetchProviderPatientAppointments';

const PATIENT_ID = 917460;

function runScheduleWithSelfTests(timezone: string) {
  const now = DateTime.fromFormat('05/13/2024', 'LL/dd/yyyy', { zone: timezone })
    .startOf('day')
    .plus({ hour: 10, minutes: 25 });

  describe(`Timezone: ${timezone} -> Provider Connect -> Patient Thorough Scheduling`, () => {
    beforeEach(() => {
      cy.turnOnFeatureFlag('thorough_scheduling_flow_ENG_1629');
      const { providerHouseholds } = setupProviderFixutre1({ timezone, now });
      cy.clock(now.toJSDate(), ['Date']);

      cy.visit('/schedule/provider/patients');

      cy.intercept(
        {
          url: `/telenutrition/api/v1/provider/patients/${PATIENT_ID}/appointments`,
          method: 'GET',
        },
        okResponse<FetchProviderPatientAppointmentsReturn>({
          appointments: [],
        }),
      );

      cy.get('[data-testid="table-expander-button"]').first().click();
      cy.get('[data-testid="table-expander-button"]').eq(1).click();
      cy.get('[data-testid="schedule-sessions-button"]').click();
      cy.get('button').contains('Next').click();
    });

    describe('with self', () => {
      it('should show 3 60-minute open slots', () => {
        cy.get('[data-testid="available-60-cell"]').should(
          'have.length',
          3,
        );
      });

      it('should allow you to unfreeze slots', () => {
        const date = now.setZone(timezone).set({ weekday: 4, hour: 15, minute: 0 }); /*.toLocal();*/

        const CELL_TEST_ID = date.toFormat('cccc-T');

        cy.get(`[data-test="${CELL_TEST_ID}"]`).within(($el) => {
          cy.get('button').click({ force: true });
        });

        const dateDisplay = date.toFormat('LL/dd/yyyy');

        const confirmTimeLabel = date.toFormat('h:mma').replace('AM', 'am').replace('PM', 'pm');

        cy.get('[data-testid="date-confirm"]').contains(dateDisplay).should('exist');
        cy.get('[data-testid="time-confirm"]').contains(confirmTimeLabel).should('exist');

        cy.intercept(
          {
            method: 'POST',
            url: '/telenutrition/api/v1/provider/v2/slots/create',
          },
          okResponse({}),
        ).as('unfreeze-slot');

        cy.get('button').contains('Done').click();
        DateTime.now().setZone('America/New_York').offset - DateTime.now().setZone(timezone).offset;
        const expectedDateInTimezone = date.setZone(timezone).toJSDate().toISOString();

        cy.wait('@unfreeze-slot').its('request.body').should('deep.equal', {
          date: expectedDateInTimezone,
          duration: 60,
        });
      });

      it('should schedule single appointment', () => {
        cy.intercept(
          {
            method: 'POST',
            url: `/telenutrition/api/v1/provider/appointments/bulk`,
          },
          okResponse({
            errors: [],
          }),
        ).as('bookAppointments');

        const date = now.setZone(timezone).set({ weekday: 2, hour: 12, minute: 0 });

        const CELL_TEST_ID = date.toFormat('cccc-T');

        cy.get(`[data-test="${CELL_TEST_ID}"]`).within(($el) => {
          cy.get('button').click({ force: true });
        });
        cy.get('button').contains('Save').click();
        cy.get('button').contains('Next').click();

        cy.get('[data-testid="schedule-date"]').contains('14 May 2024').should('exist');

        cy.get('button').contains('Finish').click();

        cy.wait('@bookAppointments').then((interception) => {
          const body = interception.request.body;
          expect(body.cid).to.be.a('string');
          expect(body.appointments).to.have.length(1);
          expect(body.appointments[0].appointment_ids).to.have.length(2);
          expect(body.appointments[0].audio_only).to.be.true;
          expect(body.appointments[0].is_follow_up).to.be.true;
        });
      });

      it('should schedule recurring appointments', () => {
        cy.intercept(
          {
            method: 'POST',
            url: `/telenutrition/api/v1/provider/appointments/bulk`,
          },
          okResponse({
            errors: [],
          }),
        ).as('bookAppointments');

        const date = now.setZone(timezone).set({ weekday: 2, hour: 12, minute: 0 });

        //const CELL_TEST_ID = 'Tuesday-09:00';
        const CELL_TEST_ID = date.toFormat('cccc-T');

        cy.get(`[data-test="${CELL_TEST_ID}"]`).within(($el) => {
          cy.get('button').click({ force: true });
        });
        cy.get('[data-testid="isRepeating-checkbox"]').click();
        cy.get('[data-testid="repeatEveryNumWeeks-input"]').type('1');
        cy.get('[data-testid="repeatForNumSessions-input"]').type('2');
        cy.get('[data-testid="future-appointment-row"]').should('have.length', 2);
        cy.get('button').contains('Save').click();
        cy.get('button').contains('Next').click();

        cy.get('[data-testid=schedule-date').contains('14 May 2024').should('exist');
        cy.get('[data-testid=schedule-date').contains('21 May 2024').should('exist');
        cy.get('[data-testid=schedule-date').contains('28 May 2024').should('exist');

        cy.get('[data-testid="recurring-icon"]').should('have.length', 3);

        cy.get('button').contains('Finish').click();

        cy.wait('@bookAppointments').then((interception) => {
          const body = interception.request.body;
          expect(body.cid).to.be.a('string');
          expect(body.appointments).to.have.length(3);
          for (let i = 0; i < 3; i++) {
            expect(body.appointments[i].appointment_ids).to.have.length(2);
            expect(body.appointments[i].audio_only).to.be.true;
            expect(body.appointments[i].is_follow_up).to.be.true;
          }
        });
      });
    });
  });
}

runScheduleWithSelfTests('America/New_York');
runScheduleWithSelfTests('Pacific/Honolulu');
