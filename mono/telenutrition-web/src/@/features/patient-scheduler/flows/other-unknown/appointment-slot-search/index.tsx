import { Trans, useTranslation } from 'react-i18next';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { DateTime } from 'luxon';

import ProviderAppointmentSlotsList, {
  ProviderAppointmentSlotsListFields,
  ProviderAppointmentSlotsScheduleOrRescheduleProps,
} from './provider-appointment-slots-list';
import DatePickerWidget from '@/modules/form/form-date-picker-item';
import { getSubform } from '@/modules/form/form';
import type { PatientRecord } from '@mono/telenutrition/lib/types';
import { useFetchProviderMe } from 'api/provider/useFetchProviderMe';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDisplay from '@/modules/errors/get-error-display';
import useGetPatientDisabledSchedulingDays from '@/selectors/useGetPatientDisabledSchedulingDays';

type AppointmentSlotSearchFormFields = ProviderAppointmentSlotsListFields;

export default function AppointmentSlotSearch<T extends FieldValues>({
  form: parentForm,
  patient,
  ...scheduleOrRescheduleProps
}: {
  form: UseFormReturn<T & AppointmentSlotSearchFormFields>;
  patient: PatientRecord;
} & ProviderAppointmentSlotsScheduleOrRescheduleProps) {
  const form = getSubform<AppointmentSlotSearchFormFields>(parentForm);
  const { t } = useTranslation();
  const { data, error, isLoading, refetch } = useFetchProviderMe();
  const getPatientDisabledDates = useGetPatientDisabledSchedulingDays({
    patientId: patient.patientId,
    ...(scheduleOrRescheduleProps.type === 'reschedule'
      ? { rescheduleAppointmentId: scheduleOrRescheduleProps.rescheduleAppointmentId }
      : {}),
  });

  if (isLoading || getPatientDisabledDates.loading) return <ContainerLoading />;
  if (error) return <GetErrorDisplay refetch={refetch} error={error} />;
  if (getPatientDisabledDates.error) {
    return <GetErrorDisplay refetch={refetch} error={getPatientDisabledDates.error} />;
  }

  const dateWatch = form.watch('date');

  return (
    <>
      <div className="flex gap-x-2 mr-8">
        <DatePickerWidget
          form={form}
          id="date"
          inputLabel="Date"
          rules={{ required: true }}
          min={DateTime.now().toISODate()}
          disabledDates={getPatientDisabledDates.disabledDays.map((d) => ({
            date: d,
            tooltipMessage: t('Members cannot schedule more than one appointment per week.'),
          }))}
        />
        {/* <FormTagInputItemV2
          form={form}
          id="timeslots"
          inputLabel="Available times"
          rules={{ required: false }}
          options={allTimeslots.map((slot) => ({
            label: DateTime.fromObject({
              minute: parseInt(slot.minute),
              hour: slot.hour,
            }).toFormat('h:mm a'),
            value: `${slot.hour}:${slot.minute}`,
          }))}
        /> */}
      </div>
      <div>
        <h4 className="text-lg font-semibold mb-2">
          <Trans>Available dietitians</Trans>
        </h4>
        <h5 className="text-sm, text-gray-500">
          times shown in member timezone ({patient.timezone})
        </h5>
        {dateWatch ? (
          <ProviderAppointmentSlotsList
            selfProviderId={data?.provider.providerId}
            patient={patient}
            form={form}
            {...scheduleOrRescheduleProps}
          />
        ) : (
          <p className="mt-4">
            <Trans>Select a visit date to view available dietitians</Trans>
          </p>
        )}
      </div>
    </>
  );
}
