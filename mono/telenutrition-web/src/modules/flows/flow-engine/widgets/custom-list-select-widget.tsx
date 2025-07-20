import Card from '../../../../components/card';
import FormItemLabel from '../../../../components/form/form-item-label';
import { isFieldRequired } from '../../../../components/form/helpers';
import useRegisterField from '../../../../components/form/useRegisterField';
import classNames from '../../../../utils/classNames';
import type { CustomListSelectWidget as TCustomListSelectWidget } from '@mono/telenutrition/lib/types';
import { useWorkflowEngineContext } from '../workflow-engine/context';
import { FlowValueBasic } from '../workflow-engine/types';
import FlowWidget from './flow-widget';
import { useWatch } from 'react-hook-form';

interface CustomListSelectWidgetProps {
  widget: TCustomListSelectWidget;
  getFlowStateValue: (key: string | string[]) => FlowValueBasic | null;
  getFlowStateDisplayValue: (key: string | string[]) => string | null;
}

export default function CustomListSelectWidget({
  widget,
  getFlowStateDisplayValue,
  getFlowStateValue,
}: CustomListSelectWidgetProps) {
  const fieldConfig = useRegisterField(widget.key, { required: true });
  const { form } = useWorkflowEngineContext();
  const Wrapper = widget.renderInCard ? Card : 'div';
  const selectedValue = useWatch({ name: widget.key });

  function handleClick(value: string | number | boolean) {
    form.setValue(widget.key, value);
  }

  return (
    <div>
      <FormItemLabel
        name={widget.label}
        required={isFieldRequired({ required: widget.required })}
      />
      <div className={`grid grid-cols-${widget.cols ?? 1} gap-y-4 gap-x-4`}>
        {widget.options.map((option) => {
          return (
            <Wrapper
              key={option.value.toString()}
              className={classNames(
                'cursor-pointer border-2 gap-y-2 flex flex-col hover:shadow-lg transition-shadow',
                selectedValue === option.value ? 'border-f-light-green' : 'border-transparent',
              )}
              onClick={() => handleClick(option.value)}
            >
              <input {...fieldConfig} id={String(option.value)} className="hidden" />
              {option.display.map((w) => (
                <FlowWidget key={option.value.toString()}
                  {...{
                    widget: w,
                    getFlowStateDisplayValue,
                    getFlowStateValue,
                  }}
                />
              ))}
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
