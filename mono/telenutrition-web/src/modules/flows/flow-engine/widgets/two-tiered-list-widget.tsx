import FormItemFooter from '../../../../components/form/form-item-footer';
import type { TwoTieredListWidget as ITwoTieredListWidget } from '@mono/telenutrition/lib/types';
import CheckboxField from '../../../../components/form/checkbox';
import { FlowWidgetProps } from './flow-widget';

export default function TwoTieredListWidget({
  widget,
}: Pick<FlowWidgetProps<ITwoTieredListWidget>, 'widget'>) {
  const { label, list, key, required } = widget;
  return (
    <div className="w-full pb-4 md:pb-0 px-2 md:px-0">
      <h4 className="text-base">
        {label && (
          <>
            {label}
            {required && <span className="text-status-red-600"> *</span>}
          </>
        )}
      </h4>
      <FormItemFooter questionKey={key} />
      <div className="grid grid-cols-12">
        {Object.entries(list).map(([label, arr]) => (
          <div key={label} className="col-span-12 xs:col-span-6 md:col-span-4 lg:col-span-3 pt-4">
            <CheckboxField
              options={arr.map((item) => ({
                title: item.label,
                id: item.value,
              }))}
              label={label}
              registerOptions={{
                required: false,
                validate: (value) => {
                  if (!required) return true;
                  return value && !!value.length ? true : 'You must select at least one reason';
                },
              }}
              questionKey={key}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
