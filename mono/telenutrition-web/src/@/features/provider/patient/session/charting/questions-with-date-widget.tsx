import { UseFormReturn } from 'react-hook-form';
import { QuestionsWithDateWidget as IQuestionsWithDateWidget } from '@mono/telenutrition/lib/types';
import { FormField } from '@/ui-components/form/form';
import { DeveloperError } from 'utils/errors';
import { NumberFormatInput } from '@/modules/form/form-number-input';
import FormItemBox from '@/modules/form/form-item-box';
import { FormItemLabelV2 } from '@/modules/form/ui';
import { cn } from '@/utils';
import { FormControl, FormItem as RootFormItem } from '@/ui-components/form/form';
import { getSizeClassName } from '@/modules/widgets/widget-label';
import { Trans, useTranslation } from 'react-i18next';
import FormItemError from '@/modules/form/form-item-error';
import { DatePickerComponent } from '@/modules/form/form-date-picker-item';
import { useSessionContext } from '../useSessionContext';
import { DateTime } from 'luxon';
import zod from 'zod';
import { useMemo } from 'react';

interface QuestionsWithDateWidgetValue {
  date: string;
  value: string;
}

export default function QuestionsWithDateWidget({
  widget,
  form,
}: {
  widget: IQuestionsWithDateWidget;
  form: UseFormReturn<any>;
}) {
  const { t } = useTranslation();

  return (
    <FormField
      name={widget.key}
      control={form.control}
      rules={{
        validate: (value?: QuestionsWithDateWidgetValue) => {
          if (value?.date && !value?.value) {
            return t('You must have a value if a date is given');
          }
          return true;
        },
      }}
      render={({ field }) => {
        const fieldValue = field.value as QuestionsWithDateWidgetValue | undefined;

        return (
          <div className="flex flex-col gap-y-2">
            <div className="flex gap-x-2">
              <div
                className={cn('flex gap-x-1', getSizeClassName(widget.question.size ?? null, 'md'))}
              >
                {(() => {
                  const question = widget.question;
                  if (question.type === 'input:number') {
                    return (
                      <RootFormItem className={cn('bg-white', 'w-full')}>
                        <FormItemBox>
                          <FormItemLabelV2 label={question.inputLabel} required={question.required}>
                            <FormControl className="text-type-primary">
                              <NumberFormatInput
                                onChange={(e) => {
                                  let value: string | null = e.target.value;
                                  if (value === '') {
                                    value = null;
                                  }

                                  if (value === null && !fieldValue?.date) {
                                    field.onChange(null);
                                    return;
                                  } else {
                                    field.onChange({ date: fieldValue?.date, value });
                                  }
                                }}
                                min={question.min}
                                max={question.max}
                                value={fieldValue?.value ?? ''}
                                decimalScale={question.decimalScale}
                              />
                            </FormControl>
                          </FormItemLabelV2>
                        </FormItemBox>
                      </RootFormItem>
                    );
                  }

                  throw new DeveloperError('Not implemented:' + question);
                })()}
              </div>
              <div className={cn('w-full', getSizeClassName('md'))}>
                <DatePickerComponent
                  id={widget.key}
                  min={widget.minDate}
                  max={widget.maxDate}
                  inputLabel={widget.dateInputLabel}
                  value={fieldValue?.date ?? null}
                  onError={(errorMessage) => {
                    form.setError(widget.key, { type: 'validate', message: errorMessage });
                  }}
                  onChange={(isoDate) => {
                    if (!isoDate && !fieldValue?.value) {
                      field.onChange(null);
                    } else {
                      field.onChange({ value: fieldValue?.value, date: isoDate });
                    }
                  }}
                />
              </div>
            </div>
            <FormItemError />
            {widget.showHistoricalValues && <HistoricalValues widget={widget} />}
          </div>
        );
      }}
    />
  );
}

const RecordingSchema = zod.object({
  value: zod.string(),
  date: zod.string().optional(),
});

function HistoricalValues({ widget }: { widget: IQuestionsWithDateWidget }) {
  const { data } = useSessionContext();
  const { t } = useTranslation();
  const {
    encounterData: {
      chartingConfig: { historicalEncounterValues },
    },
  } = data;

  const parsedRecordings = useMemo(() => {
    const recordings = historicalEncounterValues[widget.key] ?? [];
    return recordings
      .map((recording) => {
        const parse = RecordingSchema.safeParse(recording.value);
        if (!parse.success) {
          return null;
        }

        return parse.data;
      })
      .filter(Boolean) as zod.infer<typeof RecordingSchema>[];
  }, [historicalEncounterValues, widget.key]);

  if (parsedRecordings.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-y-1">
      <p>{t('Previous recordings')}</p>
      <ul className="list-disc pl-8">
        {parsedRecordings.map((record) => (
          <li
            key={'date' in record ? record.date : record.value}
            className="text-neutral-1500 text-base"
          >
            {record.value}
            <span className="ml-2 text-neutral-600">
              {record.date ? (
                DateTime.fromISO(record.date).toFormat('LL/dd/yyyy')
              ) : (
                <Trans>Date unknown</Trans>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
