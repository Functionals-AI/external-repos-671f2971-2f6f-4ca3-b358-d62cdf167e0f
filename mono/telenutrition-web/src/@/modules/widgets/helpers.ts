import { DeveloperError } from 'utils/errors';
import type { Condition, InterpolatableTextString, Widget } from '@mono/telenutrition/lib/types';
import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { TagInputOption } from '@/ui-components/tag-input/types';
import { RadioGroupTieredValue } from '../form/radio-group-tiered';
import { FormTableItemEntry } from '../form/form-table-item';

export function areConditionalsSatisfied(
  conditions: Condition[],
  getStateValue: (key: string) => string | string[] | boolean | null,
): boolean {
  for (const condition of conditions) {
    if (isConditionalSatisfied(condition, getStateValue)) {
      return true;
    }
  }
  return false;
}

export function isConditionalSatisfied(
  condition: Condition,
  getStateValue: (key: string) => string | string[] | boolean | null,
): boolean {
  const [conditionType] = condition;
  if (conditionType === 'stringIn') {
    const [_condition, stateKey, values] = condition;
    if (values.some((value) => value === getStateValue(stateKey))) {
      return true;
    }
  } else if (conditionType === 'stringEquals') {
    const [_condition, stateKey, value] = condition;
    if (getStateValue(stateKey) === value) {
      return true;
    }
  } else if (conditionType === 'numericEquals') {
    const [_condition, stateKey, value] = condition;
    const stateval = getStateValue(stateKey);
    if ((!!stateval && typeof stateval === 'string') || typeof stateval === 'number') {
      const stateValAsNum = typeof stateval === 'string' ? parseInt(stateval, 10) : stateval;
      if (stateValAsNum === value) {
        return true;
      }
    }
  } else if (conditionType === 'and') {
    const [_condition, conditions] = condition;
    if (conditions.every((c) => isConditionalSatisfied(c, getStateValue))) {
      return true;
    }
  } else if (conditionType === 'or') {
    const [_condition, conditions] = condition;
    if (conditions.some((c) => isConditionalSatisfied(c, getStateValue))) {
      return true;
    }
  } else if (conditionType === 'booleanEquals') {
    const [_condition, stateKey, value] = condition;

    if (getStateValue(stateKey) === value) return true;
  } else if (conditionType === 'numericIn') {
    const [_condition, stateKey, values] = condition;

    const foundStateValue = Number(getStateValue(stateKey));
    if (!_.isNaN(foundStateValue)) {
      if (values.some((value) => value === foundStateValue)) {
        return true;
      }
    }
  } else if (conditionType === 'notNull') {
    const [_condition, stateKey] = condition;
    if (!!getStateValue(stateKey)) return true;
  } else {
    throw new Error('Developer error: Cannot handle condition type.');
  }
  return false;
}

export function findWidget(widgets: Widget[], key: string): Widget | undefined {
  for (const widget of widgets) {
    if (widget.type === 'grid') {
      const found = findWidget(
        widget.cols.map((col) => col.widget),
        key,
      );
      if (found) return found;
    }

    if (widget.type === 'conditional') {
      const found = findWidget(Object.values(widget.widgets), key);
      if (found) return found;
    }

    if (widget.type === 'inline-inputs') {
      const found = findWidget(widget.inputs, key);
      if (found) return found;
    }

    if (widget.type === 'group') {
      const found = findWidget(widget.widgets, key);
      if (found) return found;
    }

    if (widget.type === 'conditional') {
      const found = findWidget(Object.values(widget.widgets), key);
      if (found) return found;
    }

    if ('key' in widget) {
      if (widget.key === key) {
        return widget;
      }
    }
  }
}

export function getWidgetReactKey(widget: Widget): string {
  return 'key' in widget ? widget.key : 'groupKey' in widget ? widget.groupKey : widget.name;
}

export function getFormattedValues(values: Record<string, any>, widgets: Widget[]) {
  const getFormattedValue = getFormattedValueFn(widgets);

  return Object.entries(values).reduce((acc, [key, value]) => {
    const formattedValue = getFormattedValue(key, value);
    if (formattedValue !== undefined) {
      return { ...acc, [key]: formattedValue };
    } else {
      return acc;
    }
  }, {});
}

