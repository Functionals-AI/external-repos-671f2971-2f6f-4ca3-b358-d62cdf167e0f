'use client';

import { Trans, useTranslation } from 'react-i18next';
import Metrics from './metrics';
import { ProviderMetricsDateRangeType } from 'api/provider/useFetchProviderPerformanceMetrics';
import DatePickerWidget from '@/modules/form/form-date-picker-item';
import { FormV2, FormV2ContextProvider, useForm } from '@/modules/form/form';
import { useEffect } from 'react';
import { DateTime } from 'luxon';

interface FormFields {
  dateRangeType: ProviderMetricsDateRangeType;
  startDate?: string;
  endDate?: string;
}

export default function ProviderPerformanceMetricsFeature() {
  const { t } = useTranslation();
  const map: Record<ProviderMetricsDateRangeType, { label: string }> = {
    [ProviderMetricsDateRangeType.Today]: { label: t('Today') },
    [ProviderMetricsDateRangeType.WeekToDate]: { label: t('Week to date') },
    [ProviderMetricsDateRangeType.MonthToDate]: { label: t('Month to date') },
    [ProviderMetricsDateRangeType.LastMonth]: { label: t('Last month') },
    [ProviderMetricsDateRangeType.Custom]: { label: t('Custom') },
  };
  const form = useForm<FormFields>({
    defaultValues: {
      dateRangeType: ProviderMetricsDateRangeType.MonthToDate,
    },
  });

  const [dateRangeType, startDate, endDate] = form.watch(['dateRangeType', 'startDate', 'endDate']);

  useEffect(() => {
    if (dateRangeType !== ProviderMetricsDateRangeType.Custom) {
      form.setValue('startDate', undefined);
      form.setValue('endDate', undefined);
    }
  }, [dateRangeType]);

  useEffect(() => {
    if (!startDate && endDate) {
      form.setValue('endDate', undefined);
    }

    if (endDate && startDate) {
      const startDateDT = DateTime.fromISO(startDate);
      const endDateDT = DateTime.fromISO(endDate);
      if (endDateDT < startDateDT) {
        form.setValue('endDate', undefined);
      } else if (endDate > startDateDT.plus({ year: 1 }).toISODate()!) {
        form.setValue('endDate', startDateDT.plus({ year: 1 }).toISODate()!);
      }
    }
  }, [startDate, endDate]);

  return (
    <FormV2
      className="flex flex-col gap-4 px-4 py-4 h-full w-full overflow-scroll"
      form={form}
      onSubmit={() => {}}
    >
      <FormV2ContextProvider value={{ config: { showOptionalLabel: false } }}>
        <div className="w-full flex flex-col gap-y-2 max-w-6xl">
          <div className="flex gap-x-2 w-full items-center">
            <FormV2.FormButtonToggle
              form={form}
              id="dateRangeType"
              className="h-10"
              options={[
                { name: map.today.label, value: ProviderMetricsDateRangeType.Today },
                { name: map.week_to_date.label, value: ProviderMetricsDateRangeType.WeekToDate },
                { name: map.month_to_date.label, value: ProviderMetricsDateRangeType.MonthToDate },
                { name: map.last_month.label, value: ProviderMetricsDateRangeType.LastMonth },
                { name: map.custom.label, value: ProviderMetricsDateRangeType.Custom },
              ]}
            />
            <DatePickerWidget
              inputLabel={t('Start date')}
              disabled={dateRangeType !== ProviderMetricsDateRangeType.Custom}
              form={form}
              id="startDate"
              min={DateTime.now().minus({ years: 3 }).toISODate()}
              max={DateTime.now().endOf('day').toISODate()!}
            />
            <DatePickerWidget
              inputLabel={t('End date')}
              disabled={dateRangeType !== ProviderMetricsDateRangeType.Custom || !startDate}
              form={form}
              id="endDate"
              min={startDate}
              max={
                startDate
                  ? DateTime.min(
                      DateTime.fromISO(startDate).plus({ year: 1, day: 1 }),
                      DateTime.now().endOf('day'),
                    ).toISODate()!
                  : DateTime.now().endOf('day').toISODate()!
              }
            />
          </div>
          <div className="w-full">
            {dateRangeType !== ProviderMetricsDateRangeType.Custom ? (
              <Metrics metricsDateRangeConfig={dateRangeType} />
            ) : startDate && endDate ? (
              <Metrics
                metricsDateRangeConfig={dateRangeType}
                startDate={startDate}
                endDate={endDate}
              />
            ) : (
              <div className="h-[10rem] w-full gap-y-2 flex flex-col items-center justify-center">
                <p>
                  <Trans>Please enter a date range</Trans>
                </p>
                <p className="font-bold">
                  <Trans>Custom range can only include 1 year at maximum</Trans>
                </p>
              </div>
            )}
          </div>
        </div>
      </FormV2ContextProvider>
    </FormV2>
  );
}
