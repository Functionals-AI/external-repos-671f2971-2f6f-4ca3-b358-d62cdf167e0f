import React from 'react';
import FormNumberInput from './form-number-input';
import { FormV2, useForm } from '../form/form';

function InputRenderer({ allowScroll = false }) {
  const form = useForm();

  return (
    <FormV2 form={form} onSubmit={() => { }}>
      <FormNumberInput form={form} id="default-input" min={1} max={10} allowScroll={allowScroll} />
    </FormV2>
  );
}

describe('<FormNumberInput />', () => {
  before(() => {
    cy.viewport(1000, 700);
  });

  it('renders default', () => {
    cy.mount(<InputRenderer />);
  });

  it('allows scroll when allowScroll is true', () => {
    cy.mount(<InputRenderer allowScroll={true} />);

    cy.get('[data-testid="default-input-input"]').as('inputField');

    cy.get('@inputField').type('2');
    cy.get('@inputField').invoke('val').should('eq', '2');

    cy.get('@inputField').type('{backspace}');
    cy.get('@inputField').invoke('val').should('eq', '');
    cy.get('@inputField').type('4');
    cy.get('@inputField').invoke('val').should('eq', '4');
    
    cy.get('@inputField').then(($input) => {
      const event = new WheelEvent('wheel', { deltaY: 100 });
      event.preventDefault = cy.stub();
      
      $input[0].dispatchEvent(event);

      expect(event.preventDefault).not.to.be.called;
    });
  });

  it('prevents scroll by default (allowScroll=true)', () => {
    cy.mount(<InputRenderer allowScroll={false} />);

    cy.get('[data-testid="default-input-input"]').as('inputField');

    cy.get('@inputField').type('2');
    cy.get('@inputField').invoke('val').should('eq', '2');

    cy.get('@inputField').type('{backspace}');
    cy.get('@inputField').invoke('val').should('eq', '');
    cy.get('@inputField').type('4');
    cy.get('@inputField').invoke('val').should('eq', '4');
    
    cy.get('@inputField').then(($input) => {
      const event = new WheelEvent('wheel', { deltaY: 100 });
      event.preventDefault = cy.stub();
      
      $input[0].dispatchEvent(event);

      expect(event.preventDefault).to.be.called;
    });
  });
});