function getFormattedValueFn(widgets: Widget[]): any | undefined {
  return function (key: string, value: any) {
    const foundWidget = findWidget(widgets, key);
    if (!foundWidget) {
      console.log('NOT FOUND FOR WIDGET:', key, value);
      return undefined;
    }

    if (value === undefined) return undefined;

    if (foundWidget.type === 'input:date') {
      return DateTime.fromISO(value).toFormat('yyyy-MM-dd');
    }
    if (foundWidget.type === 'table') {
      return (value as FormTableItemEntry<unknown>[]).map((entry) => {
        const updatedEntry: Record<string, any> = {};
        Object.entries(entry.value as Record<string, any>).forEach(([k, v]) => {
          const foundTableWidget = findWidget(foundWidget.addEntryModal.widgets, k);
          if (!foundTableWidget)
            throw new DeveloperError(
              `Widget not found within table widget for key ${k} ${v} ${JSON.stringify(
                foundWidget,
              )}`,
            );
          if (foundTableWidget.type === 'input:date') {
            updatedEntry[k] = DateTime.fromISO(v as string).toFormat('yyyy-MM-dd');
          } else if (
            foundTableWidget.type === 'input:text' ||
            foundTableWidget.type === 'input:textarea' ||
            foundTableWidget.type === 'input:number' ||
            foundTableWidget.type === 'input:time'
          ) {
            updatedEntry[k] = v === '' ? undefined : v;
          } else {
            updatedEntry[k] = v;
          }
        });
        return updatedEntry;
      });
    }

    if (foundWidget.type === 'tag-input') {
      return (value as TagInputOption[]).map(({ value, type }) => ({ value, type }));
    }

    if (foundWidget.type === 'input:radio') {
      const radioValue = value as RadioGroupTieredValue;

      if (typeof radioValue === 'string') {
        return {
          type: 'basic',
          value: radioValue,
        };
      } else {
        const key = Object.keys(radioValue)[0];
        return {
          type: 'text-input',
          value: key,
          freeText: radioValue[key],
        };
      }
    }

    if (
      foundWidget.type === 'input:text' ||
      foundWidget.type === 'input:textarea' ||
      foundWidget.type === 'input:number' ||
      foundWidget.type === 'input:time'
    ) {
      if (value === '') return undefined;
      else return value;
    }

    if (foundWidget.type === 'entry-editor') {
      if (value === '') return undefined;
      else return value.value;
    }

    return value;
  };
}

export function transformDynamic(
  interpolateStr: InterpolatableTextString,
  obj: Record<string, any>,
) {
  const { text, interpolate } = interpolateStr;

  function convertKey(key: string) {
    const found = interpolate[key];
    if (!found) return key;

    if (found.type === 'text') {
      const value = obj[found.key];
      if (!value) return '-';
      return value;
    }

    if (found.type === 'date') {
      const value = obj[found.key];
      if (!value) return '-';
      return DateTime.fromJSDate(new Date(value)).toFormat(found.format);
    }

    if (found.type === 'time') {
      const value = obj[found.key];
      if (!value) return '-';
      return DateTime.fromFormat(value, 'HH:mm', { zone: found.timezone }).toFormat(found.format);
    }

    if (found.type === 'date-diff') {
      const value1 = obj[found.key1];
      const value2 = obj[found.key2];
      if (!value1 || !value2) return '-';
      const [h1, m1] = value1.split(':');
      const [h2, m2] = value2.split(':');
      const dur1 = Duration.fromObject({ hour: h1, minute: m1 });
      const dur2 = Duration.fromObject({ hour: h2, minute: m2 });
      if (!dur1.isValid || !dur2.isValid) return '-';
      const diff = dur2.hours * 60 + dur2.minutes - (dur1.hours * 60 + dur1.minutes);
      if (Number.isNaN(diff)) return '-';

      return diff;
    }
  }

  return text.replace(/{{(.*?)}}/g, (_, key) => convertKey(key));
}
