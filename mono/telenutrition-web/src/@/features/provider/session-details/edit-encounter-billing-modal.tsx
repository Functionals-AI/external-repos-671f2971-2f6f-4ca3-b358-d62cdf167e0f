import { FormV2, useForm } from '@/modules/form/form';
import FormComboBoxItem from '@/modules/form/form-combo-box';
import FormNumberInput from '@/modules/form/form-number-input';
import useMemberHelpers from '@/modules/member/useMemberHelpers';
import { useSpecificModalContext } from '@/modules/modal/context';
import Modal from '@/modules/modal/ui/modal';
import { Button } from '@/ui-components/button';
import DataDisplay from '@/ui-components/data-display';
import Icon from '@/ui-components/icons/Icon';
import Section from '@/ui-components/section';
import TextArea from '@/ui-components/text-area';
import usePostRequestEncounterAmmendment from 'api/encounter/usePostRequestEncounterAmmendment';
import { AppointmentRecord } from 'api/types';
import type { AppointmentEncounterRecord, ProviderRecord } from '@mono/telenutrition/lib/types';
import useToaster from 'hooks/useToaster';
import { DateTime } from 'luxon';
import { Trans, useTranslation } from 'react-i18next';

const billingCPTcodeOptions: { label: string; value: string }[] = [
  { label: '97802', value: '97802' },
  { label: '97803', value: '97803' },
  { label: '99202', value: '99202' },
  { label: '99203', value: '99203' },
  { label: '99204', value: '99204' },
  { label: '99205', value: '99205' },
  { label: '99212', value: '99212' },
  { label: '99213', value: '99213' },
  { label: '99214', value: '99214' },
  { label: '99215', value: '99215' },
  { label: 'S9470', value: 'S9470' },
];

interface EditEncounterBillingFormFields {
  unitsBilled: number;
  billingCode: string;
  reason: string;
  comments: string;
}

interface EditEncounterBillingModalProps {
  encounter: AppointmentEncounterRecord;
  appointment: AppointmentRecord;
  provider: ProviderRecord;
}

export default function EditEncounterBillingModal({
  encounter,
  appointment,
  provider,
}: EditEncounterBillingModalProps) {
  const { post: postRequestEncounterAmmendment } = usePostRequestEncounterAmmendment({
    encounterId: encounter.encounterId,
  });
  const form = useForm<EditEncounterBillingFormFields>({
    defaultValues: {
      unitsBilled: encounter.unitsBilled,
      billingCode: encounter.billingCode,
    },
  });
  const modal = useSpecificModalContext();

  const memberHelpers = useMemberHelpers();
  const { t } = useTranslation();
  const toaster = useToaster();

  const amendmentReasonSchema: { label: string; value: string }[] = [
    { label: t('Technical error'), value: 'technical_error' },
    { label: t('Duration unit error'), value: 'duration_unit_error' },
    { label: t('Incorrect CPT code'), value: 'incorrect_cpt_code' },
    { label: t('Entered incorrect billing units (typo)'), value: 'typo' },
    { label: t('Other'), value: 'other' },
  ];

  function handleSubmit(values: EditEncounterBillingFormFields) {
    postRequestEncounterAmmendment({
      payload: {
        unitsBilled: values.unitsBilled,
        cptCode: values.billingCode,
        reason: values.reason,
        comments: values.comments,
      },
    })
      .then(() => {
        toaster.success({
          title: t('Request submitted'),
          message: (
            <div className="flex flex-col gap-y-1">
              <p className="mb-2">
                <Trans>Your request for a billing edit was submitted.</Trans>
              </p>
              <p>{t('Units billed: {{unitsBilled}}', { unitsBilled: values.unitsBilled })}</p>
              <p>{t('Billing code: {{billingCode}}', { billingCode: values.billingCode })}</p>
              <p>
                {t('Reason: {{reason}}', {
                  reason: amendmentReasonSchema.find((o) => o.value === values.reason)?.label ?? '',
                })}
              </p>
            </div>
          ),
        });
        modal.closeModal();
      })
      .catch((error) => {
        toaster.apiError({ title: t('Something went wrong'), error });
      });
  }

  const startTimeDT = encounter.actualStarttime
    ? DateTime.fromISO(encounter.actualStarttime)
    : undefined;
  const endTimeDT = encounter.actualEndtime ? DateTime.fromISO(encounter.actualEndtime) : undefined;

  return (
    <Modal size="md">
      <FormV2 form={form} onSubmit={handleSubmit}>
        <Modal.Header title={<Trans>Request billing edit</Trans>} />
        <Modal.Body>
          <Section title={<Trans>Session overview</Trans>}>
            <DataDisplay
              label={<Trans>Member</Trans>}
              content={memberHelpers.getDisplayNameFromAppointment({ appointment })}
              footer={<p className="text-neutral-600 text-sm">{appointment.patient?.patientId}</p>}
            />
            <DataDisplay
              label={<Trans>Session date</Trans>}
              content={DateTime.fromISO(appointment.startTimestamp).toFormat('d LLL, yyyy')}
            />
            <DataDisplay
              label={<Trans>Session time</Trans>}
              content={
                <p className="flex gap-x-1 items-center">
                  {startTimeDT?.toFormat('h:mm a')}{' '}
                  {<Icon name="arrow-right" color="neutral" size="sm" />}{' '}
                  {endTimeDT?.toFormat('h:mm a')}
                  {startTimeDT?.isValid && endTimeDT?.isValid && (
                    <span className="text-neutral-600 ml-1">
                      (
                      {t('{{minutes}} minutes', {
                        minutes: endTimeDT.diff(startTimeDT).as('minutes').toFixed(0),
                      })}
                      )
                    </span>
                  )}
                </p>
              }
            />
            <DataDisplay label={<Trans>Units billed</Trans>} content={encounter.unitsBilled} />
          </Section>
          <Section.Divider />
          <Section title={<Trans>Billing updates</Trans>}>
            <FormNumberInput
              form={form}
              id="unitsBilled"
              label={<Trans>Units billed</Trans>}
              rules={{ required: true }}
              min={1}
              max={8}
            />
            <FormComboBoxItem
              form={form}
              id="billingCode"
              label={<Trans>Billing / CPT code</Trans>}
              options={billingCPTcodeOptions}
              rules={{ required: true }}
            />
            <FormComboBoxItem
              form={form}
              id="reason"
              label={<Trans>Reason</Trans>}
              options={amendmentReasonSchema}
              rules={{ required: true }}
            />
            <TextArea form={form} id="comments" label={<Trans>Comments</Trans>} />
          </Section>
          <Section.Divider />
          <Section title={<Trans>Signature</Trans>}>
            <DataDisplay label={<Trans>Name</Trans>} content={provider.name} />
            <DataDisplay
              label={<Trans>Timestamp</Trans>}
              content={DateTime.now().toFormat('d LLL yyyy')}
              footer={
                <p className="text-neutral-600 text-sm">
                  {DateTime.now().toFormat('h:mm a (ZZZZ)')}
                </p>
              }
            />
          </Section>
        </Modal.Body>
        <Modal.Footer className="justify-end">
          <Modal.Footer.ButtonGroup>
            <Button variant="secondary" onClick={() => modal.closeModal()}>
              <Trans>Cancel</Trans>
            </Button>
            <Button variant="primary" type="submit">
              <Trans>Submit Request</Trans>
            </Button>
          </Modal.Footer.ButtonGroup>
        </Modal.Footer>
      </FormV2>
    </Modal>
  );
}
