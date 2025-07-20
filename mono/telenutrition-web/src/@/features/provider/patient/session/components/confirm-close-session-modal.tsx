import { FormV2, useForm } from '@/modules/form/form';
import RadioGroupV2 from '@/modules/form/radio-group-v2';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import Modal from '@/modules/modal/ui/modal';
import DataDisplay from '@/ui-components/data-display';
import Icon from '@/ui-components/icons/Icon';
import Section from '@/ui-components/section';
import { FetchAppointmentEncounterInfoResult } from 'api/encounter/useFetchAppointmentEncounterInfo';
import { ExtendedAppEncounterData } from 'api/types';
import { DateTime, Duration } from 'luxon';
import { Trans, useTranslation } from 'react-i18next';
import CheckBox from '@/ui-components/radio-and-checkbox/checkbox';

export enum CloseSessionActionType {
  SaveAndKeepInMyTasks = 'SaveAndKeepInMyTasks',
  SendToMdOversight = 'SendToMdOversight',
  FinalizeAndSubmitToBilling = 'FinalizeAndSubmitToBilling',
}

interface ConfirmCloseSessionModalFormFields {
  action: CloseSessionActionType;
  confirm: boolean;
}

interface ConfirmCloseSessionModalProps {
  data: FetchAppointmentEncounterInfoResult;
  onConfirm: (values: ConfirmCloseSessionModalFormFields) => void;
  formData: {
    startDuration: Duration;
    endDuration: Duration;
    unitsBilled: string;
  };
}

export default function ConfirmCloseSessionModal({
  onConfirm,
  data,
  formData: { startDuration, endDuration, unitsBilled },
}: ConfirmCloseSessionModalProps) {
  const form = useForm<ConfirmCloseSessionModalFormFields>();
  const { t } = useTranslation();
  const memberHelpers = useMemberHelpers();

  const {
    appointmentDetails: { providerName, appointment },
    encounterData,
  } = data;

  const radioItems: Record<CloseSessionActionType, { title: string; disabled?: boolean }> = {
    [CloseSessionActionType.SaveAndKeepInMyTasks]: {
      title: t('Save progress and keep in my tasks'),
    },
    [CloseSessionActionType.SendToMdOversight]: {
      title: t('Send to physician for review'),
      disabled: (encounterData as ExtendedAppEncounterData).oversightRequired ? false : true,
    },
    [CloseSessionActionType.FinalizeAndSubmitToBilling]: {
      title: t('Finalize and submit to billing'),
      disabled: (encounterData as ExtendedAppEncounterData).oversightRequired ? true : false,
    },
  };

  function handleSubmit(values: ConfirmCloseSessionModalFormFields) {
    onConfirm(values);
  }

  return (
    <Modal size="md">
      <FormV2 form={form} onSubmit={handleSubmit}>
        <Modal.Header title={<Trans>Close session</Trans>} />
        <Modal.Body>
          <Section title={<Trans>Session overview</Trans>}>
            <DataDisplay
              label={<Trans>Member</Trans>}
              content={memberHelpers.getDisplayNameFromAppointment({ appointment })}
              footer={<p className="text-neutral-600 text-sm">{appointment.patient?.patientId}</p>}
            />
            <DataDisplay
              label={<Trans>Session date</Trans>}
              content={
                <div className="flex flex-col gap-y-1 text-base">
                  <span>
                    {DateTime.fromISO(appointment.startTimestamp).toFormat('dd LLL, yyyy')}
                  </span>
                  <span className="flex gap-x-2 items-center">
                    {DateTime.fromFormat(startDuration.toFormat('hh:mm'), 'hh:mm').toFormat(
                      'h:mm a',
                    )}{' '}
                    <Icon size="sm" name="arrow-right" color="neutral" />{' '}
                    {DateTime.fromFormat(endDuration.toFormat('hh:mm'), 'hh:mm').toFormat('h:mm a')}
                    <span className="text-neutral-400 text-sm">
                      {t('{{minutes}} minutes', {
                        minutes: endDuration.minus(startDuration).as('minutes'),
                      })}
                    </span>
                  </span>
                </div>
              }
            />
            <DataDisplay label={<Trans>Units billed</Trans>} content={unitsBilled} />
            <RadioGroupV2
              label={<Trans>Next action</Trans>}
              form={form}
              id={'action'}
              rules={{ required: true }}
              options={Object.entries(radioItems).map(([key, item]) => ({
                label: item.title,
                value: key,
                disabled: item.disabled,
              }))}
            />
          </Section>
          <Section.Divider />
          <Section title={<Trans>Signature</Trans>}>
            <CheckBox
              className="mt-2"
              form={form}
              id={'confirm'}
              rules={{ required: true }}
              label={<Trans>I confirm that the above information is correct</Trans>}
            />
            <DataDisplay label={<Trans>Name</Trans>} content={providerName} />
            <DataDisplay
              label={<Trans>Timestamp</Trans>}
              content={DateTime.now().toFormat('dd LLL, yyyy')}
              footer={
                <p className="text-sm -mt-1 text-neutral-600">
                  {DateTime.now().toFormat('h:mm a')}
                </p>
              }
            />
          </Section>
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Modal.Footer.SecondaryCloseButton>
              <Trans>Cancel</Trans>
            </Modal.Footer.SecondaryCloseButton>
            <Modal.Footer.PrimaryButton>
              <Trans>Submit</Trans>
            </Modal.Footer.PrimaryButton>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
