import {
  calculateUnits,
  countTicks,
  getStateFromSessionLength,
  getStateFromEncounterData,
} from './visit-timer';

describe('Visit Timer Functions', () => {
  describe('calculateUnits', () => {
    it('unit count is based on time in seconds', () => {
      cy.wrap(calculateUnits(0)).should('equal', 0);
      cy.wrap(calculateUnits(7 * 60 + 59)).should('equal', 0);
      
      cy.wrap(calculateUnits(8 * 60)).should('equal', 1);
      cy.wrap(calculateUnits(22 * 60 + 59)).should('equal', 1);

      cy.wrap(calculateUnits(23 * 60)).should('equal', 2);
      cy.wrap(calculateUnits(37 * 60 + 59)).should('equal', 2);

      cy.wrap(calculateUnits(38 * 60)).should('equal', 3);
      cy.wrap(calculateUnits(52 * 60 + 59)).should('equal', 3);

      cy.wrap(calculateUnits(53 * 60)).should('equal', 4);
      cy.wrap(calculateUnits(67 * 60 + 59)).should('equal', 4);

      cy.wrap(calculateUnits(68 * 60)).should('equal', 5);
      cy.wrap(calculateUnits(82 * 60 + 59)).should('equal', 5);

      cy.wrap(calculateUnits(83 * 60)).should('equal', 6);
      cy.wrap(calculateUnits(97 * 60 + 59)).should('equal', 6);
      
      cy.wrap(calculateUnits(98 * 60)).should('equal', 7);
      cy.wrap(calculateUnits(112 * 60 + 59)).should('equal', 7);
      
      cy.wrap(calculateUnits(113 * 60)).should('equal', 8);
      cy.wrap(calculateUnits(1442 * 60)).should('equal', 8);
    });
  });

  describe('countTicks', () => {
    it('if end time is set, ticks are counted from start to end', () => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      cy.wrap(countTicks(tenMinutesAgo, now)).should('equal', 10 * 60);
      cy.wrap(countTicks(fiveMinutesAgo, now)).should('equal', 5 * 60);
    });

    it('if there is no start time, no ticks have passed', () => {
      const now = new Date();
      cy.wrap(countTicks(null, now)).should('equal', 0);
    });

    it('a start time will count ticks from then until time of counting', () => {
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      cy.wrap(countTicks(tenMinutesAgo, null)).should('eq', Math.floor(10 * 60));
    });
  });

  describe('getStateFromEncounterData', () => {
    it('returns inactive if startTime is null or if endTime is defined', () => {
      const now = new Date();
      cy.wrap(getStateFromEncounterData(null, null, 60, 0)).should('equal', 'inactive');
      cy.wrap(getStateFromEncounterData(now, now, 60, 0)).should('equal', 'inactive');
    });

    it('delegates to getStateFromSessionLength when startTime is present and endTime is null', () => {
      const now = new Date();
      const sessionTimeSec = 54 * 60;
      cy.wrap(getStateFromEncounterData(now, null, 60, sessionTimeSec)).should('equal', 'good');
    });
  });

  describe('getStateFromSessionLength', () => {
    it('returns correct state based on session length and time', () => {
      let sessionLength = 60;
      cy.wrap(getStateFromSessionLength(sessionLength, 0 * 60)).should('equal', 'running');
      cy.wrap(getStateFromSessionLength(sessionLength, 52 * 60 + 59)).should('equal', 'running');

      cy.wrap(getStateFromSessionLength(sessionLength, 53 * 60)).should('equal', 'good');
      cy.wrap(getStateFromSessionLength(sessionLength, 57 * 60 + 59)).should('equal', 'good');

      cy.wrap(getStateFromSessionLength(sessionLength, 58 * 60)).should('equal', 'over');
      cy.wrap(getStateFromSessionLength(sessionLength, 999 * 60)).should('equal', 'over');

      sessionLength = 30;
      cy.wrap(getStateFromSessionLength(sessionLength, 0 * 60)).should('equal', 'running');
      cy.wrap(getStateFromSessionLength(sessionLength, 22 * 60 + 59)).should('equal', 'running');

      cy.wrap(getStateFromSessionLength(sessionLength, 23 * 60)).should('equal', 'good');
      cy.wrap(getStateFromSessionLength(sessionLength, 27 * 60 + 59)).should('equal', 'good');

      cy.wrap(getStateFromSessionLength(sessionLength, 28 * 60)).should('equal', 'over');
      cy.wrap(getStateFromSessionLength(sessionLength, 999 * 60)).should('equal', 'over');
    });
  });
});
