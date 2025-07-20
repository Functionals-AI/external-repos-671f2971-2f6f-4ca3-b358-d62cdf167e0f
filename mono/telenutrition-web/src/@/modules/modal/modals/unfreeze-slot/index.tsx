import React from 'react';

import useToaster from 'hooks/useToaster';
import { UnfreezeSlotModalData } from '../../types';
import { DateTime } from 'luxon';
import usePostProviderCreateAppointmentSlotV2 from 'api/provider/usePostProviderCreateAppointmentSlotV2';
import { useSpecificModalContext } from '../../context';
import { useTranslation } from 'react-i18next';
import { useDateHelpers } from '@/modules/dates';
import { FormV2, useForm } from '@/modules/form/form';
import usePostProviderCreateRecurringSlots from 'api/provider/usePostProviderCreateRecurringSlots';
import Modal from '@/modules/modal/ui/modal';
import FreezeForm from '../freeze-slot/freeze-form';
import { RecurringSlotForm } from '../freeze-slot';

export default function UnfreezeSlotModal({ date, duration, timeDisplay }: UnfreezeSlotModalData) {
  const toaster = useToaster();
  const specificModal = useSpecificModalContext();
  const { t } = useTranslation();
  const dateHelpers = useDateHelpers();

  const form = useForm<RecurringSlotForm>({
    defaultValues: {
      recurring: false,
      weekCount: 1,
    },
  });

  const dateDisplay = dateHelpers.asBasicDate(date);
  const dateTime = DateTime.fromJSDate(date);
  const dow = dateTime.toFormat('cccc');

  const { post: postProviderCreateAppointmentSlot } = usePostProviderCreateAppointmentSlotV2();

  const { post: postProviderCreateRecurringSlots } = usePostProviderCreateRecurringSlots();

  function handleCreateAppointmentSlot() {
    postProviderCreateAppointmentSlot({
      payload: {
        date: date.toISOString(),
        duration,
      },
    })
      .then(() =>
        toaster.success({
          title: t('Time slot has been unfrozen'),
          message: t(
            `{{date}}, at {{time}} has been unfrozen. You can now schedule appointments at this time.`,
            { date: dateDisplay, time: timeDisplay },
          ),
        }),
      )
      .catch((e) =>
        toaster.apiError({
          title: t('Failed to unfreeze time slot'),
          error: e,
        }),
      )
      .finally(() => specificModal.closeModal());
  }

  function handleCreateRecurringAppointmentSlots(data: RecurringSlotForm) {
    const weekCount =
      typeof data.weekCount === 'string' ? parseInt(data.weekCount) : data.weekCount;

    postProviderCreateRecurringSlots({
      payload: {
        date: date.toISOString(),
        weekCount,
        duration,
      },
    })
      .then(() =>
        toaster.success({
          title: t('Multiple slots unfrozen'),
          message: t(
            `Starting on {{date}}, {{dow}} at {{time}} will be unfrozen for the next {{weekCount}} weeks`,
            { date: dateDisplay, time: timeDisplay, dow, weekCount },
          ),
        }),
      )
      .catch((e) =>
        toaster.apiError({
          title: t('Failed to unfreeze time slots'),
          error: e,
        }),
      )
      .finally(() => specificModal.closeModal());
  }

  const handleSubmit = (data: RecurringSlotForm) => {
    if (data.recurring) {
      handleCreateRecurringAppointmentSlots(data);
    } else {
      handleCreateAppointmentSlot();
    }
  };

  const maxRecurringDate = DateTime.now().plus({ years: 1 });
  const weeksAllowed = Math.min(
    25,
    Math.max(1, Math.floor(maxRecurringDate.diff(dateTime).as('weeks') + 1)),
  );

  return (
    <Modal size="md">
      <FormV2 form={form} onSubmit={handleSubmit}>
        <Modal.Header title="Unfreeze slot" />
        <Modal.Body>
          <FreezeForm
            form={form}
            dateTime={dateTime}
            dateDisplay={dateDisplay}
            timeDisplay={timeDisplay}
            actionLabel={t('Unfreeze')}
            canRecur
            maxRecurring={weeksAllowed}
          />
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Modal.Footer.SecondaryCloseButton onClick={() => specificModal.closeModal()}>
              {t('Cancel')}
            </Modal.Footer.SecondaryCloseButton>
            <Modal.Footer.PrimaryButton>{t('Done')}</Modal.Footer.PrimaryButton>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
