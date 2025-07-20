import { FormV2, useForm } from '@/modules/form/form';
import RenderWidget from './render-widget';
import type { Widget } from '@mono/telenutrition/lib/types';
import BasePage from '../../../../../../../cypress/pages/base';
import { useState } from 'react';
import { DateTime } from 'luxon';
import { getWidgetReactKey } from '@/modules/widgets/helpers';
import { FeatureFlagsContext } from '@/modules/feature-flag';

const widgets: Widget[] = [
  {
    type: 'input:text',
    key: 'input_text_1',
    inputLabel: 'Input Text 1',
    required: true,
  },
  {
    type: 'input:number',
    key: 'input_number_1',
    inputLabel: 'Input Number 1',
    required: true,
  },
  {
    type: 'grid',
    colSpan: 12,
    name: 'grid-1',
    cols: [
      {
        span: 6,
        widget: {
          type: 'input:text',
          inputLabel: 'Input Select 1',
          key: 'grid_input_text_1',
          required: true,
        },
      },
      {
        span: 6,
        widget: {
          type: 'input:date',
          key: 'grid_input_date_1',
          inputLabel: 'Grid Input Date 1',
          required: true,
        },
      },
    ],
  },
];

function WidgetRenderer({ widgets }: { widgets: Widget[] }) {
  const form = useForm();
  const [answer, setAnswer] = useState<null | Record<string, any>>(null);

  function onSubmit(values: Record<string, any>) {
    setAnswer(values);
  }

  return (
    <FeatureFlagsContext.Provider
      // @ts-ignore
      value={{
        hasFeature: () => true,
      }}
    >
      <div className="px-8 pt-4">
        <h3>Render Widgets</h3>
        <FormV2 form={form} onSubmit={onSubmit} className="flex flex-col w-full gap-y-4">
          {widgets.map((widget) => (
            <RenderWidget key={getWidgetReactKey(widget)} widget={widget} form={form} />
          ))}
          <button
            data-testid="submit-button"
            disabled={!form.formState.isValid}
            className="border w-fit"
          >
            Submit
          </button>
          {answer && <div data-cy={JSON.stringify(answer)} data-testid="answer" />}
        </FormV2>
      </div>
    </FeatureFlagsContext.Provider>
  );
}

const answers = {
  input_text_1: 'First Value',
  input_number_1: '151',
  grid_input_text_1: 'Conner Novicki',
  grid_input_date_1: '2024-03-13',
} as const;

const timezone = 'America/New_York';
const now = DateTime.fromFormat('03/13/2024', 'LL/dd/yyyy')
  .setZone(timezone)
  .startOf('day')
  .plus({ hour: 8, minutes: 25 });

describe('Widget Renderer', () => {
  before(() => {
    cy.viewport(1000, 700);
    cy.clock(now.toJSDate(), ['Date']);
  });
  // beforeEach(() => {
  // cy.turnOnFeatureFlag('provider_encounter_prev_response_ENG_2269');
  // });
  it('Renders all widgets', () => {
    cy.mount(<WidgetRenderer widgets={widgets} />);

    const submitButton = () => BasePage.byDataTestId('submit-button');

    submitButton().should('be.disabled');

    BasePage.byDataTestId(`input_text_1-input`)
      .should('exist')
      .type('First Value')
      .should('have.value', 'First Value');
    submitButton().should('be.disabled');

    BasePage.byDataTestId('input_number_1-input')
      .should('exist')
      .type('151')
      .should('have.value', '151');
    submitButton().should('be.disabled');

    BasePage.byDataTestId('grid_input_text_1-input')
      .should('exist')
      .type('Conner Novicki')
      .should('have.value', 'Conner Novicki');

    submitButton().should('be.disabled');

    BasePage.byDataTestId('grid_input_date_1-input').type('03/13/2024');

    // Backspacing number input should clear
    // Not having number space value thats required should disable submit

    submitButton().should('not.be.disabled').click();

    BasePage.byDataTestId('answer')
      .should('exist')
      .invoke('attr', 'data-cy')
      .then((value) => {
        const parsed = JSON.parse(value as string);

        Object.entries(parsed).forEach(([key, value]) => {
          // @ts-ignore
          expect(value).to.equal(answers[key]);
        });

        Object.entries(answers).forEach(([key, value]) => {
          expect(value).to.equal(parsed[key]);
        });

        expect(parsed).to.deep.equal(answers);
      });
  });
});
