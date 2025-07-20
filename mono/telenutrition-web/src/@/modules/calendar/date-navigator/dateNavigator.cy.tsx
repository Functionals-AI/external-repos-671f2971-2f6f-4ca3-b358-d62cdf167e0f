import React from 'react';
import DateNavigator from './';
import { useSingleDateNavigator } from './useSingleDateNavigator';
import { TimezoneContext } from '@/modules/dates/context';
import { DateTime } from 'luxon';
import { useRangeDateNavigator } from './useRangeDateNavigator';

const SHORT_FORMAT = 'LLL d';

['America/New_York', 'America/Los_Angeles'].forEach((timezone) => {
  describe(`DateNavigator with timezone ${timezone}`, () => {
    const now = DateTime.fromISO('2024-05-13T18:25:00')
      .setZone(timezone)
      .startOf('day')
      .plus({ hour: 8, minutes: 25 });

    function SingleDateNavigator() {
      const dateNavigator = useSingleDateNavigator({ defaultDate: now, navigationType: 'day' });
      return (
        <TimezoneContext.Provider value={{ timezone, setTimezone: () => {} }}>
          <DateNavigator {...dateNavigator} />
        </TimezoneContext.Provider>
      );
    }

    function Range4DateNavigator() {
      const dateNavigator = useRangeDateNavigator({ defaultDate: now, interval: 4 });
      return (
        <TimezoneContext.Provider value={{ timezone, setTimezone: () => {} }}>
          <DateNavigator {...dateNavigator} />
        </TimezoneContext.Provider>
      );
    }

    describe('<SingleDateNavigator />', () => {
      it('renders', () => {
        cy.mount(<SingleDateNavigator />);
        cy.get('[data-testid="popover-trigger"]')
          .contains(now.toFormat(SHORT_FORMAT))
          .should('exist');
      });

      it('correctly navigates left', () => {
        cy.mount(<SingleDateNavigator />);
        cy.get('[data-testid="date-navigator-left-button"]').click();
        cy.get('[data-testid="popover-trigger"]')
          .contains(now.minus({ days: 1 }).toFormat(SHORT_FORMAT))
          .should('exist');
      });

      it('correctly navigates right', () => {
        cy.mount(<SingleDateNavigator />);
        cy.get('[data-testid="date-navigator-right-button"]').click();
        cy.get('[data-testid="popover-trigger"]')
          .contains(now.plus({ days: 1 }).toFormat(SHORT_FORMAT))
          .should('exist');
      });

      it('can select date from calendar', () => {
        cy.mount(<SingleDateNavigator />);
        cy.get('[data-testid="popover-trigger"]').click();
        cy.get('[data-testid="date-picker-popover"]').should('exist');

        cy.get('[data-day="2024-05-30"').should('exist').click();

        cy.get('[data-testid="popover-trigger"]')
          .contains(DateTime.fromFormat('05/30/2024', 'LL/dd/yyyy').toFormat(SHORT_FORMAT))
          .should('exist');
      });
    });

    describe('<Range4DateNavigator />', () => {
      it('renders', () => {
        cy.mount(<Range4DateNavigator />);
        cy.get('[data-testid="popover-trigger"]')
          .contains(now.toFormat(SHORT_FORMAT))
          .contains(now.plus({ days: 3 }).toFormat('d'))
          .should('exist');
      });

      it('correctly navigates 4 days at a time, left', () => {
        cy.mount(<Range4DateNavigator />);
        cy.get('[data-testid="date-navigator-left-button"]').click();
        cy.get('[data-testid="popover-trigger"]')
          .contains(now.minus({ days: 4 }).toFormat(SHORT_FORMAT))
          .contains(now.minus({ days: 1 }).toFormat('d'))
          .should('exist');
      });

      it('correctly navigates 4 days at a time, right', () => {
        cy.mount(<Range4DateNavigator />);
        cy.get('[data-testid="date-navigator-right-button"]').click();
        cy.get('[data-testid="popover-trigger"]')
          .contains(now.plus({ days: 4 }).toFormat(SHORT_FORMAT))
          .contains(now.plus({ days: 7 }).toFormat('d'))
          .should('exist');
      });
    });
  });
});
