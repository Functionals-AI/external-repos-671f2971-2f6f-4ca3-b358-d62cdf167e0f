import { UseFormReturn } from 'react-hook-form';
import type { QuestionWidget, Widget } from '@mono/telenutrition/lib/types';
import { cn } from '@/utils';
import ConditionalWidget from '@/features/provider/patient/session/charting/conditional-widget';
import RenderQuestionWidget from './render-question-widget';
import { getWidgetReactKey, transformDynamic } from '@/modules/widgets/helpers';
import RenderWidgetGroup from '@/features/provider/patient/session/charting/render-widget-group';
import Card from '@/ui-components/card';
import InfoIcon from '../../../../../../../public/icons/info-circle.svg';
import DataDisplay from '@/ui-components/data-display';
import WidgetLabel, { getSizeClassName } from '@/modules/widgets/widget-label';
import FormNumberInput from '@/modules/form/form-number-input';
import FormTextInput from '@/modules/form/form-text-input';
import FormDatePickerItem from '@/modules/form/form-date-picker-item';
import TieredInputsWidget from '@/modules/widgets/tiered-inputs-widget';
import CombinedPreviousAnswerPrompt from "./render-question-widget/combined-previous-answer-prompt";

export default function RenderWidget({
  form,
  widget,
  depth = 0,
}: {
  form: UseFormReturn<any>;
  widget: Widget;
  depth?: number;
}) {
  if (widget.type === 'group') {
    return <RenderWidgetGroup form={form} widget={widget} depth={depth + 1} />;
  }

  if (widget.type === 'grid') {
    return (
      <div className="flex flex-col gap-y-2">
        <WidgetLabel label={widget.title} />
        <div
          className={cn('w-full grid gap-4')}
          style={{ gridTemplateColumns: `repeat(${widget.colSpan}, minmax(0, 1fr))` }}
        >
          {widget.cols.map((col) => (
            <div key={getWidgetReactKey(col.widget)} style={{ gridColumn: `span ${col.span}` }}>
              <RenderWidget form={form} widget={col.widget} depth={depth + 1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widget.type === 'tiered-inputs') {
    return (
      <div id={`widget-question-${widget.key}`}>
        <TieredInputsWidget widget={widget} form={form} />
      </div>
    );
  }

  if (widget.type === 'conditional') {
    return <ConditionalWidget widget={widget} form={form} depth={depth} />;
  }

  if (widget.type === 'inline-inputs') {
    return (
      <div className="flex flex-col gap-y-2">
        <WidgetLabel label={widget.label} />
        <div className="flex gap-x-4">
          {widget.inputs.map((input) => {
            const inputRequiredRule = input.required ? { required: true } : {};

            return (
              <div key={input.key} className="flex flex-col gap-x-4 min-w-[6rem]">
                {input.type === 'input:number' ? (
                  <FormNumberInput
                    form={form}
                    id={input.key}
                    rules={inputRequiredRule}
                    label={input.inputLabel}
                    disabled={input.disabled}
                    allowScroll={input.allowScroll}
                    min={input.min}
                    max={input.max}
                    decimalScale={input.decimalScale}
                  />
                ) : input.type === 'input:text' ? (
                  <FormTextInput
                    form={form}
                    id={input.key}
                    rules={inputRequiredRule}
                    label={input.inputLabel}
                    disabled={input.disabled}
                  />
                ) : (
                  <FormDatePickerItem
                    form={form}
                    id={input.key}
                    rules={inputRequiredRule}
                    inputLabel={input.inputLabel}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (widget.type === 'notice-message') {
    return (
      <Card className={cn('', widget.variant === 'info' && 'border border-blue-400')}>
        <div
          className={cn(
            'flex gap-x-2 pl-3 pr-4 py-2',
            widget.variant === 'info' && 'border-l-8 border-l-blue-400',
          )}
        >
          <div className="flex-1 flex justify-center px-1 pt-2">
            <InfoIcon
              height={24}
              width={24}
              className={cn(widget.variant === 'info' && 'fill-blue-400 text-blue-400')}
            />
          </div>
          <div>
            <h4 className="heading-xs">{widget.title}</h4>
            <p className="text-neutral-700">{widget.message}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (widget.type === 'data-display') {
    return <DataDisplay label={widget.label} content={widget.content} />;
  }

  if (widget.type === 'flex-row') {
    const parentPromptWidgets = widget.widgets
      .filter((w) => w.widget.prevAnswerPromptLocation === 'parent')
      .map((w) => w.widget as QuestionWidget);

      return (
        <div className="flex flex-col gap-y-2">
        <WidgetLabel label={widget.title} />
        <CombinedPreviousAnswerPrompt widgets={parentPromptWidgets} form={form} />
        <div className={cn('flex flex-wrap gap-4', getSizeClassName(widget.maxSize ?? null))}>
          {widget.widgets.map(({ widget, size }) => (
            <div className={getSizeClassName(size ?? null)} key={getWidgetReactKey(widget)}>
              <RenderWidget widget={widget} form={form} depth={depth + 1} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widget.type === 'html') {
    return (
      <div dangerouslySetInnerHTML={{ __html: transformDynamic(widget.html, form.getValues()) }} />
    );
  }

  return <RenderQuestionWidget widget={widget} form={form} />;
}
