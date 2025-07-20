import EntryEditorWidget from './entry-editor-widget';
import { FormV2, useForm } from '../form/form';
import type { EntryEditorQuestion } from '@mono/telenutrition/lib/types';

function Renderer({ widget }: { widget: EntryEditorQuestion }) {
  const form = useForm();

  return (
    <FormV2 form={form} onSubmit={() => {}}>
      <EntryEditorWidget form={form} widget={widget} />
    </FormV2>
  );
}

describe('EntryEditorWidget', () => {
  const widget: EntryEditorQuestion = {
    key: 'test',
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ],
    inputLabel: 'Test',
    type: 'entry-editor',
    addButtonText: 'Add Entry',
  };

  beforeEach(() => {
    cy.mount(<Renderer widget={widget} />);
  });

  it('renders without issues', () => {
    cy.get('input').should('exist');
  });

  it('allows adding new entries', () => {
    cy.get('input').should('have.length', 1);
    cy.get('button').contains('Add Entry').click();
    cy.get('input').should('have.length', 2);
  });

  it('clears the entry if there is only one', () => {
    cy.get('input').should('have.length', 1);

    cy.get('.chevron-down').click();
    cy.get('[data-testid="combobox-option-option1"]').click();

    cy.get('input').should('have.length', 1);
    cy.get('input').should('have.value', 'Option 1');

    cy.get('[data-testid="clear-entry"]').click();
    cy.get('input').should('have.length', 1);
    cy.get('input').should('have.value', '');
  });

  it('removes the entry if there are multiple entries', () => {
    cy.get('input').should('have.length', 1);

    cy.get('button').contains('Add Entry').click();
    cy.get('input').should('have.length', 2);

    cy.get('button').contains('Add Entry').click();
    cy.get('input').should('have.length', 3);

    cy.get('[data-testid="remove-entry"]').first().click();
    cy.get('input').should('have.length', 2);

    cy.get('[data-testid="remove-entry"]').first().click();
    cy.get('input').should('have.length', 1);

    cy.get('[data-testid="remove-entry"]').should('not.exist');
  });

  it('prevents adding duplicate entries', () => {
    cy.get('input').should('have.length', 1);

    // add in option 1
    cy.get('.chevron-down').first().click();
    cy.get('[data-testid="combobox-option-option1"]').click();
    cy.get('input').first().should('have.value', 'Option 1');

    // add a new entry and make sure option 1 is not available
    cy.get('button').contains('Add Entry').click();
    cy.get('input').should('have.length', 2);

    cy.get('.chevron-down').eq(1).click();
    cy.get('body').find('[data-testid="combobox-option-option1"]').should('not.exist');

    // select option 2 instead
    cy.get('body').find('[data-testid="combobox-option-option2"]').should('be.visible').click();
    cy.get('input').eq(1).should('have.value', 'Option 2');

    // add another entry to try and select an option
    cy.get('button').contains('Add Entry').click();

    // expect to see no options available
    cy.get('.chevron-down').eq(2).click();
    cy.get('body').find('[data-testid="combobox-option-option1"]').should('not.exist');
    cy.get('body').find('[data-testid="combobox-option-option2"]').should('not.exist');
  });
});
