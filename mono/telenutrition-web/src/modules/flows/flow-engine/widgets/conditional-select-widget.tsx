import { RegisterOptions } from 'react-hook-form';
import Select from '../../../../components/form/select';
import type { ConditionalSelectWidget as TConditionalSelectWidget } from '@mono/telenutrition/lib/types';
import { calculateConditional } from '../workflow-engine/helpers';
import { FlowValueBasic } from '../workflow-engine/types';

interface ConditionalSelectWidgetProps {
  widget: TConditionalSelectWidget;
  registerOptions: RegisterOptions;
  getFlowStateValue: (key: string | string[]) => FlowValueBasic | null;
}

export default function ConditionalSelectWidget({
  widget,
  registerOptions,
  getFlowStateValue,
}: ConditionalSelectWidgetProps) {
  const options = widget.options
    .map((option) => {
      const calculated = calculateConditional(option.condition, option.then, getFlowStateValue);

      if (!calculated) return null;

      return {
        id: typeof calculated.value !== 'string' ? String(calculated.value) : calculated.value,
        title: calculated.label,
      };
    })
    .filter((option) => !!option) as { id: string; title: string }[];

  return (
    <Select
      name={widget.label}
      questionKey={widget.key}
      label={widget.label}
      options={options}
      registerOptions={registerOptions}
    />
  );
}
