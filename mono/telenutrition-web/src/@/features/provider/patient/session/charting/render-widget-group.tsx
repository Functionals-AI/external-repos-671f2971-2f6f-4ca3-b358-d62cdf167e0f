import { UseFormReturn } from 'react-hook-form';
import RenderWidget from './render-widget';
import type { GroupWidget } from '@mono/telenutrition/lib/types';
import { cn } from '@/utils';
import { getWidgetReactKey } from '@/modules/widgets/helpers';

export default function RenderWidgetGroup({
  widget,
  form,
  depth,
}: {
  widget: GroupWidget;
  form: UseFormReturn;
  depth: number;
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <div className={cn(depth === 1 && 'bg-neutral-100', 'px-4 py-1')}>
        <h4 className="text-neutral-600 text-xl font-semibold">{widget.title}</h4>
        {widget.subtitle && <p className="text-neutral-600 text-sm">{widget.subtitle}</p>}
      </div>
      <div className="pb-6 flex flex-col gap-y-6 px-4">
        {widget.widgets.map((w) => (
          <RenderWidget key={getWidgetReactKey(w)} widget={w} form={form} depth={depth + 1} />
        ))}
      </div>
    </div>
  );
}
