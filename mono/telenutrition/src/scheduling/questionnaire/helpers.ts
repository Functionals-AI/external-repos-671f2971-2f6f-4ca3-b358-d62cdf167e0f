import { z } from 'zod';
import { ChartingConfig } from '../questionnaire/questionnaires/charting_v1';
import { isQuestionWidget, QuestionWidget, Widget } from '../questionnaire/types';
import { getPatientAttributeOptions } from '../../patient-attribute-options';
import { IContext } from '@mono/common/lib/context';
import { zc } from '@mono/common/lib/zod-custom';
import * as PhoneValidation from 'phone';

type FoundWidget = {
  widget: Widget;
  foundKey: string;
};

function findWidget(widgets: Widget[], key: string, foundKey: string): FoundWidget | undefined {
  for (const widget of widgets) {
    if ('key' in widget) {
      if (widget.key === key) return { widget, foundKey };
    } else if (widget.type === 'conditional') {
      const found = findWidget(widget.widgets, key, foundKey);
      if (found) return found;
    } else if (widget.type === 'grid') {
      const found = findWidget(
        widget.cols.map((col) => col.widget),
        key,
        foundKey,
      );
      if (found) return found;
    } else if (widget.type === 'group') {
      const found = findWidget(widget.widgets, key, `${widget.groupKey}.${key}`);
      if (found) return found;
    } else if (widget.type === 'flex-row') {
      const found = findWidget(
        widget.widgets.map((w) => w.widget),
        key,
        foundKey,
      );
      if (found) return found;
    }
  }
}

export function findWidgetInConfig(config: ChartingConfig, key: string): FoundWidget | undefined {
  for (const configGroup of [config.chartingGroups]) {
    const configGroupKey = configGroup.key;
    for (const group of configGroup.groups) {
      const found = findWidget(group.widgets, key, `${configGroupKey}.${group.groupKey}`);
      if (found) return found;
    }
  }
}

export function extractQuestionWidgets(widget: Widget): QuestionWidget[] {
  if (isQuestionWidget(widget)) {
    return [widget];
  } else if ('widgets' in widget) {
    const widgets = widget.type === 'flex-row' ? widget.widgets.map((w) => w.widget) : widget.widgets;
    return widgets.flatMap((w) => extractQuestionWidgets(w));
  } else if (widget.type === 'grid') {
    return widget.cols.flatMap((w) => extractQuestionWidgets(w.widget));
  }
  return [];
}

type PatientAttributeOptionGroups = ReturnType<typeof getPatientAttributeOptions>;

type Option = { label: string; value: string };

export function alphabeticalSort(a: Option, b: Option) {
  return a.label.localeCompare(b.label);
}

export function getAllPatientAttributeOptions<PatientAttributeName extends keyof PatientAttributeOptionGroups>(
  context: IContext,
  patientAttributeName: PatientAttributeName,
  sort: 'alphabetical' | 'db_standard' = 'db_standard',
): Option[] {
  const optionGroups = getPatientAttributeOptions(context);
  const options = (
    Object.values(optionGroups[patientAttributeName]) as {
      option_text: string;
      option_code: string;
      is_inactive?: boolean;
    }[]
  )
    .filter((opt) => !opt.is_inactive)
    .map((o) => ({ label: o.option_text, value: o.option_code }));

  const sorted = sort === 'alphabetical' ? options.sort(alphabeticalSort) : options;

  return sorted;
}

/**
 * This code chunk is for ensuring the defined map correctly defines a schema for each question widget type,
 * but it exports the object createed as "const" which gives consumers direct access to the zod schema type per widget type.
 *
 * i.e.
 * const schema = questionSchemaMap['input:radio'] // -> z.string()
 * otherwise this would just give back z.Schema()
 */

function createConstrainedIdFn<Constraint extends Record<PropertyKey, unknown>>(): <T extends Constraint>(obj: T) => T {
  return (obj) => obj;
}

type QuestionWidgetType = QuestionWidget['type'];
type QuestionWidgetSchemaMapType = { [key in QuestionWidgetType]: z.Schema };

