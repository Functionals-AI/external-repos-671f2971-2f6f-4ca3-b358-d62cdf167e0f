import VisitLengthTimer from '.';
import type { AppointmentEncounterRecord } from '@mono/telenutrition/lib/types';
import TempAppStateWrapper from 'app/temp-app-state-wrapper';
import { ModalProvider } from '@/modules/modal';
import { SessionContext } from '@/features/provider/patient/session/useSessionContext';

function VisitLengthTestingComponent({
  encounter,
  duration,
}: {
  encounter: AppointmentEncounterRecord;
  duration: 60;
}) {
  const session = {
    data: {
      encounterData: {
        encounter: encounter,
      },
      appointmentDetails: {
        appointment: {
          appointmentId: 1,
          duration: duration,
        },
      },
    },
    form: {},
  } as any;
  return (
    <SessionContext.Provider value={session}>
      <ModalProvider>
        <TempAppStateWrapper>
          <VisitLengthTimer />
        </TempAppStateWrapper>
      </ModalProvider>
    </SessionContext.Provider>
  );
}

describe('Visit Timer Component', () => {
  const sessionDuration = 60;
  let encounter: AppointmentEncounterRecord;

  beforeEach(() => {
    encounter = {
      encounterId: 1,
      createdAt: '',
      updatedAt: '',
    };
  });

  it('No value for start date and end date will show blank button', () => {
    cy.mount(<VisitLengthTestingComponent encounter={encounter} duration={sessionDuration} />);
    cy.get('button').contains('Start visit');
  });

  it('When start date is set, button should show "End Timer"', () => {
    const startTime = new Date();
    encounter.timerStartedAt = startTime.toISOString();
    cy.mount(<VisitLengthTestingComponent encounter={encounter} duration={sessionDuration} />);
    cy.get('button').contains('End Timer');
  });

  it('When end date is set, button should show "Ended"', () => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    encounter.timerStartedAt = startTime.toISOString();
    encounter.timerEndedAt = endTime.toISOString();

    cy.mount(<VisitLengthTestingComponent encounter={encounter} duration={sessionDuration} />);
    cy.get('button').contains('Ended');
  });

  it('will show correct number of ticks when timer already has a start date', () => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 10 * 60 * 1000);
    encounter.timerStartedAt = startTime.toISOString();
    encounter.timerEndedAt = endTime.toISOString();
    cy.mount(<VisitLengthTestingComponent encounter={encounter} duration={sessionDuration} />);

    cy.get('button').contains('Ended');
    cy.get('span.font-semibold').contains('10:00');
    cy.get('span.ml-1').contains('1 unit');
  });
});
