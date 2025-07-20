import React, { useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { DateTime } from 'luxon';

import Section from '@/ui-components/section';
import Toggle from '@/ui-components/toggle';
import FormNumberInput from '@/modules/form/form-number-input';
import { RecurringSlotForm } from '../index';
import { AsBasicDate } from '@/modules/dates';
import DataDisplay from '@/ui-components/data-display';
import Card from '@/ui-components/card';
import { TimezoneContext } from '@/modules/dates/context';

export default function FreezeForm({
  dateTime,
  form,
  actionLabel,
  canRecur,
  maxRecurring,
  dateDisplay,
  timeDisplay,
}: {
  dateTime: DateTime;
  form: UseFormReturn<RecurringSlotForm>;
  actionLabel: string;
  canRecur?: boolean;
  maxRecurring?: number;
  dateDisplay: string;
  timeDisplay: string;
}) {
  const { t } = useTranslation();
  const [recurring] = form.watch(['recurring']);
  const timezone = useContext(TimezoneContext)?.timezone ?? 'America/Los_Angeles';

  const dowLabel = dateTime.toFormat('cccc');

  return (
    <>
      <Section title={'Time slot'}>
        <DataDisplay
          label={t('Date')}
          content={dateDisplay}
          dataTestId="date-confirm"
        />
        <DataDisplay
          label={t('Time')}
          content={timeDisplay}
          dataTestId="time-confirm"
        />
      </Section>
      {canRecur && (
        <>
          <Section.Divider />
          <Section title={t('Options')}>
            <div>
              <div className="flex flex-row mb-1">
                <Toggle
                  dataCy="recurring-toggle"
                  enabled={form.getValues().recurring}
                  setEnabled={(val) => {
                    form.setValue('recurring', val);
                  }}
                />
                <div>Recurring</div>
              </div>

              {recurring && (
                <>
                  <div className="flex flex-row items-center mb-2">
                    <div>
                      <Trans>Recurring for</Trans>
                    </div>
                    <div className="ml-1 mr-1">
                      <FormNumberInput
                        form={form}
                        id="weekCount"
                        label=""
                        min={1}
                        max={maxRecurring ?? 25}
                        decimalScale={0}
                      />
                    </div>
                    <div>
                      <Trans> week(s)</Trans>
                    </div>
                  </div>

                  <div className="text-sm text-neutral-600 mb-2">
                    <Trans>What will be set</Trans>
                  </div>

                  <Card className="mb-2">
                    <Card.Row>
                      <Card.Row.Label className="w-32">
                        <Trans>Action</Trans>
                      </Card.Row.Label>
                      <Card.Row.Col className="px-2 py-1">{actionLabel}</Card.Row.Col>
                    </Card.Row>
                    <Card.Row>
                      <Card.Row.Label className="w-32">
                        <Trans>Day</Trans>
                      </Card.Row.Label>
                      <Card.Row.Col className="px-2 py-1">{dowLabel}</Card.Row.Col>
                    </Card.Row>
                    <Card.Row>
                      <Card.Row.Label className="w-32">
                        <Trans>Time</Trans>
                      </Card.Row.Label>
                      <Card.Row.Col className="px-2 py-1">{timeDisplay}</Card.Row.Col>
                    </Card.Row>
                  </Card>
                  <div className="text-sm text-neutral-600 mb-1">
                    <Trans>
                      Existing member visits that fall on these time slots will be left in place and
                      not cancelled. You may take action on them individually.
                    </Trans>
                  </div>
                </>
              )}
            </div>
          </Section>
        </>
      )}
    </>
  );
}
