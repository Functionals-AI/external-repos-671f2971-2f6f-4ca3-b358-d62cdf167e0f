import { DateTime } from 'luxon';
import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useSessionContext } from '../../useSessionContext';
import { UseFormReturn } from 'react-hook-form';
import { QuestionWidget } from '@mono/telenutrition/lib/types';
import { Button } from '@/ui-components/button';
import Icon from '@/ui-components/icons/Icon';

type PreviousAnswerPromptStatus = 'filled' | 'hidden' | 'untouched';

interface RenderQuestionWidgetProps {
  widget: QuestionWidget;
  form: UseFormReturn<any>;
  label?: string;
}

export default function PreviousAnswerPrompt({ form, widget, label }: RenderQuestionWidgetProps) {
  const { data } = useSessionContext();
  const { t } = useTranslation();
  const existingHistoricalValues =
    data.encounterData.chartingConfig.historicalEncounterValues[widget.key];
  const [status, setStatus] = useState<PreviousAnswerPromptStatus>(() => {
    // Dismiss if this question already has a non-null value
    // We do not currently pre-populate any fields, so this would imply the RD has already answered this question on this specific encounter
    // (either by fill response or manual entering) and refreshed the page
    // const currValue = form.getValues()[widget.key];

    // if (currValue !== undefined) return 'hidden';

    return 'untouched';
  });

  function fillResponse(value: any) {
    form.setValue(widget.key, value);
    setStatus('filled');
  }

  if (status === 'hidden' || !existingHistoricalValues) return null;

  // don't show if encounter is in different status like "provider_response_required", etc
  if (data.encounterData.encounter?.encounterStatus !== 'open') return null;
  const latestHistoricalValue = existingHistoricalValues
    .filter(
      (v) =>
        DateTime.fromFormat(v.date, 'yyyy-LL-dd') <=
        DateTime.fromISO(data.appointmentDetails.appointment.startTimestamp),
    )
    .sort(
      (a, b) =>
        DateTime.fromFormat(b.date, 'yyyy-LL-dd').toMillis() -
        DateTime.fromFormat(a.date, 'yyyy-LL-dd').toMillis(),
    )[0];

  if (!latestHistoricalValue) return null;

  return (
    <div
      data-test={status}
      data-testid="charting-prev-answer"
      className="min-w-fit bg-neutral-100 border border-neutral-150 rounded-md p-2"
    >
      <div className="flex flex-row items-center justify-between">
        <span className="flex flex-row items-center gap-x-2">
          <span>{label}</span>
          <Icon name="clock" size="xs" />
          <p className="text-neutral-600 text-sm">
            {t('Response from {{date}}', {
              date: DateTime.fromFormat(latestHistoricalValue.date, 'yyyy-LL-dd').toFormat(
                'LLL dd, yyyy',
              ),
            })}
          </p>
        </span>
        <span className="flex flex-row gap-x-4 items-center">
          <Button
            dataTestId="dismiss-prev-answer-button"
            size="sm"
            variant="quaternary"
            onClick={() => setStatus('hidden')}
          >
            <Trans>Dismiss</Trans>
          </Button>
          {widget.prevAnswerPrompt === 'fillable' && (
            <Button
              disabled={status === 'filled'}
              dataTestId="fill-prev-answer-button"
              variant="secondary"
              leftIcon={{ name: status === 'filled' ? 'check' : 'redo', size: 'xs' }}
              size="sm"
              onClick={() => fillResponse(latestHistoricalValue.value)}
              className="disabled:!bg-neutral-150 disabled:!border-neutral-150"
            >
              {status === 'filled' ? <Trans>Filled</Trans> : <Trans>Fill response</Trans>}
            </Button>
          )}
        </span>
      </div>
      <div>{latestHistoricalValue.display}</div>
    </div>
  );
}
