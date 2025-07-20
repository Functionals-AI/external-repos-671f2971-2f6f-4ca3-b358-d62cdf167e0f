import React, { useContext, useEffect } from 'react';
import _ from 'lodash';
import { DateTime } from 'luxon';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { Trans } from 'react-i18next';

import { TimezoneContext } from '@/modules/dates/context';
import GetErrorDislpay from '@/modules/errors/get-error-display';
import ProviderAvatarAndName from '@/smart-components/provider-avatar-and-name';
import { Button } from '@/ui-components/button';
import Card from '@/ui-components/card';
import ContainerLoading from '@/ui-components/loading/container-loading';
import RadioIcon from '@/ui-components/radio-and-checkbox/radio-icon';
import type { PatientRecord, ProviderRecordShort } from '@mono/telenutrition/lib/types';
import {
  AppointmentData,
  GroupedAppointmentsByProvider,
  useFetchAppointments,
} from 'api/useGetAppointments';
import { DeveloperError } from 'utils/errors';
import { cn } from '@/utils';
import { FormField } from '@/ui-components/form/form';
import { getSubform } from '@/modules/form/form';

export interface ProviderAppointmentSlotsListFields extends FieldValues {
  selectedProvider: ProviderRecordShort;
  selectedAppointmentData: AppointmentData;
  date: string;
}

export type ProviderAppointmentSlotsScheduleOrRescheduleProps =
  | {
      type: 'schedule';
      patientId: number;
    }
  | {
      type: 'reschedule';
      rescheduleAppointmentId: number;
    };

export default function ProviderAppointmentSlotsListWrapper<T extends FieldValues>({
  form: parentForm,
  ...props
}: {
  form: UseFormReturn<T & ProviderAppointmentSlotsListFields>;
  patient: PatientRecord;
  selfProviderId: number;
} & ProviderAppointmentSlotsScheduleOrRescheduleProps) {
  const form = getSubform<ProviderAppointmentSlotsListFields>(parentForm);
  const dateWatch = form.watch('date');
  const dateTime = DateTime.fromISO(dateWatch);
  if (!dateTime.isValid) {
    throw new DeveloperError('Invalid date time into slots list');
  }

  const timezone = useContext(TimezoneContext);
  const { isLoading, error, data, refetch } = useFetchAppointments({
    fromTime: dateTime.startOf('day').toISO(),
    toTime: dateTime.plus({ days: 1 }).startOf('day').toISO(),
    timezone: timezone?.timezone ?? undefined,
    ...(props.type === 'reschedule'
      ? { rescheduleForAppointmentId: props.rescheduleAppointmentId }
      : {
          isFollowUp: true,
          patientId: props.patientId,
        }),
  });

  const patientId = 'patientId' in props ? props.patientId : null;

  useEffect(() => {
    refetch();
  }, [dateWatch, patientId, refetch]);

  if (isLoading) return <ContainerLoading />;
  if (error) return <GetErrorDislpay refetch={refetch} error={error} />;

  const slotsByProvider = data.slots[dateTime.startOf('day').toFormat('LL/dd/yyyy')];

  if (!slotsByProvider || _.isEmpty(slotsByProvider)) {
    return (
      <div>
        <FormField
          name={'selectedAppointmentData'}
          rules={{ required: true }}
          render={() => <Trans>No slots for this day</Trans>}
        />
      </div>
    );
  }

  const filteredSlots = slotsByProvider.filter((gabp) => gabp.providerId !== props.selfProviderId);

  return (
    <ProviderAppointmentSlotsList
      slotsByProvider={filteredSlots}
      patient={props.patient}
      providers={data.providers}
      form={form}
    />
  );
}

function ProviderAppointmentSlotsList({
  slotsByProvider,
  patient,
  providers,
  form,
}: {
  slotsByProvider: GroupedAppointmentsByProvider[];
  providers: ProviderRecordShort[];
  form: UseFormReturn<ProviderAppointmentSlotsListFields>;
  patient: PatientRecord;
}) {
  return (
    <div>
      {slotsByProvider.map(({ appointments, providerId, date }) => {
        const provider = providers.find((p) => p.providerId === providerId);
        if (!provider) {
          return;
        }

        return (
          <Card key={date} className="flex flex-row p-4" dataTestId={'provider-slot'}>
            <div className="flex-1">
              <ProviderAvatarAndName provider={provider} />
            </div>
            <div className="flex-1">
              <p className="text-sm mb-2">
                <Trans>Select a time</Trans>
              </p>
              <div className="flex gap-2 flex-wrap">
                {appointments.map((slot) => {
                  return (
                    <FormField
                      key={slot.startTimestamp}
                      name={'selectedAppointmentData'}
                      rules={{ required: true }}
                      control={form.control}
                      render={({ field }) => {
                        const isSelected = _.isEqual(slot, field.value);
                        const convertedDateTime = DateTime.fromISO(slot.startTimestamp).setZone(
                          patient.timezone,
                        );

                        return (
                          <Button
                            size="sm"
                            variant={'secondary'}
                            onClick={() => {
                              field.onChange(slot);
                              form.setValue('selectedProvider', provider);
                            }}
                            className={cn('w-24 p-2', isSelected && '!bg-status-green-100')}
                            dataTestId="time-slot-option"
                          >
                            <RadioIcon
                              className="w-2 h-2"
                              variant={isSelected ? 'checked' : 'default'}
                            />
                            {convertedDateTime.toLocaleString(DateTime.TIME_SIMPLE)}
                          </Button>
                        );
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
