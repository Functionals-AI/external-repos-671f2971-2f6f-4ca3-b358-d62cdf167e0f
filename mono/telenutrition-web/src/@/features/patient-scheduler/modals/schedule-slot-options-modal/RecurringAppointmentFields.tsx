import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { SchedulePatientSessionFields } from '.';
import FormNumberInput from '@/modules/form/form-number-input';
import { FutureAppointmentSlot } from '../../types';
import FutureAppointments from './FutureAppointments';

export default function RecurringAppointmentFields({
  form,
  recurringAppointments,
}: {
  form: UseFormReturn<SchedulePatientSessionFields>;
  recurringAppointments: null | FutureAppointmentSlot[];
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-col gap-y-2 mt-4 ml-4">
        <div className="flex gap-x-1 items-center">
          <span className="w-12 shrink-0">{t('Every')}</span>
          <span className="block w-16">
            <FormNumberInput
              form={form}
              rules={{ required: true }}
              id="repeatEveryNumWeeks"
              decimalScale={0}
              min={0}
              max={5}
            />
          </span>
          <span>{t('week(s)')}</span>
        </div>
        <div className="flex gap-x-1 items-center">
          <span className="w-12 shrink-0">{t('For')}</span>
          <span className="block w-16">
            <FormNumberInput
              form={form}
              rules={{ required: true }}
              id="repeatForNumSessions"
              decimalScale={0}
              min={0}
              max={5}
            />
          </span>
          <span>{t('session(s)')}</span>
        </div>
      </div>
      <div>
        {recurringAppointments && recurringAppointments.length && (
          <FutureAppointments futureAppointments={recurringAppointments} />
        )}
      </div>
    </>
  );
}
