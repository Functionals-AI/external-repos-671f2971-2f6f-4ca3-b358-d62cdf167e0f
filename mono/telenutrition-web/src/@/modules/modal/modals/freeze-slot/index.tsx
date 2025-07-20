import React from 'react';
import { useTranslation } from 'react-i18next';

import useToaster from 'hooks/useToaster';
import usePutFreezeAppointmentSlot from 'api/provider/usePutFreezeAppointmentSlot';
import { FreezeSlotModalData } from '../../types';
import { useSpecificModalContext } from '../../context';

import Modal from '@/modules/modal/ui/modal';
import { FormV2, useForm } from '@/modules/form/form';
import { SessionDuration } from 'types/globals';
import FreezeForm from './freeze-form';
import { DateTime } from 'luxon';
import { calculateRecurringAppointments } from '@/features/patient-scheduler/helpers';
import { NonConflictingSlot } from '@/features/patient-scheduler/types';

export interface RecurringSlotForm {
  recurring: boolean;
  weekCount: string | number;
}

export default function FreezeSlotModal({
  appointmentIds,
  dateDisplay,
  timeDisplay,
  dateTime,
  appointmentsByDay,
}: FreezeSlotModalData) {
  const specificModal = useSpecificModalContext();
  const toaster = useToaster();
  const { t } = useTranslation();

  const form = useForm<RecurringSlotForm>({
    defaultValues: {
      recurring: false,
      weekCount: 1,
    },
  });

  const { post: putFreezeAppointmentSlot } = usePutFreezeAppointmentSlot();

  form.watch(['recurring']);

  const dow = dateTime?.toFormat('cccc');

  const canRecur = appointmentsByDay;

  const handleSubmit = (data: RecurringSlotForm) => {
    let freezeAppointmentIds = [
      appointmentIds.primary,
      ...(!!appointmentIds.secondary ? [appointmentIds.secondary] : []),
    ];

    let successMessage = '';

    if (canRecur && data.recurring) {
      const futureDates = calculateRecurringAppointments({
        currentDate: dateTime.toJSDate(),
        maxConflicts: 90,
        timesToRepeat:
          typeof data.weekCount === 'string' ? parseInt(data.weekCount) : data.weekCount,
        weeksToRepeat: 1,
        appointmentsByDay,
        duration: SessionDuration.Sixty,
        forceRepeatCount:
          typeof data.weekCount === 'string' ? parseInt(data.weekCount) : data.weekCount,
      });

      const bookedSlots = futureDates.filter(
        (fd) => fd.isConflict === true && fd.type === 'booked',
      );

      freezeAppointmentIds.push(
        ...futureDates
          .filter((fd) => !fd.isConflict)
          .flatMap((fd) => (fd as NonConflictingSlot).appointmentIds),
      );

      let successString = `Starting on {{date}}, {{dow}} at {{time}} will be frozen for the next {{weekCount}} weeks`;
      if (bookedSlots.length > 0) {
        successString +=
          '\n\nThe following visit(s) are booked in a slot that you are trying to freeze. If you need to make an adjustment to this visit, please do so in the visit directly.\n';
        for (const booked of bookedSlots) {
          successString += `${booked.date.toLocaleString(DateTime.DATETIME_MED)}\n`;
        }
      }

      successMessage = t(successString, {
        date: dateDisplay,
        time: timeDisplay,
        dow,
        weekCount: data.weekCount,
      });
    } else {
      freezeAppointmentIds = [
        appointmentIds.primary,
        ...(!!appointmentIds.secondary ? [appointmentIds.secondary] : []),
      ];

      successMessage = t(
        `{{date}}, at {{time}} has been frozen. You will not be scheduled for sessions at this time.`,
        {
          date: dateDisplay,
          time: timeDisplay,
        },
      );
    }

    putFreezeAppointmentSlot({
      payload: {
        appointmentIds: freezeAppointmentIds,
      },
    })
      .then(() =>
        toaster.success({
          title: t('Time slot has been frozen'),
          message: successMessage,
        }),
      )
      .catch((e) =>
        toaster.apiError({
          title: t('Failed to freeze time slot'),
          error: e,
        }),
      )
      .finally(() => specificModal.closeModal());
  };

  const maxRecurringDate = DateTime.now().plus({ years: 1 });
  const weeksAllowed = Math.min(
    25,
    Math.max(1, Math.floor(maxRecurringDate.diff(dateTime).as('weeks') + 1)),
  );

  return (
    <Modal size="md">
      <FormV2 form={form} onSubmit={handleSubmit}>
        <Modal.Header title="Freeze slot" />
        <Modal.Body>
          <FreezeForm
            form={form}
            dateTime={dateTime}
            dateDisplay={dateDisplay}
            timeDisplay={timeDisplay}
            actionLabel={t('Freeze')}
            canRecur={!!appointmentsByDay}
            maxRecurring={weeksAllowed}
          />
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Modal.Footer.SecondaryCloseButton>{t('Cancel')}</Modal.Footer.SecondaryCloseButton>
            <Modal.Footer.PrimaryButton>{t('Done')}</Modal.Footer.PrimaryButton>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
