import { DateTime } from 'luxon';
import { TimezoneDisplayValue } from '../../reschedule-calendar/context';
import { FormV2 } from '@/modules/form/form';
import { useTranslation } from 'react-i18next';
import { UseFormReturn } from 'react-hook-form';

export enum TimezoneOption {
  LOCAL = 'local',
  PATIENT = 'patient'
}

interface Props {
  providerTimezone?: string;
  patientTimezone?: string;
  form: UseFormReturn<any>;
  id: string;
}


export default function TimezonePicker({ providerTimezone, patientTimezone, form, id }: Props) {
  const { t } = useTranslation();

  const providerTimezoneLabel = DateTime.local().setZone(providerTimezone).toFormat('ZZZZ');

  const patientTimezoneLabel = DateTime.local().setZone(patientTimezone).toFormat('ZZZZ');

  return (
    <FormV2.FormButtonToggle
      form={form}
      id={id}
      className="w-full"
      defaultValue={TimezoneDisplayValue.LOCAL}
      options={[
        {
          name: t('Local time ({{providerTimezoneLabel}})', { providerTimezoneLabel }),
          value: TimezoneOption.LOCAL,
          iconName: 'clock',
        },
        {
          name: t('Member time ({{patientTimezoneLabel}})', { patientTimezoneLabel }),
          value: TimezoneOption.PATIENT,
          iconName: 'map-pin',
        },
      ]}
    />
  );
}
