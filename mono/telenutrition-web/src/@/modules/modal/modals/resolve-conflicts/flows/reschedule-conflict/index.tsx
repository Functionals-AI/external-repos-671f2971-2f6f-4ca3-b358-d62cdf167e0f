import React from 'react';
import { AppointmentRecord } from 'api/types';
import { FormV2, useForm } from '@/modules/form/form';
import Modal from '@/modules/modal/ui/modal';
import { DateTime } from 'luxon';
import { useModal } from '@/modules/modal';
import usePutRescheduleAppointment from 'api/usePutRescheduleAppointment';
import _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { useAppStateContext } from 'state/context';
import useToaster from 'hooks/useToaster';
import FullScreenLoading from '@/ui-components/loading/full-screen-loading';
import { useDateHelpers } from '@/modules/dates';
import RescheduleCalendar, {
  RescheduleCalendarFormFields,
  RescheduleStepFormFields,
} from '@/features/reschedule-calendar';
import ProviderAppointmentSection from '@/smart-components/provider-appointment/provider-appointment-section';
import Section from '@/ui-components/section';
import { UseFormReturn } from 'react-hook-form';
import { useFetchProviderAppointments } from 'api/provider/useGetProviderAppointments';
import ContainerLoading from '@/ui-components/loading/container-loading';
import GetErrorDislpay from '@/modules/errors/get-error-display';

interface RescheduleProps {
  rescheduleAppointment: AppointmentRecord;
  onSuccess: (prevId: number, newId: number) => void;
}

export default function RescheduleConflict(props: RescheduleProps) {
  const { t } = useTranslation();
  const { rescheduleAppointment, onSuccess } = props;
  const { getAppState } = useAppStateContext();
  const modal = useModal();
  const toaster = useToaster();
  const dateHelpers = useDateHelpers();
  const fetchProviderAppointments = useFetchProviderAppointments();

  const form = useForm<RescheduleStepFormFields>({
    defaultValues: {
      date: DateTime.now(),
    },
  });
  const {
    post: putRescheduleAppointment,
    data: { isSubmitting },
  } = usePutRescheduleAppointment();

  if (fetchProviderAppointments.isLoading) {
    return <ContainerLoading />;
  }

  if (fetchProviderAppointments.error) {
    return (
      <GetErrorDislpay
        refetch={fetchProviderAppointments.refetch}
        error={fetchProviderAppointments.error}
      />
    );
  }
  const handleSubmit = (values: RescheduleStepFormFields) => {
    putRescheduleAppointment({
      payload: {
        cid: getAppState().cid!,
        oldAppointmentId: rescheduleAppointment.appointmentId,
        newAppointmentIds: values.newAppointmentIds,
        cancelReason: 'PROVIDER_UNAVAILABLE',
      },
    })
      .then((data) => {
        if (onSuccess) onSuccess(rescheduleAppointment.appointmentId, data.data.appointmentId);
        toaster.success({
          title: t('Session rescheduled'),
          message: t(
            'Session with {{firstName}} {{lastName}} has been rescheduled for {{date}}, at {{time}}',
            {
              firstName: rescheduleAppointment.patient?.firstName,
              lastName: rescheduleAppointment.patient?.lastName,
              date: values.date.toFormat('LLL dd, yyyy'),
              time: dateHelpers.asTime(values.timeISO),
            },
          ),
        });
      })
      .catch((e) =>
        toaster.apiError({
          title: t('Failure to reschedule session'),
          error: e,
        }),
      )
      .finally(modal.closeSecondary);
  };

  const appointmentsByDate = _.groupBy(fetchProviderAppointments.data.slots, (appt) => appt.date);

  return (
    <Modal size="lg">
      <FormV2 form={form} onSubmit={handleSubmit}>
        {isSubmitting && <FullScreenLoading />}
        <Modal.Header title={<Trans>Reschedule session</Trans>} />
        <Modal.Body>
          <ProviderAppointmentSection rescheduleAppointment={rescheduleAppointment} />
          <Section.Divider />
          <Section title={<Trans>Time Slot</Trans>}>
            <RescheduleCalendar
              {...{
                form: form as any as UseFormReturn<RescheduleCalendarFormFields>,
                rescheduleAppointment,
                appointmentsByDate,
                providerTimezone: fetchProviderAppointments.data.timezone,
              }}
            />
          </Section>
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Modal.Footer.SecondaryCloseButton onClick={() => modal.closeSecondary()}>
              <Trans>Keep session</Trans>
            </Modal.Footer.SecondaryCloseButton>
            <Modal.Footer.PrimaryButton disabled={!form.formState.isValid}>
              <Trans>Next</Trans>
            </Modal.Footer.PrimaryButton>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
