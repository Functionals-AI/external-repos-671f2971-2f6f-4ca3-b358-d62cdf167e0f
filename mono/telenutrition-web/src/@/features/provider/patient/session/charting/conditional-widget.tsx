import { UseFormReturn } from 'react-hook-form';
import type { ConditionalWidget as IConditionalWidget } from '@mono/telenutrition/lib/types';
import RenderWidget from './render-widget';
import { useEffect } from 'react';
import jmespath from 'jmespath';
import { areConditionalsSatisfied, getWidgetReactKey } from '@/modules/widgets/helpers';

export default function ConditionalWidget({
  widget,
  form,
  depth,
}: {
  widget: IConditionalWidget;
  form: UseFormReturn;
  depth: number;
}) {
  const showWidgets = areConditionalsSatisfied(widget.conditions, (key) => {
    const values = form.getValues();
    return jmespath.search(values, key);
  });

  useEffect(() => void form.watch(), []);

  if (showWidgets) {
    return (
      <div className="ml-4 flex flex-col gap-y-6">
        {widget.widgets.map((w) => (
          <RenderWidget key={getWidgetReactKey(w)} widget={w} form={form} depth={depth} />
        ))}
      </div>
    );
  }

  return null;
}
