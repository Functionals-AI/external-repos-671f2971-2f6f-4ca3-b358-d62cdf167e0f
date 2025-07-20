import { DateTime } from 'luxon';
import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useSessionContext } from '../../useSessionContext';
import { UseFormReturn } from 'react-hook-form';
import { QuestionWidget } from '@mono/telenutrition/lib/types';
import { Button } from '@/ui-components/button';
import { HistoricalEncounterValue } from 'api/types';
import { useFeatureFlags } from '@/modules/feature-flag';
import Icon from '@/ui-components/icons/Icon';
import { getWidgetReactKey } from '@/modules/widgets/helpers';

type PreviousAnswerPromptStatus = 'filled' | 'hidden' | 'untouched';

interface RenderQuestionWidgetProps {
  widgets: QuestionWidget[];
  form: UseFormReturn<any>;
}

export default function CombinedPreviousAnswerPrompt({ form, widgets }: RenderQuestionWidgetProps) {
  const { data } = useSessionContext();
  const { t } = useTranslation();
  const featureFlags = useFeatureFlags();
  const [status, setStatus] = useState<PreviousAnswerPromptStatus>(() => 'untouched');

  const existingHistoricalValues = widgets.reduce(
    (kvp, widget) => {
      const latest = Array.isArray(data.encounterData.chartingConfig.historicalEncounterValues[widget.key])
        ? data.encounterData.chartingConfig.historicalEncounterValues[widget.key]
            .filter(
              (v) =>
                DateTime.fromFormat(v.date, 'yyyy-LL-dd') <=
                DateTime.fromISO(data.appointmentDetails.appointment.startTimestamp),
            )
            .sort(
              (a, b) =>
                DateTime.fromFormat(b.date, 'yyyy-LL-dd').toMillis() -
                DateTime.fromFormat(a.date, 'yyyy-LL-dd').toMillis(),
            )[0]
        : undefined;

      if (latest) {
        kvp[widget.key] = latest;
      }

      return kvp;
    },
    {} as Record<string, HistoricalEncounterValue>,
  );

  function fillResponses() {
    for (const widget of widgets) {
      const { value } = existingHistoricalValues[widget.key];
      form.setValue(widget.key, value);
    }
    setStatus('filled');
  }

  if (status === 'hidden' || !existingHistoricalValues) return null;

  // don't show if encounter is in different status like "provider_response_required", etc
  if (data.encounterData.encounter?.encounterStatus !== 'open') return null;

  if (Object.keys(existingHistoricalValues).length === 0) return null;

  const latestDate = Object.values(existingHistoricalValues)
    .map((x) => x.date)
    .sort(
      (a, b) =>
        DateTime.fromFormat(b, 'yyyy-LL-dd').toMillis() -
        DateTime.fromFormat(a, 'yyyy-LL-dd').toMillis(),
    )[0];

  return (
    <div
      data-test={status}
      data-testid="charting-prev-answer"
      className="min-w-fit bg-neutral-100 border border-neutral-150 rounded-md p-2"
    >
      <div className="flex flex-row items-center justify-between">
        <span className="flex flex-row items-center gap-x-2">
          <Icon name="clock" size="xs" />
          <p className="text-neutral-600 text-sm">
            {t('Response from {{date}}', {
              date: DateTime.fromFormat(latestDate, 'yyyy-LL-dd').toFormat('LLL dd, yyyy'),
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
          <Button
            disabled={status === 'filled'}
            dataTestId="fill-prev-answer-button"
            variant="secondary"
            leftIcon={{ name: status === 'filled' ? 'check' : 'redo', size: 'xs' }}
            size="sm"
            onClick={fillResponses}
            className="disabled:!bg-neutral-150 disabled:!border-neutral-150"
          >
            {status === 'filled' ? <Trans>Filled</Trans> : <Trans>Fill response</Trans>}
          </Button>
        </span>
      </div>
      <div className="text-sm space-x-2">
        {widgets.map((widget) => {
          const value = existingHistoricalValues[widget.key]?.value || '-';
          return (
            <span key={getWidgetReactKey(widget)}>
              {'inputLabel' in widget ? widget['inputLabel'] : widget.label}: {value}
            </span>
          );
        })}
      </div>
    </div>
  );
}
