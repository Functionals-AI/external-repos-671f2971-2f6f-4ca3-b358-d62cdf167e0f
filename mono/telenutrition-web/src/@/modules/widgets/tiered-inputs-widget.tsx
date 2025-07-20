import { UseFormReturn, useWatch } from 'react-hook-form';
import type { Condition, TieredInputsQuestion } from '@mono/telenutrition/lib/types';
import { DeveloperError } from 'utils/errors';
import TextArea from '@/ui-components/text-area';
import FormComboBoxItem from '../form/form-combo-box';
import { isConditionalSatisfied } from './helpers';
import { cn } from '@/utils';
import { useEffect, useState } from 'react';
import PreviousAnswerPrompt from '@/features/provider/patient/session/charting/render-question-widget/previous-answer-prompt';

function getConditional<T>(
  values: Record<string, any>,
  conditions: { condition?: Condition; then: T }[],
): T | undefined {
  for (const { condition, then } of conditions) {
    if (!condition) return then;
    if (isConditionalSatisfied(condition, (key) => values[key])) {
      return then;
    }
  }
  return undefined;
}

export default function TieredInputsWidget({
  widget,
  form,
}: {
  widget: TieredInputsQuestion;
  form: UseFormReturn<any>;
}) {
  const [uiWidgets, setUiWidgets] = useState<JSX.Element[]>([]);
  // Past form state of this widget's values, not all form values
  const [pastFormState, setPastFormState] = useState<Record<string, any>>({});

  const watch = useWatch({ control: form.control, name: widget.key });

  useEffect(() => {
    const subscription = form.watch((formValues, { name: changedKey, type }) => {
      if (type !== 'change' || !changedKey) {
        return;
      }

      const [changedKeyBase, changedSubKey] = changedKey.split('.');

      // don't do anything if the changed key is not in the widget
      if (changedKeyBase !== widget.key) {
        return;
      }

      const updatedValues = formValues[changedKeyBase];
      setPastFormState((prevState) => {
        if (prevState[changedSubKey] === updatedValues[changedSubKey]) {
          return prevState;
        }

        const foundInd = widget.inputs.findIndex((input) => input.key === changedSubKey);

        // All widgets after this changed one should be reset
        widget.inputs.slice(foundInd + 1).forEach((input) => {
          form.resetField(`${widget.key}.${input.key}`);
        });

        return updatedValues;
      });
    });

    return () => subscription.unsubscribe();
  }, [form, widget]);

  useEffect(() => {
    const values = form.getValues()[widget.key] ?? {};

    let lastValidValueInd: null | number = null;
    const calculatedUiWidgets = widget.inputs.map((input, ind) => {
      const foundValue = values[input.key];
      if (!foundValue && input.required && lastValidValueInd === null) {
        lastValidValueInd = ind;
      }

      if (input.type === 'tiered-combobox') {
        const options = getConditional(values, input.props)?.options ?? [];
        return (
          <div
            key={input.key}
            data-cy={input.required ? 'required' : 'optional'}
            data-testid={`widget-question-${widget.key}-input-${input.key}`}
          >
            <FormComboBoxItem
              form={form}
              id={`${widget.key}.${input.key}`}
              options={options}
              label={input.inputLabel}
              rules={{ required: input.required }}
            />
          </div>
        );
      }

      if (input.type === 'tiered-textarea') {
        const props = getConditional(values, input.props);
        return (
          <div
            key={input.key}
            data-cy={input.required ? 'required' : 'optional'}
            data-testid={`widget-question-${widget.key}-input-${input.key}`}
          >
            <TextArea
              form={form}
              id={`${widget.key}.${input.key}`}
              rules={{ required: input.required }}
              label={input.inputLabel}
              description={props?.label}
            />
          </div>
        );
      }

      throw new DeveloperError(`Not implemented: ${JSON.stringify(input)}`);
    });

    setUiWidgets(calculatedUiWidgets);
  }, [form, widget, watch]);

  return (
    <div className={cn('flex flex-col gap-y-2')}>
      {!!widget.prevAnswerPrompt && <PreviousAnswerPrompt form={form} widget={widget} />}
      {uiWidgets}
    </div>
  );
}
