import React from 'react';
import { FormV2, useForm } from '../form/form';
import FormDatePickerItem from './form-date-picker-item';
import { DateTime } from 'luxon';
import { DisabledDate } from '@/ui-components/calendar/day-picker';

function InputRenderer({
  min,
  max,
  disabledDates,
}: {
  min?: string;
  max?: string;
  disabledDates?: DisabledDate[];
}) {
  const form = useForm();
  const value = form.watch('default-input');

  return (
    <div className="px-8 py-8">
      <FormV2 form={form} onSubmit={() => {}}>
        <FormDatePickerItem
          form={form}
          id="default-input"
          min={min}
          max={max}
          disabledDates={disabledDates}
        />
        <p data-testid="default-input-value">{value}</p>
      </FormV2>
    </div>
  );
}

const now = DateTime.fromFormat('03/01/2000', 'LL/dd/yyyy');

describe('<FormDatePickerItem />', () => {
  before(() => {
    cy.viewport(1000, 700);
  });

  beforeEach(() => {
    cy.clock(now.toJSDate(), ['Date']);
  });

  it('renders default', () => {
    cy.mount(<InputRenderer />);

    cy.get('[data-testid="default-input-input"]').as('inputField');
    cy.get('[data-testid="default-input-value"]').as('valueField');

    cy.get('@inputField').should('exist');
  });

  it('allows selecting a date', () => {
    cy.mount(<InputRenderer />);

    cy.get('[data-testid="default-input-input"]').as('inputField');
    cy.get('[data-testid="default-input-value"]').as('valueField');

    cy.get('@valueField').should('exist').should('have.text', '');
    cy.get('@inputField').type('02/02/2000');
    cy.get('@valueField').should('exist').should('have.text', '2000-02-02');
    cy.get('@inputField').clear();
    cy.get('@valueField').should('exist').should('have.text', '');
  });

  it('does not allow selecting before minimum', () => {
    cy.mount(
      <InputRenderer
        min={DateTime.fromFormat('02/02/2000', 'LL/dd/yyyy').toISO()!}
        max={DateTime.fromFormat('02/02/2001', 'LL/dd/yyyy').toISO()!}
      />,
    );

    cy.get('[data-testid="default-input-input"]').as('inputField');
    cy.get('[data-testid="default-input-value"]').as('valueField');

    cy.get('@inputField').type('01/01/2000');

    cy.get('[data-testid="form-item-error-default-input"]').as('errorField');
    cy.get('@errorField').should('exist').should('contain.text', 'Minimum date is {{minDate}}');
  });

  it('does not allow selecting before maximum', () => {
    cy.mount(
      <InputRenderer
        min={DateTime.fromFormat('02/02/2000', 'LL/dd/yyyy').toISO()!}
        max={DateTime.fromFormat('02/02/2001', 'LL/dd/yyyy').toISO()!}
      />,
    );

    cy.get('[data-testid="default-input-input"]').as('inputField');
    cy.get('[data-testid="default-input-value"]').as('valueField');

    cy.get('@inputField').type('01/01/2002');

    cy.get('[data-testid="form-item-error-default-input"]').as('errorField');
    cy.get('@errorField').should('exist').should('contain.text', 'Maximum date is {{maxDate}}');
  });

  it('does not allow selecting disabled dates by typing', () => {
    cy.mount(
      <InputRenderer
        disabledDates={[
          {
            date: DateTime.fromFormat('04/01/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE1',
          },
          {
            date: DateTime.fromFormat('04/02/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE2',
          },
          {
            date: DateTime.fromFormat('04/03/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE3',
          },
          {
            date: DateTime.fromFormat('04/04/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE4',
          },
          {
            date: DateTime.fromFormat('04/05/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE5',
          },
          {
            date: DateTime.fromFormat('04/06/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE6',
          },
        ]}
      />,
    );

    cy.get('[data-testid="default-input-input"]').as('inputField');
    cy.get('[data-testid="default-input-value"]').as('valueField');

    cy.get('@inputField').type('04/01/2000');

    cy.get('@valueField').should('have.text', '');
    cy.get('[data-testid="form-item-error-default-input"]').as('errorField');
    cy.get('@errorField').should('exist').should('contain.text', 'DISABLED DATE1');
  });

  it('should not allow selecting disabled dates by clicking on calendar', () => {
    cy.mount(
      <InputRenderer
        disabledDates={[
          {
            date: DateTime.fromFormat('04/01/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE1',
          },
          {
            date: DateTime.fromFormat('04/02/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE2',
          },
          {
            date: DateTime.fromFormat('04/03/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE3',
          },
          {
            date: DateTime.fromFormat('04/04/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE4',
          },
          {
            date: DateTime.fromFormat('04/05/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE5',
          },
          {
            date: DateTime.fromFormat('04/06/2000', 'LL/dd/yyyy'),
            tooltipMessage: 'DISABLED DATE6',
          },
        ]}
      />,
    );

    cy.get('[data-testid="default-input-input"]').as('inputField');
    cy.get('[data-testid="default-input-value"]').as('valueField');

    cy.get('[data-testid="popover-trigger"]').click();
    cy.get('[data-testid="date-navigator-right-button"]').click();

    cy.get('[data-day="2000-04-07"]')
      .should('exist')
      .should('not.have.attr', 'data-hidden', 'true');
    cy.get('[data-day="2000-04-10"]')
      .should('exist')
      .should('not.have.attr', 'data-hidden', 'true');

    cy.get('[data-day="2000-04-03"]').should('exist').should('have.attr', 'data-hidden', 'true');
    cy.get('[data-day="2000-04-04"]').should('exist').should('have.attr', 'data-hidden', 'true');
    cy.get('[data-day="2000-04-05"]').should('exist').should('have.attr', 'data-hidden', 'true');
    cy.get('[data-day="2000-04-06"]').should('exist').should('have.attr', 'data-hidden', 'true');
    cy.get('[data-day="2000-04-01"]').should('exist').should('have.attr', 'data-hidden');
    cy.get('[data-day="2000-04-02"]').should('exist').should('have.attr', 'data-hidden');
  });
});
