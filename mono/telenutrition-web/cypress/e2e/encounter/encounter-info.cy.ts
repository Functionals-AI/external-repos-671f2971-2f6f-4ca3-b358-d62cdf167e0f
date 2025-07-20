import { DateTime } from 'luxon';
import { okResponse } from '../../mocks/responses';
import { setupProviderFixutre1 } from '../../mocks/provider-fixture-1';
import { historyResponse } from '../../mocks/history';
import { FetchAppointmentEncounterInfoResult } from 'api/encounter/useFetchAppointmentEncounterInfo';
import { encounterResponse } from '../../mocks/encounter-1';
import { UseGetStickyNotesForPatientsResult } from 'api/provider/useGetStickyNotesForPatient';

const timezone = 'US/Pacific';

const now = DateTime.fromFormat('05/13/2024', 'LL/dd/yyyy', { zone: timezone })
  .startOf('day')
  .plus({ hour: 8, minutes: 25 });

describe('Encounter', () => {
  beforeEach(() => {
    cy.turnOnFeatureFlag('coverage_visibility_ENG_2371');
    cy.clock(now.toJSDate(), ['Date']);
    cy.intercept(
      {
        method: 'PUT',
        url: '/telenutrition/api/v1/appointment-encounter/1000022/visit',
      },
      okResponse({}),
    ).as('setVisitTimer');

    const fixture = setupProviderFixutre1({ timezone, now });

    cy.intercept(
      {
        method: 'GET',
        url: '/telenutrition/api/v1/provider/patients/10000000/appointments?*',
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

  it('shows correct coverage cards', () => {
    cy.getByDataTestId('selected-coverage-card').should('exist');
    cy.getByDataTestId('other-coverage-card').should('have.length', 1);
    cy.getByDataTestId('selected-coverage-card').within(() => {
      cy.contains('Independent Health');
      cy.contains('ID: abc123');
      cy.contains('Unlimited');
      cy.getByDataTestId('active-badge').should('exist');
    });

    cy.getByDataTestId('other-coverage-card').within(() => {
      cy.contains('Bobo healthcare');
      cy.contains('ID: 42069');
      cy.getByDataTestId('active-badge').should('not.exist');
    });
  });

  it('shows coverage details modal', () => {
    cy.getByDataTestId('selected-coverage-card').within(() => {
      cy.get('button').contains('Details').click();
    });

    cy.getByDataTestId('modal-root').within(() => {
      cy.contains('Independent Health');
      cy.contains('ID: abc123');
      cy.getByDataTestId('detail-active-badge').should('exist');
      cy.getByDataTestId('visits-available').contains('Unlimited');

      cy.getByDataTestId('initial-visit-card').within(() => {
        cy.getByDataTestId('visit-length').contains('60 minutes');
        cy.getByDataTestId('video-visits').within(() => {
          cy.get('svg').should('exist');
        });
        cy.getByDataTestId('audio-visits').within(() => {
          cy.get('svg').should('exist');
        });
        cy.getByDataTestId('medical-oversight').within(() => {
          cy.get('svg').should('not.exist');
        });
      });

      cy.getByDataTestId('followup-visit-card').within(() => {
        cy.getByDataTestId('visit-length').contains('60 minutes');
        cy.getByDataTestId('video-visits').within(() => {
          cy.get('svg').should('exist');
        });
        cy.getByDataTestId('audio-visits').within(() => {
          cy.get('svg').should('exist');
        });
        cy.getByDataTestId('medical-oversight').within(() => {
          cy.get('svg').should('not.exist');
        });
      });
    });

    cy.getByDataTestId('modal-close-button').click();

    cy.wait(500);

    cy.getByDataTestId('other-coverage-card')
      .first()
      .within(() => {
        cy.get('button').contains('Details').click();
      });

    cy.getByDataTestId('modal-root').within(() => {
      cy.contains('Bobo healthcare');
      cy.contains('ID: 42069');
      cy.getByDataTestId('detail-active-badge').should('not.exist');
      cy.getByDataTestId('visits-available').contains('3 of 6 remaining');

      cy.getByDataTestId('initial-visit-card').within(() => {
        cy.getByDataTestId('visit-length').contains('60 minutes');
        cy.getByDataTestId('video-visits').within(() => {
          cy.get('svg').should('exist');
        });
        cy.getByDataTestId('audio-visits').within(() => {
          cy.get('svg').should('not.exist');
        });
        cy.getByDataTestId('medical-oversight').within(() => {
          cy.get('svg').should('exist');
        });
      });

      cy.getByDataTestId('followup-visit-card').within(() => {
        cy.getByDataTestId('visit-length').contains('30 minutes');
        cy.getByDataTestId('video-visits').within(() => {
          cy.get('svg').should('exist');
        });
        cy.getByDataTestId('audio-visits').within(() => {
          cy.get('svg').should('not.exist');
        });
        cy.getByDataTestId('medical-oversight').within(() => {
          cy.get('svg').should('exist');
        });
      });
    });
  });
});
