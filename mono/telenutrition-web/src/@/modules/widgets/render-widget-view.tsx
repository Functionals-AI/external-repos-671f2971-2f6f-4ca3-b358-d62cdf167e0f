import type { Widget } from '@mono/telenutrition/lib/types';
import { cn } from '@/utils';
import DataDisplay from '@/ui-components/data-display';
import { DeveloperError } from 'utils/errors';
import { getWidgetReactKey } from './helpers';
import { formatPhoneNumber } from 'react-phone-number-input';
import { DateTime } from 'luxon';

export default function RenderWidgetView({
  values,
  widget,
}: {
  values: Record<string, any>;
  widget: Widget;
}) {
  if (widget.type === 'group') {
    return (
      <div>
        <h4 className="text-neutral-600 heading-sm mb-2">{widget.title}</h4>
        <div className="flex flex-col gap-y-6">
          {widget.widgets.map((w) => (
            <RenderWidgetView key={getWidgetReactKey(w)} values={values} widget={w} />
          ))}
        </div>
      </div>
    );
  }
  if (widget.type === 'grid') {
    return (
      <div
        className={cn('w-full grid gap-4')}
        style={{ gridTemplateColumns: `repeat(${widget.colSpan}, minmax(0, 1fr))` }}
      >
        {widget.cols.map((colWidget) => (
          <div
            key={getWidgetReactKey(colWidget.widget)}
            style={{ gridColumn: `span ${colWidget.span}` }}
          >
            <RenderWidgetView values={values} widget={colWidget.widget} />
          </div>
        ))}
      </div>
    );
  }

  if (widget.type === 'data-display') {
    return <DataDisplay label={widget.label} content={widget.content} />;
  }

  if (widget.type === 'inline-inputs') {
    return (
      <div className="flex gap-x-2">
        {widget.inputs.map((input) => (
          <RenderWidgetView
            key={input.key}
            values={values}
            widget={{ ...input, label: input.inputLabel }}
          />
        ))}
      </div>
    );
  }

  if (widget.type === 'conditional') {
    return null;
  }

  if (
    widget.type === 'radio-table' ||
    widget.type === 'notice-message' ||
    widget.type === 'conditional-tag-input' ||
    widget.type === 'questions-with-date' ||
    widget.type === 'flex-row' ||
    widget.type === 'tiered-inputs' ||
    widget.type === 'html'
  ) {
    throw new DeveloperError(`RenderWidgetView: ${widget.type} not implemented`);
  }

  const value = values[widget.key];

  if (widget.type === 'input:select') {
    const content = (() => {
      for (const option of widget.options) {
        if (!option.type || option.type === 'basic') {
          if (option.value === value) {
            return option.label;
          }
        }
        if (option.type === 'group') {
          for (const groupOption of option.options) {
            if (groupOption.value === value) {
              return groupOption.label;
            }
          }
        }
      }
    })();
    return (
      <DataDisplay
        dataTestId={`${widget.key}-value`}
        label={widget.inputLabel}
        content={content ?? '-'}
      />
    );
  }
  if (widget.type === 'input:textarea') {
    return (
      <DataDisplay
        dataTestId={`${widget.key}-value`}
        label={widget.inputLabel}
        content={value ?? '-'}
      />
    );
  }

  if (widget.type === 'input:date') {
    return (
      <DataDisplay
        dataTestId={`${widget.key}-value`}
        label={widget.inputLabel}
        content={value ? DateTime.fromISO(value).toFormat('LL/dd/yyyy') : '-'}
      />
    );
  }
  if (widget.type === 'input:number' || widget.type === 'input:text') {
    return (
      <DataDisplay
        dataTestId={`${widget.key}-value`}
        label={widget.inputLabel}
        content={value ?? '-'}
      />
    );
  }

  if (widget.type === 'input:phone') {
    return (
      <DataDisplay
        dataTestId={`${widget.key}-value`}
        label={widget.inputLabel}
        content={getFormattedPhoneNumber(value) ?? '-'}
      />
    );
  }

  throw new DeveloperError('RenderWidgetView: Unknown widget type' + JSON.stringify(widget));
}

export function getFormattedPhoneNumber(value?: string): string | null {
  try {
    if (!value) return null;
    // @ts-ignore
    const formatted = formatPhoneNumber(value);
    if (!formatted) return value;
    return formatted;
  } catch (e) {
    return value ?? null;
  }
}
