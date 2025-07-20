import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import FormItemLabel from '../../../../components/form/form-item-label';
import { inputClasses, isFieldRequired } from '../../../../components/form/helpers';
import useRegisterField from '../../../../components/form/useRegisterField';
import { COLORS } from '../../../../utils/colors';
import type { SingleCheckboxWidgetFlows as ISingleCheckboxWidget } from '@mono/telenutrition/lib/types';
import { calculateConditional } from '../workflow-engine/helpers';
import { FlowValueBasic } from '../workflow-engine/types';

interface SingleCheckboxWidgetProps {
  widget: ISingleCheckboxWidget;
  getFlowStateValue: (key: string | string[]) => FlowValueBasic | null;
}

export default function SingleCheckboxWidget({
  widget,
  getFlowStateValue,
}: SingleCheckboxWidgetProps) {
  const { setValue } = useFormContext();
  const fieldConfig = useRegisterField(widget.key, {
    required: widget.required,
  });

  useEffect(() => {
    if (typeof widget.defaultChecked === 'boolean') {
      setValue(widget.key, widget.defaultChecked);
    } else if (widget.defaultChecked !== undefined) {
      const isChecked = calculateConditional(widget.defaultChecked, true, getFlowStateValue);
      setValue(widget.key, isChecked);
    }
  }, []);

  return (
    <div className={`${inputClasses} shadow-none border-none py-1`}>
      {widget.overview && <p className="text-sm leading-5 text-gray-500 pb-4">{widget.overview}</p>}
      <div className=" flex items-center gap-x-4">
        <style global jsx>{`
          a {
            color: ${COLORS['f-dark-green']};
            text-decoration: underline;
          }
          a:hover {
            color: ${COLORS['f-light-green']};
            text-decoration: underline;
          }
        `}</style>
        <FormItemLabel
          name={widget.label}
          required={isFieldRequired({ required: widget.required })}
        />
        <input
          required={widget.required}
          id={widget.label}
          className="mr-2"
          type="checkbox"
          value={widget.value}
          {...fieldConfig}
        />
      </div>
    </div>
  );
}