export const questionSchemaMap = createConstrainedIdFn<QuestionWidgetSchemaMapType>()({
  'input:radio-v2': z.string(),
  'input:radio': z.string(),
  'input:number': z.coerce.number(),
  'input:text': z.string().trim(),
  'input:date': zc.dateString(),
  'input:time': z.string().regex(/^([01][0-9]|2[0-3]):([0-5][0-9])$/),
  'input:textarea': z.string().trim(),
  'input:select': z.string(),

  // TODO: consider doing an array instead of object
  'multi-select': z.record(z.string(), z.coerce.boolean()),
  'tag-input': z.array(z.string()),
  'entry-editor': z.array(z.string()),
  'rich-text': z.string(),
  'questions-with-date': z.object({
    value: z.string(),
    date: zc.dateString().nullish(),
  }),
  'single-checkbox': z.coerce.boolean(),
  'conditional-tag-input': z.array(z.string()),
  // TODO: add valdation, from "phone" lib
  'input:phone': z.any(),
  'tag-input-v2': z.array(z.string()),
  'tiered-inputs': z.record(z.string(), z.any()),

  // UNUSED
  table: z.any(),
  'radio-table': z.any(), // z.record(z.string(), z.string()),
  'alert-box-message': z.any(),
  'input:combobox': z.string(),
} as const);

export function getSchemaForWidget(widget: QuestionWidget) {
  switch (widget.type) {
    case 'input:number': {
      let schema = z.coerce.number();
      if (widget.min) {
        schema = schema.min(widget.min);
      }
      if (widget.max) {
        schema = schema.max(widget.max);
      }
      return schema;
    }
    case 'input:radio-v2': {
      const options = widget.options.flatMap((option) =>
        'options' in option ? option.options.map((o) => o.value) : option.value,
      );
      return z.string().refine((val) => options.includes(val));
    }
    case 'input:select': {
      const options = widget.options.flatMap((option) =>
        'options' in option ? option.options.map((o) => o.value) : option.value,
      );
      return z.string().refine((val) => options.includes(val));
    }
    case 'multi-select': {
      const options = widget.options.map((option) => option.value);
      return z
        .record(z.string(), z.coerce.boolean())
        .refine((val) => Object.keys(val).every((k) => options.includes(k)));
    }
    case 'input:combobox': {
      const options = widget.options.flatMap((option) =>
        'options' in option
          ? option.options.map((o) => o.value)
          : option.type === 'conditional'
            ? option.then
            : option.value,
      );
      return z.string().refine((val) => options.includes(val));
    }
    case 'entry-editor': {
      const options = widget.options.map((option) => option.value);
      return z.array(z.string()).refine((val) => val.every((o) => options.includes(o)));
    }
    case 'tag-input': {
      const options = widget.options.map((option) => option.value);
      return z.array(z.string()).refine((val) => val.every((o) => options.includes(o)));
    }
    case 'tag-input-v2': {
      const options = widget.options.map((option) => option.value);
      return z.array(z.string()).refine((val) => val.every((o) => options.includes(o)));
    }
    case 'conditional-tag-input': {
      const options = widget.options.map((option) => option.value);
      return z.array(z.string()).refine((val) => val.every((o) => options.includes(o)));
    }
    case 'tiered-inputs': {
      // TODO: handle input value validation
      const options = widget.inputs.map((input) => input.key);
      return z.record(z.string(), z.any()).refine((val) => Object.keys(val).every((k) => options.includes(k)));
    }
    case 'input:date':
      return zc.dateString();
    case 'input:phone':
      return z.string().refine((phone) => PhoneValidation.phone(phone).isValid);
    case 'input:radio':
      return z.string();
    case 'input:text':
      return z.string().trim();
    case 'input:textarea':
      return z.string().trim();
    case 'rich-text':
      return z.string().trim();
    case 'input:time':
      return z.string().regex(/^([01][0-9]|2[0-3]):([0-5][0-9])$/);
    case 'single-checkbox':
      return z.coerce.boolean();
    case 'questions-with-date':
      return z.object({
        value: z.string(),
        date: zc.dateString().nullish(),
      });
    case 'table':
      return z.any();
    case 'radio-table':
      return z.any();
    case 'alert-box-message':
      return z.any();
    default:
      widget satisfies never; // A case is missing
      throw new Error(`Unhandled case for widget schema`);
  }
}

export default { findWidgetInConfig, questionSchemaMap };
