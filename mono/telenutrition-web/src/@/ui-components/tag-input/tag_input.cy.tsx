import TagInput from '.';
import { TagInputOption } from './types';
import BasePage from '../../../../cypress/pages/base';

const TAG_INPUT_OPTIONS: TagInputOption[] = [
  { label: 'An option 1', value: 'option_1', type: 'predefined' },
  { label: 'Another option 2', value: 'option_2', type: 'predefined' },
  { label: 'A different option 3', value: 'option_3', type: 'predefined' },
  { label: 'Best option 4', value: 'option_4', type: 'predefined' },
  { label: 'Even better option 5', value: 'option_5', type: 'predefined' },
  { label: 'Best option 6', value: 'option_6', type: 'predefined' },
];

function NonAddableTagInput() {
  return (
    <div className="px-20 pt-16">
      <TagInput options={TAG_INPUT_OPTIONS} id={'id123'} inputLabel="LABEL" />
    </div>
  );
}

function AddableTagInput() {
  return (
    <div className="px-20 pt-16">
      <TagInput options={TAG_INPUT_OPTIONS} creatable id={'id123'} inputLabel="LABEL" />
    </div>
  );
}

describe('Tag Input', { retries: { runMode: 4, openMode: 2 } }, () => {
  before(() => {
    cy.viewport(1000, 700);
  });

  describe('NonAddableTagInput', () => {
    beforeEach(() => {
      cy.mount(<NonAddableTagInput />);
    });
    it('Should render', () => {
      BasePage.byDataTestId('tag-input-input').should('exist');
    });

    it('Should have 6 options initially', () => {
      BasePage.byDataTestId('tag-input-input').click();
      BasePage.byDataTestId('tag-input-item').should('have.length', 6);
    });

    it.skip('Should allow keyboard navigation', () => {
      BasePage.byDataTestId('tag-input-input').focus().type('{enter}');
      BasePage.byDataTestId('tag-input-item').should('have.length', 5);
      BasePage.byDataTestId('tag-input-input').focus().type('{enter}{enter}');
      BasePage.byDataTestId('tag-input-item').should('have.length', 3);
      BasePage.byDataTestId('tag-input-input').focus().type('{downArrow}{enter}');
      BasePage.byDataTestId('tag-input-item').should('have.length', 2);

      BasePage.byDataTestId('tag-input-badge').should('have.length', 4);

      const selected = [
        TAG_INPUT_OPTIONS[0],
        TAG_INPUT_OPTIONS[1],
        TAG_INPUT_OPTIONS[2],
        TAG_INPUT_OPTIONS[4],
      ];

      const notSelected = [TAG_INPUT_OPTIONS[3], TAG_INPUT_OPTIONS[5]];

      selected.forEach((optionName) => {
        BasePage.byDataTestId('tag-input-badge').contains(optionName.label).should('exist');
      });
      notSelected.forEach((optionName) => {
        BasePage.byDataTestId('tag-input-item').contains(optionName.label).should('exist');
      });
    });
    it('Should add and remove items with clicks', () => {
      BasePage.byDataTestId('tag-input-input').focus();
      BasePage.byDataTestId('tag-input-item').eq(1).click();
      BasePage.byDataTestId('tag-input-item').should('have.length', 5);

      BasePage.byDataTestId('tag-input-badge').contains(TAG_INPUT_OPTIONS[1].label).should('exist');

      BasePage.byDataTestId('tag-input-badge').within(() => {
        cy.get('button').click();
      });
      BasePage.byDataTestId('tag-input-input').focus();
      BasePage.byDataTestId('tag-input-item').should('have.length', 6);
    });

    it('Should correctly filter', () => {
      BasePage.byDataTestId('tag-input-input').focus().type('OptioN');
      BasePage.byDataTestId('tag-input-item').should('have.length', 6);

      BasePage.byDataTestId('tag-input-input').focus().clear();
      BasePage.byDataTestId('tag-input-input').focus().type('BEST');
      BasePage.byDataTestId('tag-input-item').should('have.length', 2);

      // BasePage.byDataTestId('tag-input-input').focus().type('{enter}');
      BasePage.byDataTestId('tag-input-item').eq(0).click();
      // Shows all items again
      BasePage.byDataTestId('tag-input-input').should('have.value', '');
      BasePage.byDataTestId('tag-input-item').should('have.length', 5);

      BasePage.byDataTestId('tag-input-badge').eq(0).contains('Best option 4').should('exist');

      BasePage.byDataTestId('tag-input-input').focus().type('{backspace}');
      BasePage.byDataTestId('tag-input-input').should('have.value', '');
      BasePage.byDataTestId('tag-input-item').should('have.length', 6);
    });

    it('Should no entries if text entered does not match', () => {
      BasePage.byDataTestId('tag-input-input')
        .focus()
        .type('something that does not match any options');
      BasePage.byDataTestId('tag-input-no-results').should('exist');
      BasePage.byDataTestId('tag-input-input').focus().clear();

      BasePage.byDataTestId('tag-input-no-results').should('not.exist');
    });
  });

  describe('NonAddableTagInput', () => {
    beforeEach(() => {
      cy.mount(<AddableTagInput />);
    });

    it('should show addable input', () => {
      const customItem = 'something that does not match any options';
      BasePage.byDataTestId('tag-input-input').focus().type(customItem);
      BasePage.byDataTestId('tag-input-no-results').should('not.exist');

      BasePage.byDataTestId('tag-input-creatable-item').should('exist').click();

      BasePage.byDataTestId('tag-input-input').should('have.value', '');
      BasePage.byDataTestId('tag-input-item').should('have.length', 6);

      BasePage.byDataTestId('tag-input-badge')
        .should('have.length', 1)
        .eq(0)
        .contains(customItem)
        .should('exist');
    });
  });
});
