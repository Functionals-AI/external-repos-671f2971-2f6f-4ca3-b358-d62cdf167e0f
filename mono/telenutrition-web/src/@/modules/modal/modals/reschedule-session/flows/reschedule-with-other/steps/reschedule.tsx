import Section, { SectionDivider } from '@/ui-components/section';
import SelectFormItem from '@/modules/form/select-item';
import {
  SwappableProvider,
  UseGetAppointmentSwappableProvidersReturn,
} from 'api/provider/useGetAppointmentSwappableProvider';
import ProviderAppointmentSection from '@/smart-components/provider-appointment/provider-appointment-section';
import { useMultiStepFormContext } from '@/modules/multi-step-form';
import { AppointmentRecord } from 'api/types';
import { useEffect } from 'react';
import { cn } from '@/utils';
import { Trans, useTranslation } from 'react-i18next';

export interface RescheduleFields {
  timeSlot?: string;
  providerId?: number;
  swappableProvider?: SwappableProvider;
}

type RescheduleProps = {
  data: UseGetAppointmentSwappableProvidersReturn;
  rescheduleAppointment: AppointmentRecord;
};

export default function Reschedule({ data, rescheduleAppointment }: RescheduleProps) {
  const { t } = useTranslation();
  const { form } = useMultiStepFormContext<RescheduleFields>();

  const providerId = form.watch('providerId');
  useEffect(() => {
    if (!providerId) return;
    form.setValue(
      'swappableProvider',
      data.allSwappable.find((p) => p.provider.providerId === Number(providerId)),
    );
  }, [providerId]);

  useEffect(() => {
    if (!data.allSwappable.length) {
      form.register('providerId', { required: true });
    }
  }, [data, form]);

  return (
    <>
      <ProviderAppointmentSection rescheduleAppointment={rescheduleAppointment} />
      <SectionDivider />
      <Section title="Switch Providers">
        {data.allSwappable.length !== 0 ? (
          <div className={cn('flex flex-col gap-y-8')}>
            <SelectFormItem
              form={form}
              id="providerId"
              label={t('Provider')}
              defaultValue={`${data.recommendedSwap?.provider.providerId}`}
              options={data.allSwappable.map((s) => ({
                value: `${s.provider.providerId}`,
                label: `${s.provider.firstName} ${s.provider.lastName}`,
              }))}
            />
          </div>
        ) : (
          <div>
            <Trans>There are no available providers to swap with.</Trans>
          </div>
        )}
      </Section>
    </>
  );
}
