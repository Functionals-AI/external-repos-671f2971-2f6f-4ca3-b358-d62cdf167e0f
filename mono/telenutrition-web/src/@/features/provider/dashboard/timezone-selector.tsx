import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormV2 } from '../../../modules/form/form';
import usePutProviderTimezone from '../../../../api/provider/usePutProviderTimezone';
import useToaster from 'hooks/useToaster';
import { useTranslation } from 'react-i18next';

const timezones = [
  'America/Puerto_Rico',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Juneau',
  'America/Phoenix',
  'Pacific/Honolulu',
];

type Timezone = (typeof timezones)[number];

export const TimezoneCodes = {
  'America/Puerto_Rico': 'US/Atlantic',
  'America/New_York': 'US/Eastern',
  'America/Chicago': 'US/Central',
  'America/Denver': 'US/Mountain',
  'America/Los_Angeles': 'US/Pacific',
  'America/Juneau': 'US/Alaska',
  'America/Phoenix': 'US/Arizona',
  'Pacific/Honolulu': 'US/Aleutian',
} as const satisfies Record<Timezone, string>;

type T = keyof typeof TimezoneCodes;

type TimezoneCode = (typeof TimezoneCodes)[T];

export const TimezoneNames = {
  'US/Central': 'Central Time',
  'US/Eastern': 'Eastern Time',
  'US/Arizona': 'Arizona Time',
  'US/Mountain': 'Mountain Time',
  'US/Pacific': 'Pacific Time',
  'US/Alaska': 'Alaska Time',
  'US/Aleutian': 'Aleutian Time',
  'US/Atlantic': 'Atlantic Time',
} satisfies Record<TimezoneCode, string>;

interface TimezoneSelectorValue {
  timezone?: string;
}

export default function TimezoneSelector({ initialValue }: { initialValue: string }) {
  const form = useForm<TimezoneSelectorValue>({
    mode: 'onChange',
    defaultValues: {
      timezone: initialValue,
    },
  });
  const toaster = useToaster();
  const { t } = useTranslation();
  const { post } = usePutProviderTimezone();
  const timezone = form.watch('timezone');

  useEffect(() => {
    if (timezone && timezone !== initialValue) {
      post({ payload: { timezone } })
        .then(() => {
          toaster.success({ title: t('Successfully updated timezone'), message: '' });
        })
        .catch((e) => {
          toaster.apiError({ title: t('Failed to update timezone'), error: e });
        })
        .finally(() => {});
    }
  }, [timezone]);
  return (
    <FormV2 form={form} onSubmit={() => {}}>
      <FormV2.FormSelectItem
        className="w-fit !h-fit"
        form={form}
        id="timezone"
        rules={{ required: true }}
        options={timezones.map((tz: Timezone) => ({
          label: TimezoneNames[TimezoneCodes[tz as keyof typeof TimezoneCodes]],
          value: tz,
        }))}
      />
    </FormV2>
  );
}
